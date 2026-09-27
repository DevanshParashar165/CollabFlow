import { useState } from 'react';

const statuses = ['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'];

export default function ProjectForm({ initialProject, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({ name: initialProject?.name || '', description: initialProject?.description || '', status: initialProject?.status || 'PLANNING' });
  const handleSubmit = (event) => { event.preventDefault(); onSubmit(form); };
  const fieldClass = 'w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100';
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Project name" maxLength={100} required className={fieldClass} />
      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" maxLength={500} rows={4} className={`${fieldClass} resize-y`} />
      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={fieldClass}>
        {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
      <div className="flex gap-3 pt-1"><button type="button" onClick={onCancel} className="flex-1 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button><button disabled={submitting} className="flex-1 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer">{submitting ? 'Saving…' : 'Save'}</button></div>
    </form>
  );
}