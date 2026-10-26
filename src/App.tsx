import { useEffect, useState } from 'react';
import { Check, Download, X } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { MealForm } from './components/MealForm';
import { Activity } from './components/Activity';
import { PlanDialog } from './components/PlanDialog';
import { emptyState, isValidDate, summarize, todayISO } from './lib/model';
import type { AppState, Meal, Plan } from './lib/model';
import { readState, STORAGE_KEY, writeState } from './lib/storage';

function loadSavedState() {
  try { return readState(window.localStorage); }
  catch { return { state: emptyState(), error: 'Browser storage is unavailable. Enable site storage to save your plan.', raw: null }; }
}

export function downloadFile(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const [initial] = useState(loadSavedState);
  const [data, setData] = useState(initial.state);
  const [storageError, setStorageError] = useState(initial.error);
  const [recovery, setRecovery] = useState(initial.error ? initial.raw : null);
  const [planOpen, setPlanOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [today, setToday] = useState(() => todayISO());
  const [notice, setNotice] = useState<{ message: string; deleted?: Meal } | null>(null);
  const summary = summarize(data.plan, data.meals, today);

  useEffect(() => {
    const refreshDate = () => setToday(todayISO());
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      const loaded = loadSavedState();
      setData(loaded.state);
      setStorageError(loaded.error);
      setRecovery(loaded.error ? loaded.raw : null);
      setNotice(null);
    };
    const timer = window.setInterval(refreshDate, 60000);
    window.addEventListener('focus', refreshDate);
    window.addEventListener('storage', onStorage);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refreshDate);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  async function withStorageLock(action: () => boolean) {
    if (!navigator.locks) {
      setStorageError('To save safely, use a current browser and open this app over HTTPS or on localhost.');
      return false;
    }
    try { return await navigator.locks.request(STORAGE_KEY, action); }
    catch {
      setStorageError('Your changes could not be saved. Please enable browser storage and try again.');
      return false;
    }
  }

  async function commit(update: (latest: AppState) => AppState) {
    return withStorageLock(() => {
      // The lock spans the read, mutation and write across every tab. Always
      // derive from persisted data, never a potentially stale React snapshot.
      const latest = loadSavedState();
      if (latest.error) {
        setStorageError(latest.error);
        setRecovery(latest.raw);
        return false;
      }
      const next = update(latest.state);
      const result = writeState(window.localStorage, next);
      if (result.error) { setStorageError(result.error); return false; }
      setData(next);
      setStorageError(null);
      setRecovery(null);
      return true;
    });
  }

  async function savePlan(plan: Plan) {
    if (!await commit(latest => ({ ...latest, plan }))) return false;
    setPlanOpen(false);
    setNotice({ message: 'Your plan is saved. You’re all set.' });
    return true;
  }

  async function addMeal(meal: Omit<Meal, 'id' | 'createdAt'>) {
    if (!data.plan) { setPlanOpen(true); return false; }
    if (!isValidDate(meal.date) || meal.date > today) return false;
    const nextMeal = { ...meal, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    if (!await commit(latest => ({ ...latest, meals: [nextMeal, ...latest.meals] }))) return false;
    setNotice({ message: 'Meal added. Enjoy every point.' });
    return true;
  }

  async function deleteMeal(meal: Meal) {
    if (await commit(latest => ({ ...latest, meals: latest.meals.filter(item => item.id !== meal.id) }))) {
      setNotice({ message: 'Meal removed.', deleted: meal });
    }
  }

  async function undoDelete() {
    const deleted = notice?.deleted;
    if (!deleted) return;
    if (await commit(latest => ({ ...latest, meals: latest.meals.some(meal => meal.id === deleted.id) ? latest.meals : [deleted, ...latest.meals] }))) setNotice({ message: 'Meal restored.' });
  }

  async function resetCorruptData() {
    if (!window.confirm('Reset unreadable saved data? Download a recovery copy first if you want to keep it.')) return;
    await withStorageLock(() => {
      const latest = loadSavedState();
      if (latest.raw !== recovery || !latest.error) {
        setData(latest.state); setStorageError(latest.error); setRecovery(latest.error ? latest.raw : null);
        return false;
      }
      const next = emptyState();
      const result = writeState(window.localStorage, next);
      if (result.error) { setStorageError(result.error); return false; }
      setData(next); setStorageError(null); setRecovery(null);
      return true;
    });
  }

  function showActivity() {
    setExpanded(true);
    requestAnimationFrame(() => document.getElementById('activity')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    <Sidebar active={expanded ? 'activity' : 'overview'} onOverview={() => { setExpanded(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onActivity={showActivity} onPlan={() => setPlanOpen(true)} />
    <main id="main" className="main-content">
      <div className="topbar"><span>Overview</span><span>Your everyday, a little easier.</span></div>
      {storageError && <section className="storage-alert" role="alert">
        <p>{storageError}</p>
        {recovery !== null && <div className="recovery-actions">
          <button className="button small secondary" onClick={() => downloadFile(recovery, 'meal-points-recovery.json', 'application/json')}><Download size={16} />Download recovery data</button>
          <button className="text-button" onClick={resetCorruptData}>Reset saved data</button>
        </div>}
      </section>}
      <Dashboard plan={data.plan} summary={summary} today={today} onEditPlan={() => setPlanOpen(true)}>
        <Activity meals={data.meals} expanded={expanded} onExpand={showActivity} onDelete={deleteMeal} />
        <MealForm today={today} hasPlan={data.plan !== null} onAdd={addMeal} onSetup={() => setPlanOpen(true)} />
      </Dashboard>
      <footer className="main-footer"><span><i />Your pace, your plan.</span><span>Points stay on this browser. No account needed.</span></footer>
    </main>
    <PlanDialog open={planOpen} plan={data.plan} today={today} onClose={() => setPlanOpen(false)} onSave={savePlan} />
    {notice && <div className="toast" role="status"><Check size={18} /><span>{notice.message}</span>{notice.deleted && <button onClick={undoDelete}>Undo</button>}<button className="icon-button" aria-label="Dismiss notification" onClick={() => setNotice(null)}><X size={17} /></button></div>}
  </div>;
}
