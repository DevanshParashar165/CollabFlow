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
    taskCreatedFromSocket: (state, action) => {
      const { workspaceId, projectId, taskId, ...task } = action.payload;
      const key = keyFor(workspaceId, projectId); const list = state.tasksByProject[key] || [];
      if (!list.some((item) => item._id === taskId)) state.tasksByProject[key] = [{ ...task, _id: taskId, workspaceId, projectId }, ...list];
    },
    taskUpdatedFromSocket: (state, action) => {
      const { workspaceId, projectId, taskId, ...changes } = action.payload; const key = keyFor(workspaceId, projectId);
      state.tasksByProject[key] = (state.tasksByProject[key] || []).map((item) => item._id === taskId ? { ...item, ...changes } : item);
      if (state.currentTask?._id === taskId) state.currentTask = { ...state.currentTask, ...changes };
    },
    taskStatusChangedFromSocket: (state, action) => {
      const { workspaceId, projectId, taskId, newStatus } = action.payload; const key = keyFor(workspaceId, projectId);
      state.tasksByProject[key] = (state.tasksByProject[key] || []).map((item) => item._id === taskId ? { ...item, status: newStatus } : item);
      if (state.currentTask?._id === taskId) state.currentTask.status = newStatus;
    },
    taskAssignedFromSocket: (state, action) => {
      const { workspaceId, projectId, taskId, newAssignee } = action.payload; const key = keyFor(workspaceId, projectId);
      state.tasksByProject[key] = (state.tasksByProject[key] || []).map((item) => item._id === taskId ? { ...item, assignee: newAssignee } : item);
      if (state.currentTask?._id === taskId) state.currentTask.assignee = newAssignee;
    },
    taskDeletedFromSocket: (state, action) => {
      const { workspaceId, projectId, taskId } = action.payload; const key = keyFor(workspaceId, projectId);
      state.tasksByProject[key] = (state.tasksByProject[key] || []).filter((item) => item._id !== taskId);
      if (state.currentTask?._id === taskId) state.currentTask = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTasks.fulfilled, (state, action) => { state.loading = false; state.tasksByProject[keyFor(action.payload.workspaceId, action.payload.projectId)] = action.payload.tasks; })
      .addCase(fetchTasks.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchTask.pending, (state) => { state.loading = true; state.error = null; state.currentTask = null; })
      .addCase(fetchTask.fulfilled, (state, action) => { state.loading = false; state.currentTask = action.payload.task; state.currentContext = keyFor(action.payload.workspaceId, action.payload.projectId); })
      .addCase(fetchTask.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createTask.fulfilled, (state, action) => {
        const { workspaceId, projectId, task } = action.payload;
        const key = keyFor(workspaceId, projectId);

        const list = state.tasksByProject[key] || [];

        const existingIndex = list.findIndex(
          (item) => item._id === task._id
        );

        if (existingIndex !== -1) {
          // Task already exists: update it instead of inserting a duplicate.
          list[existingIndex] = task;
        } else {
          // Task does not exist: insert it.
          state.tasksByProject[key] = [task, ...list];
        }
      })
      .addCase(updateTask.fulfilled, (state, action) => { const key = keyFor(action.payload.workspaceId, action.payload.projectId); state.tasksByProject[key] = (state.tasksByProject[key] || []).map((task) => task._id === action.payload.task._id ? action.payload.task : task); if (state.currentTask?._id === action.payload.task._id) state.currentTask = action.payload.task; })
      .addCase(deleteTask.fulfilled, (state, action) => { const key = keyFor(action.payload.workspaceId, action.payload.projectId); state.tasksByProject[key] = (state.tasksByProject[key] || []).filter((task) => task._id !== action.payload.taskId); if (state.currentTask?._id === action.payload.taskId) state.currentTask = null; });
  },
});

export const { clearTaskError, clearCurrentTask, taskCreatedFromSocket, taskUpdatedFromSocket, taskStatusChangedFromSocket, taskAssignedFromSocket, taskDeletedFromSocket } = taskSlice.actions;
export default taskSlice.reducer;