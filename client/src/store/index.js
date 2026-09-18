import { configureStore } from '@reduxjs/toolkit';
import systemReducer from './slices/systemSlice';
import authReducer from '../features/auth/authSlice';

export const store = configureStore({
  reducer: {
    system: systemReducer,
    auth: authReducer,
  },
  devTools: import.meta.env.DEV,
});

export default store;
