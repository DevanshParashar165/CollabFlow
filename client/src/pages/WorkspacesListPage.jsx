import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchWorkspaces,
  createNewWorkspace,
  removeExistingWorkspace,
} from '../features/workspaces/workspaceSlice';
import { useEffect } from 'react';

export default function WorkspacesListPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { workspaces, loading, error } = useSelector((state) => state.workspaces);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      await dispatch(createNewWorkspace({ name: createForm.name, description: createForm.description })).unwrap();
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '' });
    } catch (err) {
      setCreateError(err || 'Failed to create workspace');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (workspaceId) => {
    if (!window.confirm('Delete this workspace? This action cannot be undone.')) return;
    try {
      await dispatch(removeExistingWorkspace(workspaceId)).unwrap();
    } catch (err) {
      alert(err || 'Failed to delete workspace');
    }
  };

  return (
    <div className="w-full text-slate-900">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Workspaces</h1>
            <p className="mt-1 text-sm text-slate-600">Manage your collaborative project spaces</p>
          </div>
          <button
            id="create-workspace-btn"
            onClick={() => setShowCreateModal(true)}
            className="flex cursor-pointer items-center space-x-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>New Workspace</span>
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-md border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20"></div>
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && workspaces.length === 0 && (
          <div className="py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white">
              <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">No workspaces yet</h3>
            <p className="mb-5 text-sm text-slate-600">Create your first workspace to start collaborating with your team.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="cursor-pointer rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Create Workspace
            </button>
          </div>
        )}

        {/* Workspace list */}
        {!loading && workspaces.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {workspaces.map((ws) => (
              <div
                key={ws._id}
                className="group cursor-pointer rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:border-indigo-200 hover:shadow-md"
                onClick={() => navigate(`/workspaces/${ws._id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-sm font-semibold text-indigo-700">
                      {ws.name?.[0]?.toUpperCase() || 'W'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-indigo-700">{ws.name}</h3>
                      <p className="text-slate-500 text-xs">/{ws.slug}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                    ws.role === 'OWNER' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    ws.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    ws.role === 'MEMBER' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {ws.role}
                  </span>
                </div>
                {ws.description && (
                  <p className="mb-3 line-clamp-2 text-sm text-slate-600">{ws.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Created {ws.createdAt ? new Date(ws.createdAt).toLocaleDateString() : '-'}
                  </p>
                  {ws.role === 'OWNER' && (
                    <button
                      id={`delete-workspace-${ws._id}`}
                      onClick={(e) => { e.stopPropagation(); handleDelete(ws._id); }}
                      className="cursor-pointer text-xs font-medium text-rose-600 opacity-0 transition-opacity hover:text-rose-700 group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Create Workspace</h2>
              <button
                onClick={() => { setShowCreateModal(false); setCreateError(''); }}
                className="cursor-pointer text-slate-400 transition-colors hover:text-slate-700"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {createError && (
              <div className="mb-4 rounded-md border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Workspace Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="workspace-name-input"
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Alpha Project"
                  maxLength={50}
                  className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description <span className="text-xs text-slate-500">(optional)</span>
                </label>
                <textarea
                  id="workspace-description-input"
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of this workspace..."
                  maxLength={250}
                  rows={3}
                  className="w-full resize-y rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setCreateError(''); }}
                  className="flex-1 cursor-pointer rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  id="create-workspace-submit-btn"
                  type="submit"
                  disabled={creating || !createForm.name.trim()}
                  className="flex-1 cursor-pointer rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
