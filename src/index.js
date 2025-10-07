require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

const productsRouter = require('./routes/products');
const customersRouter = require('./routes/customers');
const ordersRouter = require('./routes/orders');
const s3Router = require('./routes/s3');
const cognitoRouter = require('./routes/cognito');

const { requireCognitoAuth } = require('./middleware/cognitoAuth'); // ✅ use Cognito middleware
const db = require('./knex');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// remove this stray line (non-API, wrong path):
// app.use('/s3', s3Router);

app.get('/health', async (req, res) => {
  try { await db.raw('select 1+1 as result'); res.json({ status: 'ok' }); }
  catch (e) { res.status(500).json({ status: 'db_error', error: e.message }); }
});

// Public routes
app.use('/api/products', productsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/cognito', cognitoRouter);

// Protected by Cognito JWT
app.use('/api/orders', requireCognitoAuth, ordersRouter);
app.use('/api/s3', requireCognitoAuth, s3Router);

// 404 + error handler
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));
app.use((err, req, res, next) => {
  console.error(err); res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on http://0.0.0.0:${PORT}`);
});
