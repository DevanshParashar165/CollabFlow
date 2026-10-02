import { useState } from 'react';
import { TASK_STATUSES } from '../../../utils/constants';

const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function TaskForm({ initialTask, members, canAssign, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({
    title: initialTask?.title || '', description: initialTask?.description || '',
    status: initialTask?.status || TASK_STATUSES[0].value, priority: initialTask?.priority || 'MEDIUM',
    assignee: initialTask?.assignee?._id || initialTask?.assignee || '', dueDate: initialTask?.dueDate ? initialTask.dueDate.slice(0, 10) : '',
  });
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const fieldClass = 'w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100';
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit({ ...form, assignee: form.assignee || null, dueDate: form.dueDate || null }); }} className="space-y-4">
      <input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Task title" maxLength={150} required className={fieldClass} />
      <textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Description" maxLength={2000} rows={4} className={`${fieldClass} resize-y`} />
      <div className="grid grid-cols-2 gap-3">
        <select value={form.status} onChange={(e) => update('status', e.target.value)} className={fieldClass}>{TASK_STATUSES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select>
        <select value={form.priority} onChange={(e) => update('priority', e.target.value)} className={fieldClass}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select>
      </div>
      <input type="date" value={form.dueDate} onChange={(e) => update('dueDate', e.target.value)} className={fieldClass} />
      {canAssign && <select value={form.assignee} onChange={(e) => update('assignee', e.target.value)} className={fieldClass}><option value="">Unassigned</option>{members.map((member) => <option key={member.user?._id} value={member.user?._id}>{member.user?.name || member.user?.email}</option>)}</select>}
      <div className="flex gap-3 pt-1"><button type="button" onClick={onCancel} className="flex-1 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button><button disabled={submitting} className="flex-1 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer">{submitting ? 'Saving…' : 'Save Task'}</button></div>
    </form>
  );
}