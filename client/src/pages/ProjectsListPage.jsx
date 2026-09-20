import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchWorkspace } from '../features/workspaces/workspaceSlice';
import { createProject, deleteProject, fetchProjects, updateProject } from '../features/projects/projectSlice';
import ProjectForm from '../features/projects/components/ProjectForm';
import ProjectList from '../features/projects/components/ProjectList';

export default function ProjectsListPage() {
  const { workspaceId } = useParams(); const dispatch = useDispatch(); const navigate = useNavigate();
  const workspace = useSelector((state) => state.workspaces.currentWorkspace); const projectState = useSelector((state) => state.projects);
  const [editing, setEditing] = useState(null); const [showForm, setShowForm] = useState(false); const [submitting, setSubmitting] = useState(false);
  const role = workspace?.role; const canManage = role === 'OWNER' || role === 'ADMIN'; const projects = projectState.projectsByWorkspace[workspaceId] || [];
  useEffect(() => { dispatch(fetchWorkspace(workspaceId)); dispatch(fetchProjects(workspaceId)); }, [dispatch, workspaceId]);
  const save = async (data) => { setSubmitting(true); try { if (editing) await dispatch(updateProject({ workspaceId, projectId: editing._id, projectData: data })).unwrap(); else await dispatch(createProject({ workspaceId, projectData: data })).unwrap(); setShowForm(false); setEditing(null); } finally { setSubmitting(false); } };
  const remove = async (project) => { if (window.confirm(`Delete ${project.name}?`)) await dispatch(deleteProject({ workspaceId, projectId: project._id })); };
  return <div className="min-h-screen bg-slate-950 text-white"><div className="max-w-5xl mx-auto px-6 py-10"><button onClick={() => navigate(`/workspaces/${workspaceId}`)} className="text-slate-400 hover:text-white text-sm mb-6 cursor-pointer">← {workspace?.name || 'Workspace'}</button><div className="flex items-center justify-between mb-8"><div><h1 className="text-3xl font-bold">Projects</h1><p className="text-slate-400 mt-1 text-sm">Workspace projects and delivery status</p></div>{canManage && <button onClick={() => { setEditing(null); setShowForm(true); }} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm cursor-pointer">New Project</button>}</div>{projectState.error && <p className="mb-5 text-red-400 text-sm">{projectState.error}</p>}{projectState.loading && !projects.length ? <p className="text-slate-500">Loading projects…</p> : <ProjectList projects={projects} canManage={canManage} onOpen={(project) => navigate(`/workspaces/${workspaceId}/projects/${project._id}`)} onEdit={(project) => { setEditing(project); setShowForm(true); }} onDelete={remove} />}</div>{showForm && <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"><div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md"><h2 className="text-xl font-bold mb-5">{editing ? 'Edit Project' : 'Create Project'}</h2><ProjectForm initialProject={editing} onSubmit={save} onCancel={() => { setShowForm(false); setEditing(null); }} submitting={submitting} /></div></div>}</div>;
}