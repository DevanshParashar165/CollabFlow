export default function ProjectCard({ project, canManage, onOpen, onEdit, onDelete }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:border-indigo-200 hover:shadow-md">
      <button onClick={onOpen} className="text-left w-full cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-slate-900">{project.name}</h3>
          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-1 text-xs text-indigo-700">{project.status}</span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{project.description || 'No description provided.'}</p>
        <p className="mt-4 text-xs text-slate-500">Created {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '-'}</p>
      </button>
      {canManage && (
        <div className="mt-4 flex gap-4 border-t border-slate-100 pt-3">
          <button onClick={onEdit} className="cursor-pointer text-xs font-medium text-indigo-700 hover:text-indigo-800">Edit</button>
          <button onClick={onDelete} className="cursor-pointer text-xs font-medium text-rose-600 hover:text-rose-700">Delete</button>
        </div>
      )}
    </article>
  );
}