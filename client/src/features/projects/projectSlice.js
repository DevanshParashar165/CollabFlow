import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import projectService from './projectService';

const errorMessage = (error) => error.response?.data?.message || error.message || 'Request failed';

export const fetchProjects = createAsyncThunk('projects/fetchProjects', async (workspaceId, { rejectWithValue }) => {
  try { return { workspaceId, projects: await projectService.listProjects(workspaceId) }; }
  catch (error) { return rejectWithValue(errorMessage(error)); }
});

export const fetchProject = createAsyncThunk('projects/fetchProject', async ({ workspaceId, projectId }, { rejectWithValue }) => {
  try { return { workspaceId, project: await projectService.getProject(workspaceId, projectId) }; }
  catch (error) { return rejectWithValue(errorMessage(error)); }
});

export const createProject = createAsyncThunk('projects/createProject', async ({ workspaceId, projectData }, { rejectWithValue }) => {
  try { return { workspaceId, project: await projectService.createProject(workspaceId, projectData) }; }
  catch (error) { return rejectWithValue(errorMessage(error)); }
});

export const updateProject = createAsyncThunk('projects/updateProject', async ({ workspaceId, projectId, projectData }, { rejectWithValue }) => {
  try { return { workspaceId, project: await projectService.updateProject(workspaceId, projectId, projectData) }; }
  catch (error) { return rejectWithValue(errorMessage(error)); }
});

export const deleteProject = createAsyncThunk('projects/deleteProject', async ({ workspaceId, projectId }, { rejectWithValue }) => {
  try { await projectService.deleteProject(workspaceId, projectId); return { workspaceId, projectId }; }
  catch (error) { return rejectWithValue(errorMessage(error)); }
});

const initialState = { projectsByWorkspace: {}, currentProject: null, currentWorkspaceId: null, loading: false, error: null };

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearProjectError: (state) => { state.error = null; },
    clearCurrentProject: (state) => { state.currentProject = null; state.currentWorkspaceId = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProjects.fulfilled, (state, action) => { state.loading = false; state.projectsByWorkspace[action.payload.workspaceId] = action.payload.projects; })
      .addCase(fetchProjects.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchProject.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProject.fulfilled, (state, action) => { state.loading = false; state.currentProject = action.payload.project; state.currentWorkspaceId = action.payload.workspaceId; })
      .addCase(fetchProject.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createProject.fulfilled, (state, action) => {
        const list = state.projectsByWorkspace[action.payload.workspaceId] || [];
        list.unshift(action.payload.project);
        state.projectsByWorkspace[action.payload.workspaceId] = list;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        const list = state.projectsByWorkspace[action.payload.workspaceId] || [];
        state.projectsByWorkspace[action.payload.workspaceId] = list.map((project) => project._id === action.payload.project._id ? action.payload.project : project);
        if (state.currentProject?._id === action.payload.project._id) state.currentProject = action.payload.project;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        const list = state.projectsByWorkspace[action.payload.workspaceId] || [];
        state.projectsByWorkspace[action.payload.workspaceId] = list.filter((project) => project._id !== action.payload.projectId);
        if (state.currentProject?._id === action.payload.projectId) state.currentProject = null;
      });
  },
});

export const { clearProjectError, clearCurrentProject } = projectSlice.actions;
export default projectSlice.reducer;