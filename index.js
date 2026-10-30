const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { connectDB } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Standard Middlewares
app.use(
  cors({
    origin: [process.env.CLIENT_URL || 'http://localhost:3000'],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Base Health Check Route
app.get('/', (req, res) => {
  res.status(200).send({
    success: true,
    message: 'Social Development Events API is running smoothly.',
  });
});

// Start Server and Database Connection
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running smoothly on port: ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize server:', err);
  }
};

startServer();
