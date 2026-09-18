import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import environment from './config/environment.js';
import routes from './routes/index.js';
import notFoundHandler from './middleware/notFoundHandler.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './utils/logger.js';

// Initialize Express application
const app = express();

// Global Middleware
app.use(
  cors({
    origin: environment.clientUrl,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Development request logging
if (environment.isDevelopment) {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// Mount API routes
app.use('/api', routes);

// 404 handler for unknown routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
