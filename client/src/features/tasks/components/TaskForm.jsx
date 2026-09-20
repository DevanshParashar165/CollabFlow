import { useState } from 'react';

const statuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function TaskForm({ initialTask, members, canAssign, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({
    title: initialTask?.title || '', description: initialTask?.description || '',
    status: initialTask?.status || 'TODO', priority: initialTask?.priority || 'MEDIUM',
    assignee: initialTask?.assignee?._id || initialTask?.assignee || '', dueDate: initialTask?.dueDate ? initialTask.dueDate.slice(0, 10) : '',
  });
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit({ ...form, assignee: form.assignee || null, dueDate: form.dueDate || null }); }} className="space-y-4">
      <input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Task title" maxLength={150} required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm" />
      <textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Description" maxLength={2000} rows={4} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm resize-none" />
      <div className="grid grid-cols-2 gap-3">
        <select value={form.status} onChange={(e) => update('status', e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm">{statuses.map((status) => <option key={status}>{status}</option>)}</select>
        <select value={form.priority} onChange={(e) => update('priority', e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm">{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select>
      </div>
      <input type="date" value={form.dueDate} onChange={(e) => update('dueDate', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm" />
      {canAssign && <select value={form.assignee} onChange={(e) => update('assignee', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm"><option value="">Unassigned</option>{members.map((member) => <option key={member.user?._id} value={member.user?._id}>{member.user?.name || member.user?.email}</option>)}</select>}
      <div className="flex gap-3"><button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 cursor-pointer">Cancel</button><button disabled={submitting} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white disabled:opacity-50 cursor-pointer">{submitting ? 'Saving…' : 'Save Task'}</button></div>
    </form>
  );
}