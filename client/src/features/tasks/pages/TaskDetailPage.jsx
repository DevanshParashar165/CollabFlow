import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { clearCurrentTask, fetchTask } from '../taskSlice';
import { createComment, deleteComment, fetchComments, updateComment } from '../../comments/commentSlice';
import { fetchTaskActivity } from '../../activity/activitySlice';
import { fetchWorkspace } from '../../workspaces/workspaceSlice';
import useWorkspaceSocket from '../../../hooks/useWorkspaceSocket';
import CommentForm from '../../comments/components/CommentForm';
import CommentList from '../../comments/components/CommentList';
import ActivityTimeline from '../../activity/components/ActivityTimeline';

const priorityStyle = {
  LOW: 'border-slate-200 bg-slate-50 text-slate-600',
  MEDIUM: 'border-blue-100 bg-blue-50 text-blue-700',
  HIGH: 'border-amber-100 bg-amber-50 text-amber-700',
  URGENT: 'border-rose-100 bg-rose-50 text-rose-700',
};

export default function TaskDetailPage() {
  const { workspaceId, projectId, taskId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useWorkspaceSocket(workspaceId);

  const { currentTask, loading, error } = useSelector((state) => state.tasks);
  const commentsState = useSelector((state) => state.comments);
  const activityState = useSelector((state) => state.activity);
  const user = useSelector((state) => state.auth.user);
  const role = useSelector((state) => state.workspaces.currentWorkspace?.role);
  const comments = commentsState.byTask[`${workspaceId}:${taskId}`] || [];
  const activities = activityState.byTask[`${workspaceId}:${taskId}`]?.activities || [];

  useEffect(() => {
    dispatch(fetchWorkspace(workspaceId));
    dispatch(fetchTask({ workspaceId, projectId, taskId }));
    dispatch(fetchComments({ workspaceId, taskId }));
    dispatch(fetchTaskActivity({ workspaceId, taskId }));
    return () => dispatch(clearCurrentTask());
  }, [dispatch, workspaceId, projectId, taskId]);

  const create = async (content) => {
    await dispatch(createComment({ workspaceId, taskId, content })).unwrap();
    dispatch(fetchTaskActivity({ workspaceId, taskId }));
  };
  const edit = async (commentId, content) => {
    await dispatch(updateComment({ workspaceId, taskId, commentId, content })).unwrap();
    dispatch(fetchTaskActivity({ workspaceId, taskId }));
  };
  const remove = async (commentId) => {
    if (window.confirm('Delete this comment?')) {
      await dispatch(deleteComment({ workspaceId, taskId, commentId })).unwrap();
      dispatch(fetchTaskActivity({ workspaceId, taskId }));
    }
  };

  if (loading && !currentTask) {
    return <div className="mx-auto flex min-h-[50vh] max-w-5xl items-center px-4 text-sm text-slate-500 sm:px-6 lg:px-8">Loading task…</div>;
  }
  if (error && !currentTask) {
    return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-rose-700 sm:px-6 lg:px-8">{error}</div>;
  }

  const taskPriority = currentTask?.priority?.toUpperCase();

  return (
    <div className="w-full text-slate-900">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(`/workspaces/${workspaceId}/projects/${projectId}`)}
          className="mb-5 cursor-pointer text-sm font-medium text-slate-500 transition-colors hover:text-indigo-700"
        >
          ← Project
        </button>

        {currentTask && (
          <>
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <h1 className="wrap-break-word text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{currentTask.title}</h1>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{currentTask.description || 'No description provided.'}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
                  <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">{currentTask.status}</span>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${priorityStyle[taskPriority] || priorityStyle.MEDIUM}`}>{currentTask.priority}</span>
                </div>
              </div>

              <div className="mt-6 grid gap-x-6 gap-y-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-slate-500">Assignee</p>
                  <p className="mt-1 text-slate-800">{currentTask.assignee?.name || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Due date</p>
                  <p className="mt-1 text-slate-800">{currentTask.dueDate ? new Date(currentTask.dueDate).toLocaleDateString() : 'None'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Created by</p>
                  <p className="mt-1 text-slate-800">{currentTask.createdBy?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Created / updated</p>
                  <p className="mt-1 text-slate-800">{new Date(currentTask.createdAt).toLocaleString()} · {new Date(currentTask.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </section>

            <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-base font-semibold text-slate-900">Comments</h2>
              <CommentList comments={comments} currentUserId={user?._id} role={role} onUpdate={edit} onDelete={remove} />
              {role !== 'VIEWER' && <CommentForm onSubmit={create} submitting={commentsState.loading} />}
            </section>

            <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-base font-semibold text-slate-900">Activity</h2>
              <ActivityTimeline activities={activities} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
