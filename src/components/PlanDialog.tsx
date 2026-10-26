import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { isValidDate, parsePoints } from '../lib/model';
import type { Plan } from '../lib/model';

export function PlanDialog({ open, plan, today, onClose, onSave }: { open: boolean; plan: Plan | null; today: string; onClose: () => void; onSave: (plan: Plan) => Promise<boolean> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState('My meal plan');
  const [points, setPoints] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    // External storage updates must not replace an in-progress edit.
    if (open && !dialog.current?.open) {
      setName(plan?.name ?? 'My meal plan');
      setPoints(plan ? (plan.startingBalance / 100).toFixed(2) : '');
      setEndDate(plan?.endDate ?? '');
      setError('');
      dialog.current?.showModal();
    } else if (!open) { dialog.current?.close(); }
  }, [open, plan]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError(''); setSaving(true);
    try {
      if (!name.trim()) throw new Error('Give your plan a name.');
      if (!isValidDate(endDate) || endDate < today) throw new Error('Choose a plan end date on or after today.');
      if (!await onSave({ name: name.trim(), startingBalance: parsePoints(points), endDate })) setError('Your plan could not be saved. Check the storage message on the page.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Check your plan details.'); }
    finally { setSaving(false); }
  }
  return <dialog ref={dialog} className="plan-dialog" aria-labelledby="plan-title" aria-describedby="plan-description" onCancel={onClose} onClose={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="dialog-content"><button className="icon-button close-dialog" onClick={onClose} aria-label="Close plan settings"><X size={22} /></button><span className="dialog-symbol"><ArrowRight size={25} /></span><h2 id="plan-title">{plan ? 'Make it your plan.' : 'Good meals start here.'}</h2><p id="plan-description">Set your points and an end date. We’ll help you make them last.</p>
      <form onSubmit={submit}>
        <label htmlFor="plan-name">Plan name</label><input id="plan-name" value={name} onChange={event => setName(event.target.value)} maxLength={60} required />
        <label htmlFor="starting-points">Starting points</label><input id="starting-points" type="number" inputMode="decimal" placeholder="e.g. 1500.00" value={points} onChange={event => setPoints(event.target.value)} min="0.01" max="999999.99" step="0.01" required />
        <label htmlFor="end-date">Plan end date</label><input id="end-date" type="date" value={endDate} onChange={event => setEndDate(event.target.value)} min={today} required />
        <p className="field-help">{plan ? 'Updating your plan keeps your existing meal history.' : 'Use your current balance if your meal plan has already started.'}</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="dialog-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button type="submit" className="button primary" disabled={saving}>Save plan<ArrowRight size={18} /></button></div>
      </form>
    </div>
  </dialog>;
}
