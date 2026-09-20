import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchWorkspace,
  fetchMembers,
  addNewMember,
  updateMemberRole,
  removeMember,
  clearCurrentWorkspace,
} from '../features/workspaces/workspaceSlice';

const ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];

const roleBadge = (role) => {
  switch (role) {
    case 'OWNER': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'ADMIN': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    case 'MEMBER': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    case 'VIEWER': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
};

export default function WorkspaceDetailPage() {
  const { workspaceId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentWorkspace, members, loading, error } = useSelector((state) => state.workspaces);
  const { user } = useSelector((state) => state.auth);

  const [showAddMember, setShowAddMember] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', role: 'MEMBER' });
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);
  const [actionError, setActionError] = useState('');

  const myMembership = members.find((m) => m.user?._id === user?._id);
  const myRole = myMembership?.role || currentWorkspace?.role;
  const isOwner = myRole === 'OWNER';
  const isAdmin = myRole === 'ADMIN';
  const canManageMembers = isOwner || isAdmin;

  useEffect(() => {
    if (workspaceId) {
      dispatch(fetchWorkspace(workspaceId));
      dispatch(fetchMembers(workspaceId));
    }
    return () => {
      dispatch(clearCurrentWorkspace());
    };
  }, [dispatch, workspaceId]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!addForm.email.trim()) return;
    setAdding(true);
    setAddError('');
    try {
      await dispatch(addNewMember({ workspaceId, memberData: addForm })).unwrap();
      setShowAddMember(false);
      setAddForm({ email: '', role: 'MEMBER' });
    } catch (err) {
      setAddError(typeof err === 'string' ? err : 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleRoleChange = async (memberId, userId, newRole) => {
    setActionError('');
    try {
      await dispatch(updateMemberRole({ workspaceId, userId, roleData: { role: newRole } })).unwrap();
    } catch (err) {
      setActionError(typeof err === 'string' ? err : 'Failed to update role');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the workspace?')) return;
    setActionError('');
    try {
      await dispatch(removeMember({ workspaceId, userId })).unwrap();
    } catch (err) {
      setActionError(typeof err === 'string' ? err : 'Failed to remove member');
    }
  };

  if (loading && !currentWorkspace) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20"></div>
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error && !currentWorkspace) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate('/workspaces')} className="text-indigo-400 hover:text-indigo-300 text-sm cursor-pointer">
            ← Back to Workspaces
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Back nav */}
        <button
          onClick={() => navigate('/workspaces')}
          className="flex items-center space-x-1 text-slate-400 hover:text-white text-sm mb-6 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span>All Workspaces</span>
        </button>

        {/* Workspace header */}
        {currentWorkspace && (
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/25">
                  {currentWorkspace.name?.[0]?.toUpperCase() || 'W'}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{currentWorkspace.name}</h1>
                  <p className="text-slate-400 text-sm">/{currentWorkspace.slug}</p>
                  {currentWorkspace.description && (
                    <p className="text-slate-400 text-sm mt-1">{currentWorkspace.description}</p>
                  )}
                </div>
              </div>
              <span className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${roleBadge(myRole)}`}>
                {myRole}
              </span>
            </div>
          </div>
        )}

        {/* Action error */}
        {actionError && (
          <div className="mb-5 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
            {actionError}
          </div>
        )}

        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Projects</h2>
              <p className="text-slate-500 text-xs mt-0.5">Plan and track work in this workspace</p>
            </div>
            <button
              onClick={() => navigate(`/workspaces/${workspaceId}/projects`)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm cursor-pointer"
            >
              View Projects
            </button>
          </div>
        </div>

        {/* Members section */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Members</h2>
              <p className="text-slate-500 text-xs mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
            </div>
            {canManageMembers && (
              <button
                id="add-member-btn"
                onClick={() => setShowAddMember(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Member</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {members.map((m) => {
              const memberUser = m.user || {};
              const isMe = memberUser._id === user?._id;
              const isTargetOwner = m.role === 'OWNER';
              const canEdit = canManageMembers && (!isTargetOwner || isOwner) && !isMe;

              return (
                <div
                  key={m._id}
                  className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-800/40 border border-slate-700/40"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-sm">
                      {memberUser.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">
                        {memberUser.name || 'Unknown User'} {isMe && <span className="text-slate-500 text-xs">(you)</span>}
                      </p>
                      <p className="text-slate-500 text-xs">{memberUser.email || ''}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {canEdit ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m._id, memberUser._id, e.target.value)}
                        className="text-xs bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {ROLES.filter((r) => {
                          if (isAdmin && (r === 'OWNER' || r === 'ADMIN')) return false;
                          return true;
                        }).map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${roleBadge(m.role)}`}>
                        {m.role}
                      </span>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => handleRemoveMember(memberUser._id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                        title="Remove member"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">Add Member</h2>
              <button onClick={() => { setShowAddMember(false); setAddError(''); }} className="text-slate-500 hover:text-white cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {addError && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address <span className="text-red-400">*</span></label>
                <input
                  id="add-member-email-input"
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="member@example.com"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Role</label>
                <select
                  id="add-member-role-select"
                  value={addForm.role}
                  onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {ROLES.filter((r) => {
                    if (isAdmin && (r === 'OWNER' || r === 'ADMIN')) return false;
                    return true;
                  }).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => { setShowAddMember(false); setAddError(''); }} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm cursor-pointer">
                  Cancel
                </button>
                <button
                  id="add-member-submit-btn"
                  type="submit"
                  disabled={adding}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm cursor-pointer"
                >
                  {adding ? 'Adding…' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
