import TaskFilters from '../TaskFilters';
import KanbanColumn from './KanbanColumn';
import { TASK_STATUSES } from '../../../../utils/constants';

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
}) {
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

  return (
    <div>
      <TaskFilters filters={filters} members={members} onChange={onFiltersChange} />
      {!tasks.length ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
          <p className="text-sm font-medium text-slate-700">No tasks yet</p>
          <p className="mt-1 text-sm text-slate-500">Create a task to start organizing work on this project.</p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[64rem] grid-cols-4 gap-3">
            {columns.map((column) => (
              <KanbanColumn
                key={column.status}
                {...column}
                canManage={canManage}
                canAssign={canAssign}
                onOpen={onOpen}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
