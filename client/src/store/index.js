import { configureStore } from '@reduxjs/toolkit';
import systemReducer from './slices/systemSlice';
import authReducer from '../features/auth/authSlice';
import workspaceReducer from '../features/workspaces/workspaceSlice';

export const store = configureStore({
  reducer: {
    system: systemReducer,
    auth: authReducer,
    workspaces: workspaceReducer,
  },
  devTools: import.meta.env.DEV,
});

export default store;
