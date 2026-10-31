require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./config/db');

// Route imports
const authRoutes = require('./routes/auth.routes');
const eventRoutes = require('./routes/event.routes');
const participantRoutes = require('./routes/participant.routes');
const analyticsRoutes = require('./routes/analytics.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS allowed origins
const allowedOrigins = ['http://localhost:3000', process.env.CLIENT_URL].filter(
  Boolean,
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Production fallback to ensure cross-origin deployment connectivity
      return callback(null, true);
    },
    credentials: true,
  }),
);

// Body and cookie parsing middleware
app.use(express.json());
app.use(cookieParser());

// Root health-check routes
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Social Development Events API is operating normally.',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Social Development Events API (/api) is operating normally.',
    timestamp: new Date().toISOString(),
  });
});

// Database connection middleware for serverless invocations
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection error in middleware:', error.message);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

// Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/analytics', analyticsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Local development listener
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server actively running on port ${PORT}`);
  });
}

// Export for Vercel Serverless Function
module.exports = app;
