import { CalendarDays, ClipboardList, House, LockKeyhole, Utensils } from 'lucide-react';

interface Props { active: 'overview' | 'activity'; onOverview: () => void; onActivity: () => void; onPlan: () => void }

export function Sidebar({ active, onOverview, onActivity, onPlan }: Props) {
  return <aside className="sidebar">
    <a className="brand" href="#main" onClick={onOverview}><span className="brand-icon"><Utensils size={25} strokeWidth={2.2} /></span><span>meal points</span></a>
    <nav aria-label="Main navigation">
      <button className={active === 'overview' ? 'nav-item active' : 'nav-item'} aria-current={active === 'overview' ? 'page' : undefined} onClick={onOverview}><House size={24} /><span>Overview</span></button>
      <button className={active === 'activity' ? 'nav-item active' : 'nav-item'} aria-current={active === 'activity' ? 'page' : undefined} onClick={onActivity}><ClipboardList size={24} /><span>Activity</span></button>
      <button className="nav-item" onClick={onPlan}><CalendarDays size={24} /><span>Your plan</span></button>
    </nav>
    <div className="sidebar-bottom"><p>A little planning.<br />More good meals.</p><span><LockKeyhole size={19} />Saved on this device</span></div>
  </aside>;
}
