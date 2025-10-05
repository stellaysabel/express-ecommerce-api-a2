// src/db.js
const { Pool } = require("pg");

const pool = new Pool({
  host: "database-1-instance-1.ce2haupt2cta.ap-southeast-2.rds.amazonaws.com",
  port: 5432,
  database: "cohort_2025",
  user: "s053",
  password: "LX7oq1tn8kya",
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
