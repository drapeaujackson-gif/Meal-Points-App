import { Pencil } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Plan, summarize } from '../lib/model';
import { formatPoints } from '../lib/model';

type Summary = ReturnType<typeof summarize>;
function dateLabel(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

export function Dashboard({ plan, summary, today, onEditPlan, children }: { plan: Plan | null; summary: Summary; today: string; onEditPlan: () => void; children: [ReactNode, ReactNode] }) {
  const overdrawn = summary.remaining < 0;
  const ended = plan !== null && plan.endDate < today;
  return <>
    <header className="page-heading"><div><h1>Good meals.<br />Great balance.</h1><p>Make the most of your meal plan, one meal at a time.</p></div><button className="button secondary" onClick={onEditPlan}><Pencil size={20} />Edit plan</button></header>
    <div className="dashboard-columns">
      <div className="left-column">
        <section className={`balance-panel${overdrawn ? ' overdrawn' : ''}`} aria-label="Balance summary">
          <h2>Points remaining</h2>
          <div className="balance-number"><span data-testid="remaining">{formatPoints(summary.remaining)}</span><span className="balance-unit">pts</span></div>
          <p className="balance-description">{!plan ? 'Set up your plan to start tracking.' : overdrawn ? `${formatPoints(-summary.remaining)} pts over your starting balance.` : `${plan.name} · Ends ${dateLabel(plan.endDate)}`}</p>
          <div className="balance-details"><div><span>Starting balance</span><strong>{formatPoints(plan?.startingBalance ?? 0)} pts</strong></div><div><span>Spent so far</span><strong>{formatPoints(summary.spent)} pts</strong></div></div>
        </section>
        {children[0]}
      </div>
      <div className="right-column">
        <section className="daily-panel panel" aria-label="Daily budget"><h2>Your daily allowance</h2><p className="daily-number"><span data-testid="daily-allowance">{plan ? formatPoints(summary.dailyAllowance) : '—'}</span> <span>pts</span></p><p className="muted">A small guide for the days ahead.</p><div className="daily-footnote">{!plan ? 'Set a plan end date to see your budget.' : ended ? 'Your plan has ended. Edit your plan to keep going.' : `${summary.daysRemaining} ${summary.daysRemaining === 1 ? 'day' : 'days'} left, including today.`}</div></section>
        {children[1]}
      </div>
    </div>
  </>;
}
