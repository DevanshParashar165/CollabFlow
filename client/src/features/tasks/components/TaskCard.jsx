const priorityStyles = {
  LOW: 'border-slate-200 bg-slate-50 text-slate-600',
  MEDIUM: 'border-blue-100 bg-blue-50 text-blue-700',
  HIGH: 'border-amber-100 bg-amber-50 text-amber-700',
  URGENT: 'border-rose-100 bg-rose-50 text-rose-700',
};

export default function TaskCard({ task, canManage, canAssign, onOpen, onEdit, onDelete, dragHandle, className = '' }) {
  const priority = task.priority?.toUpperCase();
  const priorityStyle = priorityStyles[priority] || priorityStyles.MEDIUM;

  return (
    <article className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:border-indigo-200 hover:shadow-md ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {canManage && dragHandle}
          <button type="button" onClick={onOpen} className="min-w-0 text-left text-sm font-semibold text-slate-900 hover:text-indigo-700 cursor-pointer">
            {task.title}
          </button>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${priorityStyle}`}>
          {task.priority || 'MEDIUM'}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 min-h-9 text-xs leading-5 text-slate-600">
        {task.description || 'No description'}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs">
        <div className="flex min-w-0 items-center gap-2 text-slate-600">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
            {task.assignee?.name?.[0]?.toUpperCase() || '—'}
          </span>
          <span className="truncate">{task.assignee?.name || 'Unassigned'}</span>
        </div>
        <span className="text-slate-500">
          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
        </span>
      </div>
      {canManage && (
        <div className="mt-3 flex gap-4 border-t border-slate-100 pt-3">
          <button type="button" onClick={onEdit} className="cursor-pointer text-xs font-medium text-indigo-700 hover:text-indigo-800">Edit</button>
          {canAssign && <button type="button" onClick={onDelete} className="cursor-pointer text-xs font-medium text-rose-600 hover:text-rose-700">Delete</button>}
        </div>
      )}
    </article>
  );
}