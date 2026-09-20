import CommentItem from './CommentItem';

export default function CommentList({ comments, currentUserId, role, onUpdate, onDelete }) {
  const canModerate = role === 'OWNER' || role === 'ADMIN';
  return <div className="mt-4">{comments.length ? comments.map((comment) => <CommentItem key={comment._id} comment={comment} canModerate={canModerate} isAuthor={comment.userId?._id === currentUserId} onUpdate={(content) => onUpdate(comment._id, content)} onDelete={() => onDelete(comment._id)} />) : <p className="text-slate-500 text-sm">No comments yet.</p>}</div>;
}