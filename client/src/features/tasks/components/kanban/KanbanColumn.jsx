import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import TaskCard from '../TaskCard';

function SortableTaskCard({ task, canManage, canAssign, onOpen, onEdit, onDelete, disabled }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id, data: { type: 'task', status: task.status }, disabled });

  const dragHandle = (
    <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label={`Move ${task.title}`} className="mt-0.5 shrink-0 cursor-grab touch-none rounded text-slate-400 hover:text-indigo-600 active:cursor-grabbing" title="Drag to move task">
      ⠿
    </button>
  );

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={isDragging ? 'z-10 opacity-40' : ''}>
    <TaskCard
      task={task}
      canManage={canManage}
      canAssign={canAssign}
      onOpen={() => onOpen(task)}
      onEdit={() => onEdit(task)}
      onDelete={() => onDelete(task)}
      dragHandle={disabled ? null : dragHandle}
    />
    </div>
  );
}

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
  disabledTaskIds,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${status}`, data: { type: 'column', status } });

  return (
    <section aria-labelledby={`kanban-${status}-title`} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-3.5">
      <header className="mb-3 flex items-center justify-between gap-3 px-1">
        <h3 id={`kanban-${status}-title`} className="text-sm font-semibold text-slate-800">{title}</h3>
        <span className="inline-flex min-w-7 items-center justify-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600" aria-label={`${tasks.length} tasks`}>{tasks.length}</span>
      </header>
      <SortableContext items={tasks.map((task) => task._id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`min-h-36 max-h-[min(68vh,48rem)] space-y-3 overflow-y-auto overscroll-contain rounded-lg p-1 transition-colors ${isOver ? 'bg-indigo-50/70 ring-1 ring-inset ring-indigo-200' : ''}`}
          aria-label={`${title} tasks`}
        >
          {tasks.length ? tasks.map((task) => (
            <SortableTaskCard
              key={task._id}
              task={task}
              canManage={canManage}
              canAssign={canAssign}
              onOpen={onOpen}
              onEdit={onEdit}
              onDelete={onDelete}
              disabled={!canManage || disabledTaskIds.has(task._id)}
            />
          )) : (
            <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/70 px-3 text-center text-xs leading-5 text-slate-500">
              {totalTaskCount ? 'No tasks match these filters.' : 'No tasks here yet.'}
            </div>
          )}
        </div>
      </SortableContext>
    </section>
  );
}
