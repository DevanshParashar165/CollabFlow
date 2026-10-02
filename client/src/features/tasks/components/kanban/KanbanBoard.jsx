import { useMemo, useState } from 'react';
import { closestCorners, DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import TaskCard from '../TaskCard';
import TaskFilters from '../TaskFilters';
import KanbanColumn from './KanbanColumn';

const COLUMNS = [
  { status: 'TODO', title: 'To Do' },
  { status: 'IN_PROGRESS', title: 'In Progress' },
  { status: 'IN_REVIEW', title: 'In Review' },
  { status: 'DONE', title: 'Done' },
];

const matchesFilters = (task, filters) => (
  (!filters.status || task.status === filters.status)
  && (!filters.priority || task.priority === filters.priority)
  && (!filters.assignee || (filters.assignee === 'unassigned' ? !task.assignee : task.assignee?._id === filters.assignee))
);

export default function KanbanBoard({
  tasks,
  members,
  filters,
  onFiltersChange,
  canManage,
  canAssign,
  onOpen,
  onEdit,
  onDelete,
  onMove,
}) {
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [movingTaskIds, setMovingTaskIds] = useState(() => new Set());
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const membersById = useMemo(() => new Map(members.map((member) => [member.user?._id, member.user]).filter(([id]) => id)), [members]);
  const boardTasks = useMemo(() => tasks.map((task) => {
    if (typeof task.assignee !== 'string') return task;
    return { ...task, assignee: membersById.get(task.assignee) || { _id: task.assignee, name: 'Workspace member' } };
  }), [membersById, tasks]);
  const columns = useMemo(() => COLUMNS.map((column) => ({
    ...column,
    tasks: boardTasks.filter((task) => task.status === column.status && matchesFilters(task, filters)),
    totalTaskCount: boardTasks.filter((task) => task.status === column.status).length,
  })), [boardTasks, filters]);
  const activeTask = boardTasks.find((task) => task._id === activeTaskId);

  const handleDragEnd = async ({ active, over }) => {
    setActiveTaskId(null);
    if (!over || !canManage) return;

    const task = boardTasks.find((item) => item._id === active.id);
    const targetStatus = over.data.current?.status
      || COLUMNS.find((column) => `column:${column.status}` === over.id)?.status;
    if (!task || !targetStatus || task.status === targetStatus || movingTaskIds.has(task._id)) return;

    setMovingTaskIds((current) => new Set(current).add(task._id));
    try {
      await onMove(task, targetStatus);
    } finally {
      setMovingTaskIds((current) => {
        const next = new Set(current);
        next.delete(task._id);
        return next;
      });
    }
  };

  return (
    <div>
      <TaskFilters filters={filters} members={members} onChange={onFiltersChange} />
      <p className="sr-only" aria-live="polite">Drag a task by its handle to move it between status columns. Keyboard users can focus a handle and use the arrow keys.</p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active }) => setActiveTaskId(active.id)}
        onDragCancel={() => setActiveTaskId(null)}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.status}
              {...column}
              canManage={canManage}
              canAssign={canAssign}
              onOpen={onOpen}
              onEdit={onEdit}
              onDelete={onDelete}
              disabledTaskIds={movingTaskIds}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="rotate-1 rounded-lg shadow-xl ring-2 ring-indigo-200">
              <TaskCard task={activeTask} canManage={false} canAssign={false} onOpen={() => {}} onEdit={() => {}} onDelete={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
