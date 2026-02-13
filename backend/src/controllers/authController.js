const db = require('../config/database');
const jwt = require('jsonwebtoken');
const { hashPassword, comparePasswords } = require('../utils/password');
const { logAudit } = require('../utils/auditLog');
const { v4: uuidv4 } = require('uuid');

// API 1: Tenant Registration
const registerTenant = async (req, res) => {
  const client = await db.connect();
  try {
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.validatedBody;

    // Check if subdomain exists
    const subdomainExists = await client.query('SELECT id FROM tenants WHERE subdomain = $1', [subdomain.toLowerCase()]);
    if (subdomainExists.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Subdomain already exists' });
    }

    // Check if email exists
    const emailExists = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail.toLowerCase()]);
    if (emailExists.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    await client.query('BEGIN');

    const tenantId = uuidv4();
    const userId = uuidv4();
    const hashedPassword = await hashPassword(adminPassword);

    // Create tenant with free plan
    await client.query(
      `INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [tenantId, tenantName, subdomain.toLowerCase(), 'active', 'free', 5, 3]
    );

    // Create admin user
    await client.query(
      `INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, tenantId, adminEmail.toLowerCase(), hashedPassword, adminFullName, 'tenant_admin', true]
    );

    // Log audit
    await client.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, userId, 'REGISTER_TENANT', 'tenant', tenantId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      data: {
        tenantId,
        subdomain: subdomain.toLowerCase(),
        adminUser: {
          id: userId,
          email: adminEmail,
          fullName: adminFullName,
          role: 'tenant_admin'
        }
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Register tenant error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    client.release();
  }
};

// API 2: User Login
const login = async (req, res) => {
  try {
    const { email, password, tenantSubdomain } = req.validatedBody;

    // Find tenant by subdomain
    let tenant;
    if (tenantSubdomain) {
      const tenantResult = await db.query('SELECT * FROM tenants WHERE subdomain = $1', [tenantSubdomain.toLowerCase()]);
      if (tenantResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Tenant not found' });
      }
      tenant = tenantResult.rows[0];
      
      if (tenant.status !== 'active') {
        return res.status(403).json({ success: false, message: 'Tenant is not active' });
      }
    }

    // Find user
    const query = tenantSubdomain
      ? 'SELECT * FROM users WHERE email = $1 AND tenant_id = $2'
      : 'SELECT * FROM users WHERE email = $1 AND role = $2';
    
    const params = tenantSubdomain
      ? [email.toLowerCase(), tenant.id]
      : [email.toLowerCase(), 'super_admin'];

    const userResult = await db.query(query, params);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    }

    // Verify password
    const passwordValid = await comparePasswords(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Get tenant info if user is not super admin
    let tenantInfo = null;
    if (user.role !== 'super_admin') {
      const tenantData = await db.query('SELECT * FROM tenants WHERE id = $1', [user.tenant_id]);
      if (tenantData.rows.length > 0) {
        tenantInfo = tenantData.rows[0];
      }
    }

    // Log audit
    await logAudit(user.tenant_id, user.id, 'LOGIN', 'user', user.id);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          tenantId: user.tenant_id
        },
        token,
        expiresIn: 86400
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// API 3: Get Current User
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    const userResult = await db.query(
      'SELECT id, email, full_name, role, is_active FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];
    let tenantInfo = null;

    if (tenantId) {
      const tenantResult = await db.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
      if (tenantResult.rows.length > 0) {
        const t = tenantResult.rows[0];
        tenantInfo = {
          id: t.id,
          name: t.name,
          subdomain: t.subdomain,
          subscriptionPlan: t.subscription_plan,
          maxUsers: t.max_users,
          maxProjects: t.max_projects
        };
      }
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isActive: user.is_active,
        tenant: tenantInfo
      }
    });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// API 4: Logout
const logout = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    // Log audit
    await logAudit(tenantId, userId, 'LOGOUT', 'user', userId);

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  registerTenant,
  login,
  getCurrentUser,
  logout
};
