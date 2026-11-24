'use strict';

// Validate env vars before anything else
require('dotenv').config();
require('./src/config/env');

const app              = require('./src/app');
const { sequelize }    = require('./src/config/db');
const { PORT }         = require('./src/config/env');

const start = async () => {
  try {
    // Verify DB connection
    await sequelize.authenticate();
    console.log('[DB] Connection established successfully');

    app.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT} — ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
};

start();
