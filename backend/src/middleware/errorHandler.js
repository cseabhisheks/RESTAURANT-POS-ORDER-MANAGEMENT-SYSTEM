import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    const fieldErrors = Object.values(err.errors).map((e) => e.message);
    message = fieldErrors[0] || 'Validation failed';
    errors = fieldErrors;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path || 'identifier'} format.`;
  } else if (err.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `Duplicate value for ${duplicateField}.`;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired authentication token.';
  }

  if (statusCode >= 500 && env.nodeEnv !== 'test') {
    console.error('[Server Error]', err);
  }

  const payload = { success: false, message };
  if (errors) payload.errors = errors;

  res.status(statusCode).json(payload);
}
