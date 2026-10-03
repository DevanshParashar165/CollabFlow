import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from '../TaskCard';

function DraggableTaskCard({ task, canManage, canAssign, onOpen, onEdit, onDelete, disabled }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: task._id, data: { type: 'task', status: task.status }, disabled: !canManage || disabled });

  const dragHandle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Drag ${task.title}`}
      title="Drag task"
      className="mt-0.5 shrink-0 cursor-grab touch-none rounded text-slate-400 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:cursor-grabbing"
    >
      ⠿
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={isDragging ? 'z-10 opacity-40' : ''}
    >
      <TaskCard
        task={task}
        canManage={canManage}
        canAssign={canAssign}
        onOpen={() => onOpen(task)}
        onEdit={() => onEdit(task)}
        onDelete={() => onDelete(task)}
        dragHandle={canManage ? dragHandle : null}
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
  isActiveDrop,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: 'column', status },
    disabled: !canManage,
  });

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={`kanban-${status}-title`}
      aria-describedby={isActiveDrop ? `kanban-${status}-drop-instruction` : undefined}
      className={`flex h-[min(68vh,48rem)] min-h-80 min-w-0 flex-col rounded-lg border p-3 transition-colors ${isActiveDrop ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100' : isOver ? 'border-indigo-300 bg-indigo-50/70' : 'border-slate-200 bg-slate-50/80'}`}
    >
      <header className="mb-3 flex items-center justify-between gap-3 px-1">
        <h3 id={`kanban-${status}-title`} className="text-sm font-semibold text-slate-800">{title}</h3>
        <div className="flex items-center gap-2">
          {isActiveDrop && <span id={`kanban-${status}-drop-instruction`} className="text-[11px] font-medium text-indigo-700">Release to move</span>}
          <span className="inline-flex min-w-7 items-center justify-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600" aria-label={`${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`}>{tasks.length}</span>
        </div>
      </header>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain rounded-md p-1" aria-label={`${title} tasks`}>
        {tasks.length ? tasks.map((task) => (
          <DraggableTaskCard
            key={task._id}
            task={task}
            canManage={canManage}
            canAssign={canAssign}
            onOpen={onOpen}
            onEdit={onEdit}
            onDelete={onDelete}
            disabled={disabledTaskIds.has(task._id)}
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
