import TaskCard from './TaskCard';
import TaskFilters from './TaskFilters';

export default function TaskList({ tasks, members, filters, onFiltersChange, canManage, canAssign, onOpen, onEdit, onDelete }) {
  const visible = tasks.filter((task) => (!filters.status || task.status === filters.status) && (!filters.priority || task.priority === filters.priority) && (!filters.assignee || (filters.assignee === 'unassigned' ? !task.assignee : task.assignee?._id === filters.assignee)));
  return (<><TaskFilters filters={filters} members={members} onChange={onFiltersChange} />{visible.length ? <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{visible.map((task) => <TaskCard key={task._id} task={task} canManage={canManage} canAssign={canAssign} onOpen={() => onOpen(task)} onEdit={() => onEdit(task)} onDelete={() => onDelete(task)} />)}</div> : <p className="text-slate-500 text-sm py-6 text-center">No tasks match these filters.</p>}</>);
}