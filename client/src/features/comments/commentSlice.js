import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import commentService from './commentService';

const keyFor = (workspaceId, taskId) => `${workspaceId}:${taskId}`;
const errorMessage = (error) => error.response?.data?.message || error.message || 'Request failed';
export const fetchComments = createAsyncThunk('comments/fetchComments', async ({ workspaceId, taskId }, { rejectWithValue }) => { try { return { key: keyFor(workspaceId, taskId), comments: await commentService.listComments(workspaceId, taskId) }; } catch (error) { return rejectWithValue(errorMessage(error)); } });
export const createComment = createAsyncThunk('comments/createComment', async ({ workspaceId, taskId, content }, { rejectWithValue }) => { try { return { key: keyFor(workspaceId, taskId), comment: await commentService.createComment(workspaceId, taskId, { content }) }; } catch (error) { return rejectWithValue(errorMessage(error)); } });
export const updateComment = createAsyncThunk('comments/updateComment', async ({ workspaceId, taskId, commentId, content }, { rejectWithValue }) => { try { return { key: keyFor(workspaceId, taskId), comment: await commentService.updateComment(workspaceId, taskId, commentId, { content }) }; } catch (error) { return rejectWithValue(errorMessage(error)); } });
export const deleteComment = createAsyncThunk('comments/deleteComment', async ({ workspaceId, taskId, commentId }, { rejectWithValue }) => { try { await commentService.deleteComment(workspaceId, taskId, commentId); return { key: keyFor(workspaceId, taskId), commentId }; } catch (error) { return rejectWithValue(errorMessage(error)); } });

const slice = createSlice({
  name: 'comments', initialState: { byTask: {}, loading: false, error: null }, reducers: {
    clearCommentError: (state) => { state.error = null; },
    commentCreatedFromSocket: (state, action) => { const { workspaceId, taskId, commentId, ...comment } = action.payload; const key = keyFor(workspaceId, taskId); if (!(state.byTask[key] || []).some((item) => item._id === commentId)) state.byTask[key] = [...(state.byTask[key] || []), { ...comment, _id: commentId, taskId, workspaceId }]; },
    commentUpdatedFromSocket: (state, action) => { const { workspaceId, taskId, commentId, ...changes } = action.payload; const key = keyFor(workspaceId, taskId); state.byTask[key] = (state.byTask[key] || []).map((item) => item._id === commentId ? { ...item, ...changes } : item); },
    commentDeletedFromSocket: (state, action) => { const key = keyFor(action.payload.workspaceId, action.payload.taskId); state.byTask[key] = (state.byTask[key] || []).filter((item) => item._id !== action.payload.commentId); },
  }, extraReducers: (builder) => builder
    .addCase(fetchComments.pending, (state) => { state.loading = true; state.error = null; })
    .addCase(fetchComments.fulfilled, (state, action) => { state.loading = false; state.byTask[action.payload.key] = action.payload.comments; })
    .addCase(fetchComments.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
    .addCase(createComment.fulfilled, (state, action) => { state.byTask[action.payload.key] = [...(state.byTask[action.payload.key] || []), action.payload.comment]; })
    .addCase(updateComment.fulfilled, (state, action) => { state.byTask[action.payload.key] = (state.byTask[action.payload.key] || []).map((item) => item._id === action.payload.comment._id ? action.payload.comment : item); })
    .addCase(deleteComment.fulfilled, (state, action) => { state.byTask[action.payload.key] = (state.byTask[action.payload.key] || []).filter((item) => item._id !== action.payload.commentId); })
});
export const { clearCommentError, commentCreatedFromSocket, commentUpdatedFromSocket, commentDeletedFromSocket } = slice.actions;
export default slice.reducer;