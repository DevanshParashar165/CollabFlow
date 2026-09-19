import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import workspaceService from './workspaceService';

export const fetchWorkspaces = createAsyncThunk(
  'workspaces/fetchWorkspaces',
  async (_, { rejectWithValue }) => {
    try {
      return await workspaceService.listWorkspaces();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchWorkspace = createAsyncThunk(
  'workspaces/fetchWorkspace',
  async (workspaceId, { rejectWithValue }) => {
    try {
      return await workspaceService.getWorkspace(workspaceId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createNewWorkspace = createAsyncThunk(
  'workspaces/createNewWorkspace',
  async (workspaceData, { rejectWithValue }) => {
    try {
      return await workspaceService.createWorkspace(workspaceData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateExistingWorkspace = createAsyncThunk(
  'workspaces/updateExistingWorkspace',
  async ({ workspaceId, workspaceData }, { rejectWithValue }) => {
    try {
      return await workspaceService.updateWorkspace(workspaceId, workspaceData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const removeExistingWorkspace = createAsyncThunk(
  'workspaces/removeExistingWorkspace',
  async (workspaceId, { rejectWithValue }) => {
    try {
      await workspaceService.deleteWorkspace(workspaceId);
      return workspaceId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchMembers = createAsyncThunk(
  'workspaces/fetchMembers',
  async (workspaceId, { rejectWithValue }) => {
    try {
      return await workspaceService.listMembers(workspaceId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const addNewMember = createAsyncThunk(
  'workspaces/addNewMember',
  async ({ workspaceId, memberData }, { rejectWithValue }) => {
    try {
      return await workspaceService.addMember(workspaceId, memberData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateMemberRole = createAsyncThunk(
  'workspaces/updateMemberRole',
  async ({ workspaceId, userId, roleData }, { rejectWithValue }) => {
    try {
      return await workspaceService.updateMember(workspaceId, userId, roleData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const removeMember = createAsyncThunk(
  'workspaces/removeMember',
  async ({ workspaceId, userId }, { rejectWithValue }) => {
    try {
      await workspaceService.removeMember(workspaceId, userId);
      return userId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  workspaces: [],
  currentWorkspace: null,
  members: [],
  loading: false,
  error: null,
};

const workspaceSlice = createSlice({
  name: 'workspaces',
  initialState,
  reducers: {
    clearWorkspaceError: (state) => {
      state.error = null;
    },
    clearCurrentWorkspace: (state) => {
      state.currentWorkspace = null;
      state.members = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchWorkspaces
      .addCase(fetchWorkspaces.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.loading = false;
        state.workspaces = action.payload;
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchWorkspace
      .addCase(fetchWorkspace.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkspace.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWorkspace = action.payload;
      })
      .addCase(fetchWorkspace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // createNewWorkspace
      .addCase(createNewWorkspace.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNewWorkspace.fulfilled, (state, action) => {
        state.loading = false;
        state.workspaces.unshift(action.payload);
      })
      .addCase(createNewWorkspace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // updateExistingWorkspace
      .addCase(updateExistingWorkspace.fulfilled, (state, action) => {
        if (state.currentWorkspace && state.currentWorkspace._id === action.payload._id) {
          state.currentWorkspace = { ...state.currentWorkspace, ...action.payload };
        }
        const index = state.workspaces.findIndex((w) => w._id === action.payload._id);
        if (index !== -1) {
          state.workspaces[index] = { ...state.workspaces[index], ...action.payload };
        }
      })

      // removeExistingWorkspace
      .addCase(removeExistingWorkspace.fulfilled, (state, action) => {
        state.workspaces = state.workspaces.filter((w) => w._id !== action.payload);
        if (state.currentWorkspace?._id === action.payload) {
          state.currentWorkspace = null;
          state.members = [];
        }
      })

      // fetchMembers
      .addCase(fetchMembers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.members = action.payload;
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // addNewMember
      .addCase(addNewMember.fulfilled, (state, action) => {
        state.members.push(action.payload);
      })

      // updateMemberRole
      .addCase(updateMemberRole.fulfilled, (state, action) => {
        const index = state.members.findIndex((m) => m.user?._id === action.payload.userId);
        if (index !== -1) {
          state.members[index].role = action.payload.role;
        }
      })

      // removeMember
      .addCase(removeMember.fulfilled, (state, action) => {
        state.members = state.members.filter((m) => m.user?._id !== action.payload);
      });
  },
});

export const { clearWorkspaceError, clearCurrentWorkspace } = workspaceSlice.actions;
export default workspaceSlice.reducer;
