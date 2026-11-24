'use strict';

const apiResponse = require('../helpers/apiResponse');
const AppError    = require('../helpers/AppError');

/**
 * errorMiddleware
 *
 * Central error handler — must be registered LAST in app.js (after all routes).
 * Catches errors forwarded via next(err).
 *
 * Handles:
 *   - AppError instances (operational errors with known statusCode)
 *   - Sequelize validation / constraint errors
 *   - Unexpected errors (logged, generic 500 returned)
 *
 * Usage in app.js:
 *   app.use(errorMiddleware);   // ← last middleware
 */
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  // ── Known operational errors ───────────────────────────────────────────────
  if (err instanceof AppError) {
    return apiResponse.error(res, {
      statusCode: err.statusCode,
      message:    err.message,
      errors:     err.errors,
    });
  }

  // ── Sequelize validation errors ────────────────────────────────────────────
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return apiResponse.error(res, {
      statusCode: 422,
      message: 'Database validation error',
      errors: err.errors?.map((e) => ({ field: e.path, message: e.message })) ?? null,
    });
  }

  // ── Sequelize FK constraint errors ─────────────────────────────────────────
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return apiResponse.error(res, {
      statusCode: 409,
      message: 'Cannot complete operation: related record constraint violation',
    });
  }

  // ── Unexpected errors (log and hide internals from client) ─────────────────
  console.error('[Unhandled Error]', err);

  return apiResponse.error(res, {
    statusCode: 500,
    message: 'An unexpected error occurred',
  });
};

module.exports = errorMiddleware;
