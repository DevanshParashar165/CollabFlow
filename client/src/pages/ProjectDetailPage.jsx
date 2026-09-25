import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchMembers, fetchWorkspace } from '../features/workspaces/workspaceSlice';
import { clearCurrentProject, fetchProject } from '../features/projects/projectSlice';
import { createTask, deleteTask, fetchTasks, updateTask } from '../features/tasks/taskSlice';
import TaskForm from '../features/tasks/components/TaskForm';
import TaskList from '../features/tasks/components/TaskList';
import useWorkspaceSocket from '../hooks/useWorkspaceSocket';

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
  const [filters, setFilters] = useState({ status: '', priority: '', assignee: '' });
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

  if (projectLoading && !currentProject) return <div className="min-h-screen bg-slate-950 text-slate-400 p-10">Loading project…</div>;
  if (projectError && !currentProject) return <div className="min-h-screen bg-slate-950 text-red-400 p-10">{projectError}</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <button onClick={() => navigate(`/workspaces/${workspaceId}/projects`)} className="text-slate-400 hover:text-white text-sm mb-8 cursor-pointer">← Projects</button>
        {currentProject && (
          <>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <div className="flex justify-between gap-4">
                <div><h1 className="text-3xl font-bold">{currentProject.name}</h1><p className="text-slate-400 mt-2">{currentProject.description || 'No description provided.'}</p></div>
                <span className="h-fit text-xs px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{currentProject.status}</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mt-8 text-sm"><div><p className="text-slate-500">Created by</p><p className="text-slate-200 mt-1">{currentProject.createdBy?.name || currentProject.createdBy?.email || 'Unknown'}</p></div><div><p className="text-slate-500">Created at</p><p className="text-slate-200 mt-1">{currentProject.createdAt ? new Date(currentProject.createdAt).toLocaleString() : '-'}</p></div></div>
            </div>
            <section className="mt-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5"><div><h2 className="text-xl font-semibold">Tasks</h2><p className="text-slate-500 text-xs mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p></div>{canManage && <button onClick={() => { setEditing(null); setShowForm(true); }} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium cursor-pointer">Create Task</button>}</div>
              {taskError && <p className="text-red-400 text-sm mb-4">{taskError}</p>}
              {taskLoading && !tasks.length ? <p className="text-slate-500 text-sm">Loading tasks…</p> : <TaskList tasks={tasks} members={members} filters={filters} onFiltersChange={setFilters} canManage={canManage} canAssign={canAssign} onOpen={(task) => navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${task._id}`)} onEdit={(task) => { setEditing(task); setShowForm(true); }} onDelete={removeTask} />}
            </section>
          </>
        )}
      </div>
      {showForm && <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"><div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md"><h2 className="text-xl font-bold mb-5">{editing ? 'Edit Task' : 'Create Task'}</h2><TaskForm initialTask={editing} members={members} canAssign={canAssign} onSubmit={saveTask} onCancel={() => { setShowForm(false); setEditing(null); }} submitting={submitting} /></div></div>}
    </div>
  );
}
