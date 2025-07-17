const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /recent - Get recent supplement checks for the authenticated user
router.get('/', async (req, res) => {
  try {
    // For now, return mock data since we need to implement user authentication
    // In a real implementation, this would fetch from stack_history table
    const mockRecentChecks = [
      {
        id: 1,
        stack: ['Creatine', 'Caffeine', 'Whey Protein'],
        checked_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        has_interactions: true
      },
      {
        id: 2,
        stack: ['BCAA', 'Glutamine'],
        checked_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        has_interactions: false
      },
      {
        id: 3,
        stack: ['Vitamin D', 'Magnesium', 'Zinc'],
        checked_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        has_interactions: false
      }
    ];

    res.json({ recent: mockRecentChecks });
  } catch (error) {
    console.error('Error fetching recent checks:', error);
    res.status(500).json({ error: 'Failed to fetch recent checks' });
  }
});

module.exports = router; 