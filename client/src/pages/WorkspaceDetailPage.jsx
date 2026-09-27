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
import useWorkspaceSocket from '../hooks/useWorkspaceSocket';

const ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];

const roleBadge = (role) => {
  switch (role) {
    case 'OWNER': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'ADMIN': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'MEMBER': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'VIEWER': return 'bg-slate-50 text-slate-600 border-slate-200';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

export default function WorkspaceDetailPage() {
  const { workspaceId } = useParams();
  useWorkspaceSocket(workspaceId);
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
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20"></div>
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error && !currentWorkspace) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-sm text-rose-700">{error}</p>
          <button onClick={() => navigate('/workspaces')} className="cursor-pointer text-sm font-medium text-indigo-700 hover:text-indigo-800">
            ← Back to Workspaces
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-slate-900">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back nav */}
        <button
          onClick={() => navigate('/workspaces')}
          className="mb-5 flex cursor-pointer items-center space-x-1 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-700"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span>All Workspaces</span>
        </button>

        {/* Workspace header */}
        {currentWorkspace && (
          <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-lg font-semibold text-indigo-700">
                  {currentWorkspace.name?.[0]?.toUpperCase() || 'W'}
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{currentWorkspace.name}</h1>
                  <p className="text-sm text-slate-500">/{currentWorkspace.slug}</p>
                  {currentWorkspace.description && (
                    <p className="mt-1 text-sm text-slate-600">{currentWorkspace.description}</p>
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
          <div className="mb-5 rounded-md border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
            {actionError}
          </div>
        )}

        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Projects</h2>
              <p className="text-slate-500 text-xs mt-0.5">Plan and track work in this workspace</p>
            </div>
            <button
              onClick={() => navigate(`/workspaces/${workspaceId}/projects`)}
              className="cursor-pointer rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              View Projects
            </button>
          </div>
        </div>

        {/* Members section */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Members</h2>
              <p className="text-slate-500 text-xs mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
            </div>
            {canManageMembers && (
              <button
                id="add-member-btn"
                onClick={() => setShowAddMember(true)}
                className="flex cursor-pointer items-center space-x-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
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
                  className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-sm font-semibold text-indigo-700">
                      {memberUser.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
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
                        className="cursor-pointer rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
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
                        className="cursor-pointer rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Add Member</h2>
              <button onClick={() => { setShowAddMember(false); setAddError(''); }} className="cursor-pointer text-slate-400 hover:text-slate-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {addError && (
              <div className="mb-4 rounded-md border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email Address <span className="text-rose-600">*</span></label>
                <input
                  id="add-member-email-input"
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="member@example.com"
                  className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
                <select
                  id="add-member-role-select"
                  value={addForm.role}
                  onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
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
                <button type="button" onClick={() => { setShowAddMember(false); setAddError(''); }} className="flex-1 cursor-pointer rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
                <button
                  id="add-member-submit-btn"
                  type="submit"
                  disabled={adding}
                  className="flex-1 cursor-pointer rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
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
