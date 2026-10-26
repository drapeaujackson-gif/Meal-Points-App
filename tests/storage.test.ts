import assert from 'node:assert/strict';
import test from 'node:test';
import { readState, writeState, STORAGE_KEY } from '../src/lib/storage.ts';
import type { AppState } from '../src/lib/model.ts';

const validState: AppState = {
  version: 1,
  plan: { name: 'Fall plan', startingBalance: 10000, endDate: '2026-12-15' },
  meals: [{ id: 'a', location: 'Campus café', points: 1050, category: 'Lunch', date: '2026-10-26', createdAt: '2026-10-26T12:00:00.000Z' }],
};

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

test('valid state survives a real serialization round-trip and uses the namespaced key', () => {
  const storage = new MemoryStorage();
  assert.deepEqual(writeState(storage, validState), { error: null });
  assert.equal(storage.getItem(STORAGE_KEY), JSON.stringify(validState));
  assert.deepEqual(readState(storage), { state: validState, error: null, raw: JSON.stringify(validState) });
});

test('a new browser starts without data and reading does not write', () => {
  const storage = new MemoryStorage();
  assert.deepEqual(readState(storage), { state: { version: 1, plan: null, meals: [] }, error: null, raw: null });
  assert.equal(storage.values.size, 0);
});

test('malformed stored bytes remain recoverable and unchanged', () => {
  const storage = new MemoryStorage();
  storage.setItem(STORAGE_KEY, '{broken json');
  const result = readState(storage);
  assert.ok(result.error);
  assert.equal(result.raw, '{broken json');
  assert.deepEqual(result.state, { version: 1, plan: null, meals: [] });
  assert.equal(storage.getItem(STORAGE_KEY), '{broken json');
});

test('unknown versions and invalid data never enter app state', () => {
  const invalid = [
    null, [], {}, { ...validState, version: 2 },
    { ...validState, plan: { ...validState.plan, startingBalance: -100 } },
    { ...validState, plan: { ...validState.plan, startingBalance: 1.5 } },
    { ...validState, plan: { ...validState.plan, startingBalance: Number.MAX_SAFE_INTEGER + 1 } },
    { ...validState, plan: { ...validState.plan, endDate: '2026-02-30' } },
    { ...validState, plan: { ...validState.plan, name: '' } },
    { ...validState, meals: [{ ...validState.meals[0], points: 0 }] },
    { ...validState, meals: [{ ...validState.meals[0], points: -10 }] },
    { ...validState, meals: [{ ...validState.meals[0], points: 0.5 }] },
    { ...validState, meals: [{ ...validState.meals[0], category: 'Other' }] },
    { ...validState, meals: [{ ...validState.meals[0], date: '2026-02-30' }] },
    { ...validState, meals: [{ ...validState.meals[0], createdAt: 'invalid' }] },
    { ...validState, meals: [{ ...validState.meals[0], createdAt: '2026-02-30T12:00:00.000Z' }] },
    { ...validState, meals: [{ ...validState.meals[0], location: '' }] },
    { ...validState, meals: [{ ...validState.meals[0], id: '' }] },
    { ...validState, meals: [validState.meals[0], validState.meals[0]] },
    { ...validState, plan: null },
  ];
  for (const state of invalid) {
    const raw = JSON.stringify(state);
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, raw);
    const result = readState(storage);
    assert.ok(result.error, raw);
    assert.equal(result.raw, raw);
    assert.equal(storage.getItem(STORAGE_KEY), raw);
  }
});

test('blocked storage reads return a visible error rather than throwing', () => {
  const result = readState({ getItem() { throw new Error('Access denied'); } });
  assert.ok(result.error);
  assert.equal(result.raw, null);
  assert.deepEqual(result.state, { version: 1, plan: null, meals: [] });
});

test('failed writes report failure rather than falsely claiming a save', () => {
  const result = writeState({ setItem() { throw new Error('Quota exceeded'); } }, validState);
  assert.ok(result.error);
});

test('writing invalid state fails before replacing valid saved data', () => {
  const storage = new MemoryStorage();
  writeState(storage, validState);
  const before = storage.getItem(STORAGE_KEY);
  const result = writeState(storage, { ...validState, meals: [{ ...validState.meals[0], points: -50 }] });
  assert.ok(result.error);
  assert.equal(storage.getItem(STORAGE_KEY), before);
});
