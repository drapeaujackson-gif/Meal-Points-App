import { useState } from 'react';
import { ArrowDownToLine, ArrowUpRight, Coffee, Search, Soup, Sun, Sunset, Trash2 } from 'lucide-react';
import { formatPoints, MEAL_CATEGORIES, mealsToCsv, todayISO } from '../lib/model';
import type { Meal, MealCategory } from '../lib/model';
import { downloadFile } from '../App';

const mealIcons = { Breakfast: Coffee, Lunch: Sun, Dinner: Sunset, Snack: Coffee };

export function Activity({ meals, expanded, onExpand, onDelete }: { meals: Meal[]; expanded: boolean; onExpand: () => void; onDelete: (meal: Meal) => void }) {
  const [filter, setFilter] = useState<MealCategory | 'All meals'>('All meals');
  const [search, setSearch] = useState('');
  const sorted = [...meals].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const matches = sorted.filter(meal => (filter === 'All meals' || filter === meal.category) && (!expanded || meal.location.toLowerCase().includes(search.toLowerCase().trim())));
  const visible = expanded ? matches : matches.slice(0, 5);
  return <section id="activity" className="activity-panel panel" aria-labelledby="activity-heading">
    <div className="section-heading"><h2 id="activity-heading">{expanded ? 'All activity' : 'Recent activity'}</h2>{!expanded ? <button className="text-button view-all" onClick={onExpand}>View all<ArrowUpRight size={18} /></button> : <button className="text-button export-button" disabled={!meals.length} onClick={() => downloadFile(mealsToCsv(sorted), `meal-points-${todayISO()}.csv`, 'text/csv;charset=utf-8;')}><ArrowDownToLine size={16} />Export CSV</button>}</div>
    {expanded && <div className="search-input"><Search size={18} /><input aria-label="Search meals" placeholder="Search by place…" value={search} onChange={event => setSearch(event.target.value)} /></div>}
    <div className="filter-tabs" role="group" aria-label="Filter by meal">{(['All meals', ...MEAL_CATEGORIES] as const).map(value => <button key={value} aria-pressed={filter === value} className={filter === value ? 'filter active' : 'filter'} onClick={() => setFilter(value)}>{value}</button>)}</div>
    {!visible.length ? <div className="empty-activity"><div className="empty-icon"><Soup size={65} strokeWidth={1.25} /></div><h3>{meals.length ? 'No meals match this filter' : 'Your first meal starts here'}</h3><p>{meals.length ? 'Try another meal type or a different search.' : 'Log a meal and we’ll keep track of the points.'}</p></div> : <table className="meal-table"><caption className="sr-only">Your meal spending</caption><thead className="sr-only"><tr><th>Place and date</th><th>Points spent</th><th>Actions</th></tr></thead><tbody>{visible.map(meal => {
      const Icon = mealIcons[meal.category];
      return <tr key={meal.id}><td><div className="meal-place"><span className={`meal-icon ${meal.category.toLowerCase()}`}><Icon size={20} /></span><div><strong>{meal.location}</strong><span>{meal.category}<span className="date-dot"> · </span><time dateTime={meal.date}>{new Date(`${meal.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time></span></div></div></td><td className="points-cell">−{formatPoints(meal.points)}<span>pts</span></td><td className="delete-cell"><button className="icon-button delete-button" aria-label={`Delete meal at ${meal.location}`} onClick={() => onDelete(meal)}><Trash2 size={17} /></button></td></tr>;
    })}</tbody></table>}
    {!expanded && matches.length > 5 && <p className="activity-count">Showing your 5 most recent meals. <button className="text-button" onClick={onExpand}>See all {matches.length}</button></p>}
  </section>;
}
