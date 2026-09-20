import { useState } from 'react';

const statuses = ['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'];

export default function ProjectForm({ initialProject, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({ name: initialProject?.name || '', description: initialProject?.description || '', status: initialProject?.status || 'PLANNING' });
  const handleSubmit = (event) => { event.preventDefault(); onSubmit(form); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Project name" maxLength={100} required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm" />
      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" maxLength={500} rows={4} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm resize-none" />
      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm">
        {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
      <div className="flex gap-3"><button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 cursor-pointer">Cancel</button><button disabled={submitting} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white disabled:opacity-50 cursor-pointer">{submitting ? 'Saving…' : 'Save'}</button></div>
    </form>
  );
}