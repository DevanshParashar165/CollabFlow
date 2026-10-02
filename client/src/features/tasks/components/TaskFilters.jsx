import { TASK_STATUSES } from '../../../utils/constants';

export default function TaskFilters({ filters, members, onChange }) {
  const set = (field, value) => onChange({ ...filters, [field]: value });
  const controlClass = 'h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100';

  return (
    <div className="mb-4 flex flex-wrap gap-2" aria-label="Task filters">
      <select aria-label="Filter by status" value={filters.status} onChange={(event) => set('status', event.target.value)} className={controlClass}>
        <option value="">All statuses</option>
        {TASK_STATUSES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
      </select>
      <select aria-label="Filter by priority" value={filters.priority} onChange={(event) => set('priority', event.target.value)} className={controlClass}>
        <option value="">All priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="URGENT">Urgent</option>
      </select>
      <select aria-label="Filter by assignee" value={filters.assignee} onChange={(event) => set('assignee', event.target.value)} className={controlClass}>
        <option value="">All assignees</option>
        <option value="unassigned">Unassigned</option>
        {members.map((member) => <option key={member.user?._id} value={member.user?._id}>{member.user?.name || member.user?.email}</option>)}
      </select>
    </div>
  );
}