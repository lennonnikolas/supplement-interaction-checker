const express = require('express');
const pool = require('../db/pool');
const { authenticateJWT } = require('./auth');
const router = express.Router();

// POST /stacks - Save a new stack
// ... existing code ...
router.post('/', authenticateJWT, async (req, res) => {
    const { name, stack_data } = req.body;
    if (!Array.isArray(stack_data) && typeof stack_data !== 'object') {
      return res.status(400).json({ error: 'stack_data must be an array or object' });
    }
    try {
      const result = await pool.query(
        'INSERT INTO stacks (user_id, name, stack_data) VALUES ($1, $2, $3) RETURNING *',
        [req.user.id, name, JSON.stringify(stack_data)]
      );
      res.json({ stack: result.rows[0] });
    } catch (err) {
  +   console.error('Failed to save stack:', err); // <-- Add this line
      res.status(500).json({ error: 'Failed to save stack' });
    }
  });

// GET /stacks - List all stacks for user
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM stacks WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ stacks: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stacks' });
  }
});

// GET /stacks/history - List stack usage history (timeline)
router.get('/history', authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT h.*, s.name, s.stack_data FROM stack_history h
       JOIN stacks s ON h.stack_id = s.id
       WHERE h.user_id = $1
       ORDER BY h.checked_at DESC`,
      [req.user.id]
    );
    res.json({ history: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stack history' });
  }
});

// POST /stacks/:id/history - Add a history entry for a stack
router.post('/:id/history', authenticateJWT, async (req, res) => {
  const { result } = req.body; // result: JSON analysis result
  const stackId = req.params.id;
  try {
    const stack = await pool.query('SELECT * FROM stacks WHERE id = $1 AND user_id = $2', [stackId, req.user.id]);
    if (stack.rows.length === 0) return res.status(404).json({ error: 'Stack not found' });
    const insert = await pool.query(
      'INSERT INTO stack_history (user_id, stack_id, result) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, stackId, result]
    );
    res.json({ history: insert.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add stack history' });
  }
});

// DELETE /stacks/:id - Delete a stack for the logged-in user
router.delete('/:id', authenticateJWT, async (req, res) => {
  const stackId = req.params.id;
  try {
    const del = await pool.query('DELETE FROM stacks WHERE id = $1 AND user_id = $2 RETURNING *', [stackId, req.user.id]);
    if (del.rows.length === 0) return res.status(404).json({ error: 'Stack not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete stack' });
  }
});

module.exports = router; 