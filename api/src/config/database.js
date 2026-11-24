'use strict';

// Configuración exclusiva para Sequelize CLI (migraciones y seeders).
// La aplicación usa src/config/db.js.
require('dotenv').config();

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host:     process.env.DB_HOST || 'localhost',
  port:     process.env.DB_PORT || 5432,
  dialect:  'postgres',
  logging:  false,
};

module.exports = { development: base, production: base };
