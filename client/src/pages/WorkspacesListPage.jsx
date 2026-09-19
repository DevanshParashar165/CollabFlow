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
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Workspaces</h1>
            <p className="text-slate-400 mt-1 text-sm">Manage your collaborative project spaces</p>
          </div>
          <button
            id="create-workspace-btn"
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-200 flex items-center space-x-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>New Workspace</span>
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20"></div>
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && workspaces.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No workspaces yet</h3>
            <p className="text-slate-500 text-sm mb-6">Create your first workspace to start collaborating with your team.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-200 cursor-pointer"
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
                className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 hover:border-indigo-500/30 transition-all duration-200 cursor-pointer group"
                onClick={() => navigate(`/workspaces/${ws._id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                      {ws.name?.[0]?.toUpperCase() || 'W'}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold group-hover:text-indigo-300 transition-colors">{ws.name}</h3>
                      <p className="text-slate-500 text-xs">/{ws.slug}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                    ws.role === 'OWNER' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    ws.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    ws.role === 'MEMBER' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {ws.role}
                  </span>
                </div>
                {ws.description && (
                  <p className="text-slate-400 text-sm line-clamp-2 mb-3">{ws.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-slate-600 text-xs">
                    Created {ws.createdAt ? new Date(ws.createdAt).toLocaleDateString() : '-'}
                  </p>
                  {ws.role === 'OWNER' && (
                    <button
                      id={`delete-workspace-${ws._id}`}
                      onClick={(e) => { e.stopPropagation(); handleDelete(ws._id); }}
                      className="text-xs text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">Create Workspace</h2>
              <button
                onClick={() => { setShowCreateModal(false); setCreateError(''); }}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {createError && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Workspace Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="workspace-name-input"
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Alpha Project"
                  maxLength={50}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Description <span className="text-slate-500 text-xs">(optional)</span>
                </label>
                <textarea
                  id="workspace-description-input"
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of this workspace..."
                  maxLength={250}
                  rows={3}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all resize-none"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setCreateError(''); }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="create-workspace-submit-btn"
                  type="submit"
                  disabled={creating || !createForm.name.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all cursor-pointer"
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
