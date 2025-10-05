require('dotenv').config();
const knex = require('knex');

const useSSL = String(process.env.DB_SSL || '').toLowerCase() === 'true';

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: String(process.env.DB_PASSWORD ?? ''),
    database: process.env.DB_DATABASE || 'ecommerce',
    ssl: useSSL ? { rejectUnauthorized: false } : false,
  },
  // 👇 Add this so migrations and queries use your schema first
  searchPath: [process.env.DB_SCHEMA || process.env.DB_USER || 'public'],
  pool: { min: 0, max: 10 },
});

module.exports = db;
