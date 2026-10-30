const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Generate and set secure JWT token in HttpOnly cookie
router.post('/jwt', (req, res) => {
  try {
    const user = req.body;

    if (!user?.email) {
      return res.status(400).send({
        success: false,
        message: 'User email is required to issue token.',
      });
    }

    const token = jwt.sign(user, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      })
      .send({
        success: true,
        message: 'Token generated successfully.',
      });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Failed to issue token.',
      error: error.message,
    });
  }
});

// Clear token on logout
router.post('/logout', (req, res) => {
  try {
    res
      .clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 0,
      })
      .send({
        success: true,
        message: 'Logged out successfully, token removed.',
      });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Logout failed.',
      error: error.message,
    });
  }
});

module.exports = router;
