const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // or use individual env vars
  // ssl: { rejectUnauthorized: false } // Uncomment for production with Heroku, etc.
});

module.exports = pool;
