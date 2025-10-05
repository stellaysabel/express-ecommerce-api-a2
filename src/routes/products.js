const express = require('express');
const db = require('../knex');
const { v4: uuidv4 } = require('uuid'); 

const router = express.Router();

// List products (public)
router.get('/', async (req, res, next) => {
  try {
    const rows = await db('products').select('*').orderBy('name');
    res.json(rows);
  } catch (e) { next(e); }
});

// Get product by ID (public)
router.get('/:id', async (req, res, next) => {
  try {
    const p = await db('products').where({ id: req.params.id }).first();
    if (!p) return res.status(404).json({ error: 'Product not found' });
    res.json(p);
  } catch (e) { next(e); }
});

// Create product (public for seeding)
router.post('/', async (req, res, next) => {
  try {
    const { name, sku, price, stock = 0, description = '' } = req.body;
    if (!name || !sku || typeof price !== 'number') {
      return res.status(400).json({ error: 'name, sku, and numeric price are required' });
    }

    // Generate UUID for new product
    const id = uuidv4();

    const [product] = await db('products')
      .insert({ id, name, sku, price, stock, description })
      .returning('*');

    res.status(201).json(product);
  } catch (e) {
    if (e.code === '23505') { // unique_violation
      return res.status(409).json({ error: 'SKU must be unique' });
    }
    next(e);
  }
});

// Delete product (admin)
router.delete('/:id', async (req, res, next) => {
  try {
    const rows = await db('products').where({ id: req.params.id }).del();
    if (!rows) return res.status(404).json({ error: 'Product not found' });
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
