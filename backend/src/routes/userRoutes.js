const express = require('express');
const router = express.Router({ mergeParams: true });
const { addUser, listUsers, updateUser, deleteUser } = require('../controllers/userController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { validateRequest, validateCreateUser } = require('../utils/validation');

// All requests require authentication
router.use(authenticateToken);

// API 8: Add user (tenant admin only)
router.post('/', authorizeRole(['tenant_admin']), validateRequest(validateCreateUser), addUser);

// API 9: List users
router.get('/', listUsers);

// API 10: Update user
router.put('/:userId', updateUser);

// API 11: Delete user (tenant admin only)
router.delete('/:userId', authorizeRole(['tenant_admin']), deleteUser);

module.exports = router;
