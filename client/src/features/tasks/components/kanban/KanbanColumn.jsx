import TaskCard from '../TaskCard';

export default function KanbanColumn({
  status,
  title,
  tasks,
  totalTaskCount,
  canManage,
  canAssign,
  onOpen,
  onEdit,
  onDelete,
}) {
  return (
    <section aria-labelledby={`kanban-${status}-title`} className="flex h-[min(68vh,48rem)] min-h-80 min-w-0 flex-col rounded-lg border border-slate-200 bg-slate-50/80 p-3">
      <header className="mb-3 flex items-center justify-between gap-3 px-1">
        <h3 id={`kanban-${status}-title`} className="text-sm font-semibold text-slate-800">{title}</h3>
        <span className="inline-flex min-w-7 items-center justify-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600" aria-label={`${tasks.length} tasks`}>{tasks.length}</span>
      </header>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain rounded-md p-1" aria-label={`${title} tasks`}>
        {tasks.length ? tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            canManage={canManage}
            canAssign={canAssign}
            onOpen={() => onOpen(task)}
            onEdit={() => onEdit(task)}
            onDelete={() => onDelete(task)}
          />
        )) : (
          <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed border-slate-200 bg-white px-3 text-center text-xs leading-5 text-slate-500">
            {totalTaskCount ? 'No tasks match these filters.' : `${title} is clear.`}
          </div>
        )}
      </div>
    </section>
  );
}
