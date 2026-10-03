import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchMembers, fetchWorkspace } from '../features/workspaces/workspaceSlice';
import { clearCurrentProject, fetchProject } from '../features/projects/projectSlice';
import { createTask, deleteTask, fetchTasks, taskStatusMoveOptimistic, taskStatusMoveRolledBack, updateTask } from '../features/tasks/taskSlice';
import TaskForm from '../features/tasks/components/TaskForm';
import KanbanBoard from '../features/tasks/components/kanban/KanbanBoard';
import useWorkspaceSocket from '../hooks/useWorkspaceSocket';
import { TASK_STATUSES } from '../utils/constants';

const taskKey = (workspaceId, projectId) => `${workspaceId}:${projectId}`;

export default function ProjectDetailPage() {
  const { workspaceId, projectId } = useParams();
  useWorkspaceSocket(workspaceId);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentProject, loading: projectLoading, error: projectError } = useSelector((state) => state.projects);
  const { tasksByProject, loading: taskLoading, error: taskError } = useSelector((state) => state.tasks);
  const members = useSelector((state) => state.workspaces.members);
  const role = useSelector((state) => state.workspaces.currentWorkspace?.role) || currentProject?.role;
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [moveError, setMoveError] = useState('');
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', assignee: '' });
  const tasks = tasksByProject[taskKey(workspaceId, projectId)] || [];
  const canAssign = role === 'OWNER' || role === 'ADMIN';
  const canManage = role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';

  useEffect(() => {
    dispatch(fetchProject({ workspaceId, projectId }));
    dispatch(fetchWorkspace(workspaceId));
    dispatch(fetchMembers(workspaceId));
    dispatch(fetchTasks({ workspaceId, projectId }));
    return () => dispatch(clearCurrentProject());
  }, [dispatch, workspaceId, projectId]);

  const saveTask = async (taskData) => {
    setSubmitting(true);
    try {
      if (editing) {
        await dispatch(updateTask({ workspaceId, projectId, taskId: editing._id, taskData })).unwrap();
      } else {
        await dispatch(createTask({ workspaceId, projectId, taskData })).unwrap();
      }
      setShowForm(false);
      setEditing(null);
    } finally {
      setSubmitting(false);
    }
  };

  const removeTask = async (task) => {
    if (window.confirm(`Delete ${task.title}?`)) {
      await dispatch(deleteTask({ workspaceId, projectId, taskId: task._id }));
    }
  };

  const moveTask = async (task, toStatus) => {
    if (!canManage || !TASK_STATUSES.some(({ value }) => value === task.status) || !TASK_STATUSES.some(({ value }) => value === toStatus) || task.status === toStatus) return;

    const moveId = `${task._id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setMoveError('');
    dispatch(taskStatusMoveOptimistic({ workspaceId, projectId, taskId: task._id, fromStatus: task.status, toStatus, moveId }));
    try {
      await dispatch(updateTask({ workspaceId, projectId, taskId: task._id, taskData: { status: toStatus }, moveId })).unwrap();
    } catch (error) {
      dispatch(taskStatusMoveRolledBack({ workspaceId, projectId, taskId: task._id, moveId }));
      setMoveError(typeof error === 'string' ? error : error?.message || 'Please try again.');
    }
  };

  if (projectLoading && !currentProject) return <div className="mx-auto flex min-h-[50vh] max-w-6xl items-center px-4 text-sm text-slate-500 sm:px-6 lg:px-8">Loading project…</div>;
  if (projectError && !currentProject) return <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-rose-700 sm:px-6 lg:px-8">{projectError}</div>;

  return (
    <div className="w-full text-slate-900">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <button onClick={() => navigate(`/workspaces/${workspaceId}/projects`)} className="mb-5 cursor-pointer text-sm font-medium text-slate-500 transition-colors hover:text-indigo-700">← Projects</button>
        {currentProject && (
          <>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{currentProject.name}</h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{currentProject.description || 'No description provided.'}</p>
                </div>
                <span className="h-fit shrink-0 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">{currentProject.status}</span>
              </div>
              <div className="mt-6 grid gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
                <div><p className="text-xs font-medium text-slate-500">Created by</p><p className="mt-1 text-slate-800">{currentProject.createdBy?.name || currentProject.createdBy?.email || 'Unknown'}</p></div>
                <div><p className="text-xs font-medium text-slate-500">Created at</p><p className="mt-1 text-slate-800">{currentProject.createdAt ? new Date(currentProject.createdAt).toLocaleString() : '-'}</p></div>
              </div>
            </div>
            <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Tasks</h2>
                  <p className="mt-1 text-xs text-slate-500">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
                </div>
                {canManage && <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 cursor-pointer">Create Task</button>}
              </div>
              <div className="p-5 sm:p-6">
                {taskError && <p className="mb-4 rounded-md border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{taskError}</p>}
                {moveError && <p role="alert" className="mb-4 rounded-md border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">Task status could not be updated: {moveError}</p>}
                {taskLoading && !tasks.length ? <p className="py-6 text-center text-sm text-slate-500">Loading tasks…</p> : <KanbanBoard tasks={tasks} members={members} filters={filters} onFiltersChange={setFilters} canManage={canManage} canAssign={canAssign} onOpen={(task) => navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${task._id}`)} onEdit={(task) => { setEditing(task); setShowForm(true); }} onDelete={removeTask} onMove={moveTask} />}
              </div>
            </section>
          </>
        )}
      </div>
      {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]"><div role="dialog" aria-modal="true" aria-labelledby="task-form-title" className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6"><h2 id="task-form-title" className="mb-5 text-lg font-semibold text-slate-900">{editing ? 'Edit Task' : 'Create Task'}</h2><TaskForm initialTask={editing} members={members} canAssign={canAssign} onSubmit={saveTask} onCancel={() => { setShowForm(false); setEditing(null); }} submitting={submitting} /></div></div>}
    </div>
  );
}
