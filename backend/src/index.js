require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/database');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Log requests in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// 404 handling for undefined routes before our routes
app.use('/api', (req, res, next) => {
  // Check if the route exists
  next();
});

// Health check (public, no auth)
app.use('/', require('./routes/healthRoutes'));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tenants', require('./routes/tenantRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await db.query('SELECT NOW()');
    console.log('Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to database:', err);
    setTimeout(startServer, 5000);
  }
};

startServer();

module.exports = app;
