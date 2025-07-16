const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const passport = require('passport');

// Replace with your own secret in production!
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const JWT_EXPIRES_IN = '7d';

// Assume you have a db pool (pg.Pool) available
const pool = require('../db/pool');

// Helper: create JWT
function createToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Middleware: authenticate JWT
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// POST /auth/signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    console.log('existing:', existing);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hash]
    );
    const user = result.rows[0];
    const token = createToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error('Signup failed:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const result = await pool.query('SELECT id, email, password_hash FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = createToken(user);
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /auth/me (protected)
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Google OAuth: /auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback: /auth/google/callback
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), (req, res) => {
  // Issue JWT and redirect to frontend with token
  const token = createToken(req.user);
  // You may want to use a real frontend URL in production
  const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${redirectUrl}/oauth-success?token=${token}`);
});

module.exports = router; 