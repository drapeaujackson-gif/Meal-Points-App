import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import { isValidDate, MEAL_CATEGORIES, parsePoints } from '../lib/model';
import type { Meal, MealCategory } from '../lib/model';

export function MealForm({ today, hasPlan, onAdd, onSetup }: { today: string; hasPlan: boolean; onAdd: (meal: Omit<Meal, 'id' | 'createdAt'>) => Promise<boolean>; onSetup: () => void }) {
  const [location, setLocation] = useState('');
  const [points, setPoints] = useState('');
  const [category, setCategory] = useState<MealCategory>('Lunch');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError('');
    if (!hasPlan) { onSetup(); return; }
    setSaving(true);
    try {
      if (!location.trim()) throw new Error('Enter where you ate.');
      const chosenDate = date || today;
      if (!isValidDate(chosenDate) || chosenDate > today) throw new Error('Choose a valid meal date on or before today.');
      if (await onAdd({ location: location.trim(), points: parsePoints(points), category, date: chosenDate })) {
        setLocation(''); setPoints(''); setDate('');
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Check your meal details and try again.'); }
    finally { setSaving(false); }
  }
  return <section className="meal-panel panel" aria-labelledby="meal-heading"><h2 id="meal-heading">Log a meal</h2>
    <form onSubmit={submit}>
      <label htmlFor="meal-location">Where did you eat?</label><input id="meal-location" value={location} onChange={event => setLocation(event.target.value)} placeholder="e.g. Campus café" maxLength={100} required autoComplete="off" />
      <label htmlFor="meal-points">Points spent</label><input id="meal-points" type="number" inputMode="decimal" value={points} onChange={event => setPoints(event.target.value)} placeholder="0.00" min="0.01" max="999999.99" step="0.01" required />
      <div className="form-row"><div><label htmlFor="meal-category">Meal</label><select id="meal-category" value={category} onChange={event => setCategory(event.target.value as MealCategory)}>{MEAL_CATEGORIES.map(value => <option key={value}>{value}</option>)}</select></div><div><label htmlFor="meal-date">Date</label><input id="meal-date" type="date" value={date || today} onChange={event => setDate(event.target.value)} max={today} required /></div></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button primary full" disabled={saving} type={hasPlan ? 'submit' : 'button'} onClick={!hasPlan ? onSetup : undefined}><Plus size={21} />Add meal</button>
    </form>
  </section>;
}
