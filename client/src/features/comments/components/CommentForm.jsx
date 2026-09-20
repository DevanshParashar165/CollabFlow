import { useState } from 'react';

export default function CommentForm({ onSubmit, submitting }) {
  const [content, setContent] = useState('');
  return <form onSubmit={(event) => { event.preventDefault(); if (content.trim()) { onSubmit(content.trim()); setContent(''); } }} className="flex gap-2 mt-4"><input value={content} onChange={(event) => setContent(event.target.value)} maxLength={2000} placeholder="Add a comment…" className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm" /><button disabled={submitting || !content.trim()} className="px-4 rounded-xl bg-indigo-600 text-white text-sm disabled:opacity-50 cursor-pointer">Post</button></form>;
}