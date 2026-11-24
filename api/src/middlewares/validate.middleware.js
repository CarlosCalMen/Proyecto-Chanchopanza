'use strict';

const { validationResult } = require('express-validator');
const apiResponse           = require('../helpers/apiResponse');

/**
 * validateMiddleware
 *
 * Runs after express-validator rule chains.
 * If there are validation errors, returns a 422 response immediately.
 * Otherwise, passes control to the next handler.
 *
 * Usage (in routes):
 *   router.post('/login', loginRules, validateMiddleware, authController.login);
 */
const validateMiddleware = (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    return apiResponse.error(res, {
      statusCode: 422,
      message: 'Validation failed',
      errors: result.array().map(({ path, msg }) => ({ field: path, message: msg })),
    });
  }

  return next();
};

module.exports = validateMiddleware;
