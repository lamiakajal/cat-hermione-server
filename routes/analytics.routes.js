const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');

// Health-check endpoint for analytics routes
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Analytics routes operating normally',
  });
});

// Summary statistics endpoint (events count, participants count, users count)
router.get('/summary', async (req, res) => {
  try {
    const db = getDB();

    const [totalEvents, totalParticipants, totalUsers] = await Promise.all([
      db.collection('events').countDocuments(),
      db.collection('participants').countDocuments(),
      db.collection('users').countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEvents,
        totalParticipants,
        totalUsers,
      },
    });
  } catch (error) {
    console.error('Analytics Fetch Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics data',
      error: error.message,
    });
  }
});

module.exports = router;
