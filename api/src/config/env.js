'use strict';

/**
 * env.js
 *
 * Validates required environment variables at startup.
 * Import this file first in server.js so the app fails fast
 * with a clear message instead of a cryptic runtime error.
 */

const REQUIRED = [
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`[Config] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

module.exports = {
  // Database
  DB_NAME:     process.env.DB_NAME,
  DB_USER:     process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_HOST:     process.env.DB_HOST     || 'localhost',
  DB_PORT:     parseInt(process.env.DB_PORT || '5432', 10),

  // Server
  PORT:        parseInt(process.env.PORT || '3000', 10),
  NODE_ENV:    process.env.NODE_ENV    || 'development',

  // JWT
  JWT_ACCESS_SECRET:      process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET:     process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN:  process.env.JWT_ACCESS_EXPIRES_IN  || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};
