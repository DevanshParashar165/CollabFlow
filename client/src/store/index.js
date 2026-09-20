import { configureStore } from '@reduxjs/toolkit';
import systemReducer from './slices/systemSlice';
import authReducer from '../features/auth/authSlice';
import workspaceReducer from '../features/workspaces/workspaceSlice';
import projectReducer from '../features/projects/projectSlice';
import taskReducer from '../features/tasks/taskSlice';
import commentReducer from '../features/comments/commentSlice';
import activityReducer from '../features/activity/activitySlice';

export const store = configureStore({
  reducer: {
    system: systemReducer,
    auth: authReducer,
    workspaces: workspaceReducer,
    projects: projectReducer,
    tasks: taskReducer,
    comments: commentReducer,
    activity: activityReducer,
  },
  devTools: import.meta.env.DEV,
});

export default store;
