import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import taskService from './taskService';

const keyFor = (workspaceId, projectId) => `${workspaceId}:${projectId}`;
const getError = (error) => error.response?.data?.message || error.message || 'Request failed';

export const fetchTasks = createAsyncThunk('tasks/fetchTasks', async ({ workspaceId, projectId }, { rejectWithValue }) => {
  try { return { workspaceId, projectId, tasks: await taskService.listTasks(workspaceId, projectId) }; }
  catch (error) { return rejectWithValue(getError(error)); }
});

export const fetchTask = createAsyncThunk('tasks/fetchTask', async ({ workspaceId, projectId, taskId }, { rejectWithValue }) => {
  try { return { workspaceId, projectId, task: await taskService.getTask(workspaceId, projectId, taskId) }; }
  catch (error) { return rejectWithValue(getError(error)); }
});

export const createTask = createAsyncThunk('tasks/createTask', async ({ workspaceId, projectId, taskData }, { rejectWithValue }) => {
  try { return { workspaceId, projectId, task: await taskService.createTask(workspaceId, projectId, taskData) }; }
  catch (error) { return rejectWithValue(getError(error)); }
});

export const updateTask = createAsyncThunk('tasks/updateTask', async ({ workspaceId, projectId, taskId, taskData }, { rejectWithValue }) => {
  try { return { workspaceId, projectId, task: await taskService.updateTask(workspaceId, projectId, taskId, taskData) }; }
  catch (error) { return rejectWithValue(getError(error)); }
});

export const deleteTask = createAsyncThunk('tasks/deleteTask', async ({ workspaceId, projectId, taskId }, { rejectWithValue }) => {
  try { await taskService.deleteTask(workspaceId, projectId, taskId); return { workspaceId, projectId, taskId }; }
  catch (error) { return rejectWithValue(getError(error)); }
});

const initialState = { tasksByProject: {}, currentTask: null, currentContext: null, loading: false, error: null };

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearTaskError: (state) => { state.error = null; },
    clearCurrentTask: (state) => { state.currentTask = null; state.currentContext = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTasks.fulfilled, (state, action) => { state.loading = false; state.tasksByProject[keyFor(action.payload.workspaceId, action.payload.projectId)] = action.payload.tasks; })
      .addCase(fetchTasks.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchTask.pending, (state) => { state.loading = true; state.error = null; state.currentTask = null; })
      .addCase(fetchTask.fulfilled, (state, action) => { state.loading = false; state.currentTask = action.payload.task; state.currentContext = keyFor(action.payload.workspaceId, action.payload.projectId); })
      .addCase(fetchTask.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createTask.fulfilled, (state, action) => { const key = keyFor(action.payload.workspaceId, action.payload.projectId); state.tasksByProject[key] = [action.payload.task, ...(state.tasksByProject[key] || [])]; })
      .addCase(updateTask.fulfilled, (state, action) => { const key = keyFor(action.payload.workspaceId, action.payload.projectId); state.tasksByProject[key] = (state.tasksByProject[key] || []).map((task) => task._id === action.payload.task._id ? action.payload.task : task); if (state.currentTask?._id === action.payload.task._id) state.currentTask = action.payload.task; })
      .addCase(deleteTask.fulfilled, (state, action) => { const key = keyFor(action.payload.workspaceId, action.payload.projectId); state.tasksByProject[key] = (state.tasksByProject[key] || []).filter((task) => task._id !== action.payload.taskId); if (state.currentTask?._id === action.payload.taskId) state.currentTask = null; });
  },
});

export const { clearTaskError, clearCurrentTask } = taskSlice.actions;
export default taskSlice.reducer;