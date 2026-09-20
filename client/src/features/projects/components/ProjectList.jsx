import ProjectCard from './ProjectCard';

export default function ProjectList({ projects, canManage, onOpen, onEdit, onDelete }) {
  if (!projects.length) return <p className="text-slate-500 text-sm py-8 text-center">No projects yet.</p>;
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{projects.map((project) => <ProjectCard key={project._id} project={project} canManage={canManage} onOpen={() => onOpen(project)} onEdit={() => onEdit(project)} onDelete={() => onDelete(project)} />)}</div>;
}