import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { socket, connectSocket } from '../socket/socket';
import { projectCreatedFromSocket, projectDeletedFromSocket, projectUpdatedFromSocket } from '../features/projects/projectSlice';
import { taskAssignedFromSocket, taskCreatedFromSocket, taskDeletedFromSocket, taskStatusChangedFromSocket, taskUpdatedFromSocket } from '../features/tasks/taskSlice';
import { commentCreatedFromSocket, commentDeletedFromSocket, commentUpdatedFromSocket } from '../features/comments/commentSlice';
import { socketConnected, socketDisconnected, socketError, socketPresenceUpdated, socketWorkspaceJoined } from '../features/socket/socketSlice';

export default function useWorkspaceSocket(workspaceId) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!workspaceId) return undefined;
    const joined = () => socket.emit('workspace:join', workspaceId, (result) => {
      if (result?.ok) dispatch(socketWorkspaceJoined(workspaceId));
      else dispatch(socketError(result?.message || 'Workspace socket access denied'));
    });
    const onConnect = () => { dispatch(socketConnected()); joined(); };
    const onDisconnect = () => dispatch(socketDisconnected());
    const onConnectError = (error) => dispatch(socketError(error.message));
    const onPresence = (payload) => dispatch(socketPresenceUpdated(payload));
    socket.on('connect', onConnect); socket.on('disconnect', onDisconnect); socket.on('connect_error', onConnectError); socket.on('workspace:presence', onPresence);
    socket.on('project:created', (payload) => dispatch(projectCreatedFromSocket(payload)));
    socket.on('project:updated', (payload) => dispatch(projectUpdatedFromSocket(payload)));
    socket.on('project:deleted', (payload) => dispatch(projectDeletedFromSocket(payload)));
    socket.on('task:created', (payload) => dispatch(taskCreatedFromSocket(payload)));
    socket.on('task:updated', (payload) => dispatch(taskUpdatedFromSocket(payload)));
    socket.on('task:assigned', (payload) => dispatch(taskAssignedFromSocket(payload)));
    socket.on('task:statusChanged', (payload) => dispatch(taskStatusChangedFromSocket(payload)));
    socket.on('task:deleted', (payload) => dispatch(taskDeletedFromSocket(payload)));
    socket.on('comment:created', (payload) => dispatch(commentCreatedFromSocket(payload)));
    socket.on('comment:updated', (payload) => dispatch(commentUpdatedFromSocket(payload)));
    socket.on('comment:deleted', (payload) => dispatch(commentDeletedFromSocket(payload)));
    if (!socket.connected) connectSocket(); else joined();
    return () => {
      if (socket.connected) socket.emit('workspace:leave', workspaceId);
      socket.off('connect', onConnect); socket.off('disconnect', onDisconnect); socket.off('connect_error', onConnectError); socket.off('workspace:presence', onPresence);
      socket.off('project:created'); socket.off('project:updated'); socket.off('project:deleted'); socket.off('task:created'); socket.off('task:updated'); socket.off('task:assigned'); socket.off('task:statusChanged'); socket.off('task:deleted'); socket.off('comment:created'); socket.off('comment:updated'); socket.off('comment:deleted');
    };
  }, [dispatch, workspaceId]);
}