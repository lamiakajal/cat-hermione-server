const express = require('express');
const router = express.Router();

// Participant test route
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Participant route is working properly',
  });
});

module.exports = router;
