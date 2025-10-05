require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

const productsRouter = require('./routes/products');
const customersRouter = require('./routes/customers');
const ordersRouter = require('./routes/orders');
const s3Router = require('./routes/s3');
const db = require('./knex');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// new S3 routes
app.use('/s3', s3Routes);

app.get('/health', async (req, res) => {
  try {
    await db.raw('select 1+1 as result');
    res.json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ status: 'db_error', error: e.message });
  }
});

app.use('/api/products', productsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/s3', s3Router);

// Create a route to load test GET /api/products list multiple times
app.get('/api/load-test/products', async (req, res) => {
  const loadTest = async () => {
    try {
      await db('products').select('*');
    } catch (error) {
      console.error('Load test error:', error);
    }
  };

  // Start multiple load test requests
  for (let i = 0; i < 1000000; i++) {
    loadTest();
  }

  res.json({ status: 'load test started' });
});

// 404
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`API listening on http://0.0.0.0:${PORT}`);
});
