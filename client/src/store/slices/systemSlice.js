import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { checkApiHealth } from '../../services/api';

export const fetchSystemHealth = createAsyncThunk(
  'system/fetchHealth',
  async (_, { rejectWithValue }) => {
    try {
      const data = await checkApiHealth();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Health check failed');
    }
  }
);

const initialState = {
  initialized: true,
  healthStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  healthData: null,
  error: null,
};

const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    resetHealthStatus: (state) => {
      state.healthStatus = 'idle';
      state.healthData = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSystemHealth.pending, (state) => {
        state.healthStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchSystemHealth.fulfilled, (state, action) => {
        state.healthStatus = 'succeeded';
        state.healthData = action.payload;
      })
      .addCase(fetchSystemHealth.rejected, (state, action) => {
        state.healthStatus = 'failed';
        state.error = action.payload;
      });
  },
});

export const { resetHealthStatus } = systemSlice.actions;
export default systemSlice.reducer;
