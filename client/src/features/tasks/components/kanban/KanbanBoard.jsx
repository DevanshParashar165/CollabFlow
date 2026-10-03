import { useState } from 'react';
import { closestCorners, DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import TaskFilters from '../TaskFilters';
import TaskCard from '../TaskCard';
import KanbanColumn from './KanbanColumn';
import { TASK_STATUSES } from '../../../../utils/constants';

const validStatuses = new Set(TASK_STATUSES.map(({ value }) => value));

const getDropStatus = (over) => {
  const status = over?.data?.current?.status;
  if (validStatuses.has(status)) return status;
  return validStatuses.has(over?.id) ? over.id : null;
};

const matchesFilters = (task, filters) => (
  (!filters.status || task.status === filters.status)
  && (!filters.priority || task.priority === filters.priority)
  && (!filters.assignee || (filters.assignee === 'unassigned' ? !task.assignee : task.assignee?._id === filters.assignee))
  && (!(filters.search || '').trim() || `${task.title || ''} ${task.description || ''}`.toLowerCase().includes((filters.search || '').trim().toLowerCase()))
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
  const [overStatus, setOverStatus] = useState(null);
  const [movingTaskIds, setMovingTaskIds] = useState(() => new Set());
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );
  const membersById = new Map(members.map((member) => [member.user?._id, member.user]).filter(([id]) => id));
  const boardTasks = tasks.map((task) => {
    if (typeof task.assignee !== 'string') return task;
    return { ...task, assignee: membersById.get(task.assignee) || { _id: task.assignee, name: 'Workspace member' } };
  });
  const filteredTasks = boardTasks.filter((task) => matchesFilters(task, filters));
  const columns = TASK_STATUSES.map(({ value: status, label: title }) => ({
    status,
    title,
    tasks: filteredTasks.filter((task) => task.status === status),
    totalTaskCount: boardTasks.filter((task) => task.status === status).length,
  }));
  const activeTask = boardTasks.find((task) => task._id === activeTaskId);

  const handleDragEnd = async ({ active, over }) => {
    setActiveTaskId(null);
    setOverStatus(null);
    if (!over || !canManage || typeof onMove !== 'function') return;

    const task = boardTasks.find((item) => item._id === active.id);
    if (!task) return;

    const fromStatus = task.status;
    const toStatus = getDropStatus(over);
    if (!validStatuses.has(fromStatus) || !validStatuses.has(toStatus) || fromStatus === toStatus || movingTaskIds.has(task._id)) return;

    setMovingTaskIds((current) => new Set(current).add(task._id));
    try {
      await onMove(task, toStatus);
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active }) => { setActiveTaskId(active.id); setOverStatus(null); }}
        onDragOver={({ over }) => setOverStatus(getDropStatus(over))}
        onDragCancel={() => { setActiveTaskId(null); setOverStatus(null); }}
        onDragEnd={handleDragEnd}
      >
        {!tasks.length ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">No tasks yet</p>
            <p className="mt-1 text-sm text-slate-500">Create a task to start organizing work on this project.</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="grid min-w-5xl grid-cols-4 gap-3">
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
                  isActiveDrop={overStatus === column.status && activeTask?.status !== column.status}
                />
              ))}
            </div>
          </div>
        )}
        <DragOverlay>
          {activeTask ? (
            <div className="w-64">
              <TaskCard
                task={activeTask}
                canManage={false}
                canAssign={false}
                onOpen={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
