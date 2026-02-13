const db = require('../config/database');
const { hashPassword } = require('../utils/password');
const { logAudit } = require('../utils/auditLog');
const { v4: uuidv4 } = require('uuid');

// API 8: Add User to Tenant
const addUser = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const userRole = req.user.role;
    const userTenantId = req.user.tenantId;
    const userId = req.user.userId;
    const { email, password, fullName, role = 'user' } = req.validatedBody;

    // Check authorization (tenant admin only)
    if (userRole !== 'tenant_admin' || userTenantId !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check if tenant exists
    const tenantResult = await db.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const tenant = tenantResult.rows[0];

    // Check user limit
    const userCount = await db.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
    if (parseInt(userCount.rows[0].count) >= tenant.max_users) {
      return res.status(403).json({ success: false, message: 'Subscription limit reached' });
    }

    // Check if email exists in tenant
    const emailExists = await db.query('SELECT id FROM users WHERE tenant_id = $1 AND email = $2', [tenantId, email.toLowerCase()]);
    if (emailExists.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already exists in this tenant' });
    }

    const newUserId = uuidv4();
    const hashedPassword = await hashPassword(password);

    await db.query(
      'INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [newUserId, tenantId, email.toLowerCase(), hashedPassword, fullName, role, true]
    );

    // Log audit
    await logAudit(tenantId, userId, 'CREATE_USER', 'user', newUserId);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUserId,
        email: email.toLowerCase(),
        fullName: fullName,
        role: role,
        tenantId: tenantId,
        isActive: true,
        createdAt: new Date()
      }
    });
  } catch (err) {
    console.error('Add user error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// API 9: List Tenant Users
const listUsers = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const userRole = req.user.role;
    const userTenantId = req.user.tenantId;
    const { search, role, page = 1, limit = 50 } = req.query;

    // Check authorization
    if (userRole !== 'super_admin' && userTenantId !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    let query = 'SELECT id, email, full_name, role, is_active, created_at FROM users WHERE tenant_id = $1';
    const values = [tenantId];
    let paramCount = 2;

    if (search) {
      query += ` AND (email ILIKE $${paramCount} OR full_name ILIKE $${paramCount++})`;
      values.push(`%${search}%`);
    }

    if (role) {
      query += ` AND role = $${paramCount++}`;
      values.push(role);
    }

    // Get total count (before pagination)
    const countQuery = query.replace('SELECT id, email, full_name, role, is_active, created_at', 'SELECT COUNT(*)');
    const countResult = await db.query(countQuery, values.slice());
    const totalUsers = parseInt(countResult.rows[0].count);

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(limit, offset);

    const result = await db.query(query, values);

    const users = result.rows.map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      role: u.role,
      isActive: u.is_active,
      createdAt: u.created_at
    }));

    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      success: true,
      data: {
        users,
        total: totalUsers,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          limit: parseInt(limit)
        }
      }
    });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// API 10: Update User
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;
    const userRole = req.user.role;
    const userTenantId = req.user.tenantId;
    const { fullName, role, isActive } = req.body;

    // Get user details
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Check authorization
    const isSelf = userId === currentUserId;
    const isTenantAdmin = userRole === 'tenant_admin' && user.tenant_id === userTenantId;

    if (!isSelf && !isTenantAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Only tenant admin can update role and is_active
    if ((role !== undefined || isActive !== undefined) && !isTenantAdmin) {
      return res.status(403).json({ success: false, message: 'Only tenant admin can update these fields' });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (fullName !== undefined) {
      updates.push(`full_name = $${paramCount++}`);
      values.push(fullName);
    }

    if (role !== undefined && isTenantAdmin) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }

    if (isActive !== undefined && isTenantAdmin) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date());
    values.push(userId);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await db.query(query, values);

    const updatedUser = result.rows[0];

    // Log audit
    await logAudit(user.tenant_id, currentUserId, 'UPDATE_USER', 'user', userId);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: updatedUser.id,
        fullName: updatedUser.full_name,
        role: updatedUser.role,
        updatedAt: updatedUser.updated_at
      }
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// API 11: Delete User
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;
    const userRole = req.user.role;
    const userTenantId = req.user.tenantId;

    // Check if trying to delete self
    if (userId === currentUserId) {
      return res.status(403).json({ success: false, message: 'Cannot delete yourself' });
    }

    // Check authorization (tenant admin only)
    if (userRole !== 'tenant_admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get user
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Check if user belongs to same tenant
    if (user.tenant_id !== userTenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Set assigned_to to NULL for tasks
    await db.query('UPDATE tasks SET assigned_to = NULL WHERE assigned_to = $1', [userId]);

    // Delete user
    await db.query('DELETE FROM users WHERE id = $1', [userId]);

    // Log audit
    await logAudit(userTenantId, currentUserId, 'DELETE_USER', 'user', userId);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  addUser,
  listUsers,
  updateUser,
  deleteUser
};
