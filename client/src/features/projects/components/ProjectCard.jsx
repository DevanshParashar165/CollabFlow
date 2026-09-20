export default function ProjectCard({ project, canManage, onOpen, onEdit, onDelete }) {
  return (
    <article className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-indigo-500/30 transition-colors">
      <button onClick={onOpen} className="text-left w-full cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-white font-semibold">{project.name}</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{project.status}</span>
        </div>
        <p className="text-slate-400 text-sm mt-2 line-clamp-2">{project.description || 'No description provided.'}</p>
        <p className="text-slate-600 text-xs mt-4">Created {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '-'}</p>
      </button>
      {canManage && (
        <div className="flex gap-3 mt-4 pt-3 border-t border-slate-800">
          <button onClick={onEdit} className="text-xs text-indigo-300 hover:text-indigo-200 cursor-pointer">Edit</button>
          <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-300 cursor-pointer">Delete</button>
        </div>
      )}
    </article>
  );
}