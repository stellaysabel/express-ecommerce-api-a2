const express = require('express');
const db = require('../knex');
const { requireAuth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');           

const router = express.Router();

async function expand(orderId) {
  const order = await db('orders').where({ id: orderId }).first();
  const lines = await db('order_lines').where({ order_id: orderId }).select('*');
  return { ...order, lines };
}

// Create order (auth required)
router.post('/', requireAuth, async (req, res, next) => {
  const trx = await db.transaction();
  try {
    const { items } = req.body; // [{productId, quantity}]
    if (!Array.isArray(items) || items.length === 0) {
      await trx.rollback();
      return res.status(400).json({ error: 'items[] required' });
    }

    // Load products
    const ids = items.map(i => i.productId);
    const products = await trx('products').whereIn('id', ids);
    const byId = new Map(products.map(p => [p.id, p]));

    // Validate items
    for (const it of items) {
      const p = byId.get(it.productId);
      if (!p) { await trx.rollback(); return res.status(400).json({ error: `Product not found: ${it.productId}` }); }
      if (!Number.isInteger(it.quantity) || it.quantity <= 0) {
        await trx.rollback(); return res.status(400).json({ error: 'Each item requires positive integer quantity' });
      }
      if (p.stock < it.quantity) {
        await trx.rollback(); return res.status(400).json({ error: `Insufficient stock for ${p.name}` });
      }
    }

    // Create order with an app-generated UUID
    const orderId = uuidv4();
    await trx('orders').insert({
      id: orderId,
      customer_id: req.user.id,
      status: 'NEW',
      total: 0
    });

    // Insert lines (each with its own UUID)
    let total = 0;
    for (const it of items) {
      const p = byId.get(it.productId);
      const unit = Number(p.price);
      const lineTotal = +(unit * it.quantity).toFixed(2);
      total += lineTotal;

      await trx('order_lines').insert({
        id: uuidv4(),             // generate id for the line
        order_id: orderId,
        product_id: p.id,
        quantity: it.quantity,
        unit_price: unit,
        line_total: lineTotal
      });

      await trx('products').where({ id: p.id }).update({ stock: p.stock - it.quantity });
      byId.set(p.id, { ...p, stock: p.stock - it.quantity });
    }

    await trx('orders').where({ id: orderId }).update({ total: +total.toFixed(2) });
    await trx.commit();

    const expanded = await expand(orderId);
    res.status(201).json(expanded);
  } catch (e) {
    try { await trx.rollback(); } catch (_) {}
    next(e);
  }
});

// My orders
router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const orders = await db('orders')
      .where({ customer_id: req.user.id })
      .orderBy('created_at', 'desc');
    const orderIds = orders.map(o => o.id);
    const lines = await db('order_lines').whereIn('order_id', orderIds);
    const grouped = new Map(orders.map(o => [o.id, { ...o, lines: [] }]));
    for (const l of lines) {
      grouped.get(l.order_id).lines.push(l);
    }
    res.json(Array.from(grouped.values()));
  } catch (e) { next(e); }
});

// Get single order (owner only)
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const order = await db('orders').where({ id: req.params.id }).first();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.customer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const lines = await db('order_lines').where({ order_id: order.id });
    res.json({ ...order, lines });
  } catch (e) { next(e); }
});

module.exports = router;
