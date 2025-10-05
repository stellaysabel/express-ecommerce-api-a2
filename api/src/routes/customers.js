const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../knex');
const { signToken, requireAuth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid'); // ✅ add this

const router = express.Router();

// Register route
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, password required' });
    }

    // check if user exists
    const exists = await db('customers')
      .whereRaw('LOWER(email)=LOWER(?)', [email])
      .first();
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const id = uuidv4(); // ✅ generate a UUID for the new row

    // include `id` when inserting
    const [cust] = await db('customers')
      .insert({ id, name, email, password_hash })
      .returning(['id', 'name', 'email', 'created_at']);

    const token = signToken({ id: cust.id, email: cust.email });
    res.status(201).json({ token, customer: cust });
  } catch (e) {
    next(e);
  }
});

// Login route
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    const user = await db('customers')
      .whereRaw('LOWER(email)=LOWER(?)', [email])
      .first();

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ id: user.id, email: user.email });
    const { id, name } = user;

    res.json({
      token,
      customer: { id, name, email: user.email, created_at: user.created_at },
    });
  } catch (e) {
    next(e);
  }
});

// Me route
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const me = await db('customers').where({ id: req.user.id }).first();
    if (!me) return res.status(404).json({ error: 'User not found' });

    const { id, name, email, created_at } = me;
    res.json({ id, name, email, created_at });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
