import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchWorkspace } from '../features/workspaces/workspaceSlice';
import { createProject, deleteProject, fetchProjects, updateProject } from '../features/projects/projectSlice';
import ProjectForm from '../features/projects/components/ProjectForm';
import ProjectList from '../features/projects/components/ProjectList';

export default function ProjectsListPage() {
  const { workspaceId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const workspace = useSelector((state) => state.workspaces.currentWorkspace);
  const projectState = useSelector((state) => state.projects);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const role = workspace?.role;
  const canManage = role === 'OWNER' || role === 'ADMIN';
  const projects = projectState.projectsByWorkspace[workspaceId] || [];

  useEffect(() => {
    dispatch(fetchWorkspace(workspaceId));
    dispatch(fetchProjects(workspaceId));
  }, [dispatch, workspaceId]);

  const save = async (data) => {
    setSubmitting(true);
    try {
      if (editing) {
        await dispatch(updateProject({ workspaceId, projectId: editing._id, projectData: data })).unwrap();
      } else {
        await dispatch(createProject({ workspaceId, projectData: data })).unwrap();
      }
      setShowForm(false);
      setEditing(null);
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (project) => {
    if (window.confirm(`Delete ${project.name}?`)) {
      await dispatch(deleteProject({ workspaceId, projectId: project._id }));
    }
  };

  return (
    <div className="w-full text-slate-900">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <button onClick={() => navigate(`/workspaces/${workspaceId}`)} className="mb-5 cursor-pointer text-sm font-medium text-slate-500 hover:text-indigo-700">
          ← {workspace?.name || 'Workspace'}
        </button>
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Projects</h1>
            <p className="mt-1 text-sm text-slate-600">Workspace projects and delivery status</p>
          </div>
          {canManage && <button onClick={() => { setEditing(null); setShowForm(true); }} className="cursor-pointer rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700">New Project</button>}
        </div>

        {projectState.error && <p className="mb-5 rounded-md border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{projectState.error}</p>}
        {projectState.loading && !projects.length
          ? <p className="py-8 text-sm text-slate-500">Loading projects…</p>
          : <ProjectList projects={projects} canManage={canManage} onOpen={(project) => navigate(`/workspaces/${workspaceId}/projects/${project._id}`)} onEdit={(project) => { setEditing(project); setShowForm(true); }} onDelete={remove} />}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
          <div role="dialog" aria-modal="true" aria-labelledby="project-form-title" className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
            <h2 id="project-form-title" className="mb-5 text-lg font-semibold text-slate-900">{editing ? 'Edit Project' : 'Create Project'}</h2>
            <ProjectForm initialProject={editing} onSubmit={save} onCancel={() => { setShowForm(false); setEditing(null); }} submitting={submitting} />
          </div>
        </div>
      )}
    </div>
  );
}
