const express = require('express');
const router = express.Router();
const { healthCheck } = require('../controllers/healthController');

// Public health check endpoint
router.get('/health', healthCheck);

module.exports = router;
