'use strict';

/**
 * Send a standardized success response.
 * @param {import('express').Response} res
 * @param {object} opts
 * @param {number}  opts.statusCode - HTTP status code (default 200)
 * @param {string}  opts.message    - Human-readable message
 * @param {*}       opts.data       - Payload (optional)
 * @param {object}  opts.meta       - Pagination or extra info (optional)
 */
const success = (res, { statusCode = 200, message = 'OK', data = null, meta = null } = {}) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(statusCode).json(body);
};

/**
 * Send a standardized error response.
 * @param {import('express').Response} res
 * @param {object} opts
 * @param {number}  opts.statusCode - HTTP status code (default 500)
 * @param {string}  opts.message    - Error message
 * @param {*}       opts.errors     - Validation errors or extra detail (optional)
 */
const error = (res, { statusCode = 500, message = 'Internal Server Error', errors = null } = {}) => {
  const body = { success: false, message };
  if (errors !== null) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { success, error };
