import { useState } from 'react';

export default function CommentForm({ onSubmit, submitting }) {
  const [content, setContent] = useState('');
  return <form onSubmit={(event) => { event.preventDefault(); if (content.trim()) { onSubmit(content.trim()); setContent(''); } }} className="mt-4 flex gap-2"><input value={content} onChange={(event) => setContent(event.target.value)} maxLength={2000} placeholder="Add a comment…" className="flex-1 rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" /><button disabled={submitting || !content.trim()} className="cursor-pointer rounded-md bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">Post</button></form>;
}