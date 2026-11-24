'use strict';

/**
 * Custom application error.
 * Throw this anywhere in services or repositories;
 * the central error middleware will catch it and format the response.
 */
class AppError extends Error {
  /**
   * @param {string} message    - Human-readable error message
   * @param {number} statusCode - HTTP status code to respond with
   * @param {*}      errors     - Optional validation errors or detail array
   */
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
