const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const environment = require('./config/environment');
const routes = require('./routes');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

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

module.exports = app;
