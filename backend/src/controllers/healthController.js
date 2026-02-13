const db = require('../config/database');

const healthCheck = async (req, res) => {
  try {
    // Test database connection
    const result = await db.query('SELECT 1');
    
    if (result) {
      return res.json({
        success: true,
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error('Health check error:', err);
    return res.status(503).json({
      success: false,
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  healthCheck
};
