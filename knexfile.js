require('dotenv').config();

const useSSL = String(process.env.DB_SSL || '').toLowerCase() === 'true';

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      ssl: useSSL ? { rejectUnauthorized: false } : false,
    },
    migrations: {
      directory: './migrations'
    },
    pool: { min: 0, max: 10 }
  }
};
