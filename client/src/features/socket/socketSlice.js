import { createSlice } from '@reduxjs/toolkit';

const socketSlice = createSlice({
  name: 'socket',
  initialState: { connected: false, workspaceId: null, presence: [], error: null },
  reducers: {
    socketConnected: (state) => { state.connected = true; state.error = null; },
    socketDisconnected: (state) => { state.connected = false; state.workspaceId = null; state.presence = []; },
    socketWorkspaceJoined: (state, action) => { state.workspaceId = action.payload; },
    socketPresenceUpdated: (state, action) => { state.workspaceId = action.payload.workspaceId; state.presence = action.payload.users || []; },
    socketError: (state, action) => { state.error = action.payload; },
  },
});

export const { socketConnected, socketDisconnected, socketWorkspaceJoined, socketPresenceUpdated, socketError } = socketSlice.actions;
export default socketSlice.reducer;