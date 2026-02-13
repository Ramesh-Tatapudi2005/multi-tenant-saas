const express = require('express');
const router = express.Router();
const { registerTenant, login, getCurrentUser, logout } = require('../controllers/authController');
const { validateRequest, validateTenantRegistration, validateLogin } = require('../utils/validation');
const { authenticateToken } = require('../middleware/auth');

// Public endpoints
router.post('/register-tenant', validateRequest(validateTenantRegistration), registerTenant);
router.post('/login', validateRequest(validateLogin), login);

// Protected endpoints
router.get('/me', authenticateToken, getCurrentUser);
router.post('/logout', authenticateToken, logout);

module.exports = router;
