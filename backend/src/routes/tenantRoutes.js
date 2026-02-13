const express = require('express');
const router = express.Router();
const { getTenantDetails, updateTenant, listTenants } = require('../controllers/tenantController');
const { authenticateToken, authorizeRole, authorizeTenant } = require('../middleware/auth');

// All requests require authentication
router.use(authenticateToken);

// API 7: List all tenants (super admin only)
router.get('/', authorizeRole(['super_admin']), listTenants);

// API 5: Get tenant details
router.get('/:tenantId', authorizeTenant, getTenantDetails);

// API 6: Update tenant
router.put('/:tenantId', authorizeTenant, updateTenant);

// Include user routes under tenants
router.use('/:tenantId/users', require('./userRoutes'));

module.exports = router;
