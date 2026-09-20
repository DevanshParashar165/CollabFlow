import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { clearCurrentTask, fetchTask } from '../taskSlice';
import { createComment, deleteComment, fetchComments, updateComment } from '../../comments/commentSlice';
import { fetchTaskActivity } from '../../activity/activitySlice';
import CommentForm from '../../comments/components/CommentForm';
import CommentList from '../../comments/components/CommentList';
import ActivityTimeline from '../../activity/components/ActivityTimeline';

export default function TaskDetailPage() {
  const { workspaceId, projectId, taskId } = useParams(); const dispatch = useDispatch(); const navigate = useNavigate();
  const { currentTask, loading, error } = useSelector((state) => state.tasks);
  const commentsState = useSelector((state) => state.comments); const activityState = useSelector((state) => state.activity);
  const user = useSelector((state) => state.auth.user); const role = useSelector((state) => state.workspaces.currentWorkspace?.role);
  const comments = commentsState.byTask[`${workspaceId}:${taskId}`] || []; const activities = activityState.byTask[`${workspaceId}:${taskId}`]?.activities || [];
  useEffect(() => { dispatch(fetchTask({ workspaceId, projectId, taskId })); dispatch(fetchComments({ workspaceId, taskId })); dispatch(fetchTaskActivity({ workspaceId, taskId })); return () => dispatch(clearCurrentTask()); }, [dispatch, workspaceId, projectId, taskId]);
  if (loading && !currentTask) return <div className="min-h-screen bg-slate-950 text-slate-400 p-10">Loading task…</div>;
  if (error && !currentTask) return <div className="min-h-screen bg-slate-950 text-red-400 p-10">{error}</div>;
  const create = async (content) => { await dispatch(createComment({ workspaceId, taskId, content })).unwrap(); dispatch(fetchTaskActivity({ workspaceId, taskId })); };
  const edit = async (commentId, content) => { await dispatch(updateComment({ workspaceId, taskId, commentId, content })).unwrap(); dispatch(fetchTaskActivity({ workspaceId, taskId })); };
  const remove = async (commentId) => { if (window.confirm('Delete this comment?')) { await dispatch(deleteComment({ workspaceId, taskId, commentId })).unwrap(); dispatch(fetchTaskActivity({ workspaceId, taskId })); } };
  return <div className="min-h-screen bg-slate-950 text-white"><div className="max-w-4xl mx-auto px-6 py-10"><button onClick={() => navigate(`/workspaces/${workspaceId}/projects/${projectId}`)} className="text-slate-400 hover:text-white text-sm mb-8 cursor-pointer">← Project</button>{currentTask && <><div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6"><div className="flex justify-between gap-4"><div><h1 className="text-3xl font-bold">{currentTask.title}</h1><p className="text-slate-400 mt-2 whitespace-pre-wrap">{currentTask.description || 'No description provided.'}</p></div><div className="text-right text-xs"><p className="text-indigo-300">{currentTask.status}</p><p className="text-amber-300 mt-2">{currentTask.priority}</p></div></div><div className="grid sm:grid-cols-2 gap-4 mt-8 text-sm"><div><p className="text-slate-500">Assignee</p><p className="text-slate-200 mt-1">{currentTask.assignee?.name || 'Unassigned'}</p></div><div><p className="text-slate-500">Due date</p><p className="text-slate-200 mt-1">{currentTask.dueDate ? new Date(currentTask.dueDate).toLocaleDateString() : 'None'}</p></div><div><p className="text-slate-500">Created by</p><p className="text-slate-200 mt-1">{currentTask.createdBy?.name || 'Unknown'}</p></div><div><p className="text-slate-500">Created / updated</p><p className="text-slate-200 mt-1">{new Date(currentTask.createdAt).toLocaleString()} · {new Date(currentTask.updatedAt).toLocaleString()}</p></div></div></div><section className="mt-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6"><h2 className="text-xl font-semibold">Comments</h2><CommentList comments={comments} currentUserId={user?._id} role={role} onUpdate={edit} onDelete={remove} />{role !== 'VIEWER' && <CommentForm onSubmit={create} submitting={commentsState.loading} />}</section><section className="mt-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6"><h2 className="text-xl font-semibold">Activity</h2><ActivityTimeline activities={activities} /></section></>}</div></div>;
}
