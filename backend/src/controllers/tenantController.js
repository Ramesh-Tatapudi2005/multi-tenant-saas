const db = require('../config/database');
const { logAudit } = require('../utils/auditLog');

// API 5: Get Tenant Details
const getTenantDetails = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const userTenantId = req.user.tenantId;

    // Check authorization (super admin or belongs to tenant)
    if (userRole !== 'super_admin' && userTenantId !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const tenantResult = await db.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const tenant = tenantResult.rows[0];

    // Get stats
    const usersCount = await db.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
    const projectsCount = await db.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [tenantId]);
    const tasksCount = await db.query('SELECT COUNT(*) FROM tasks WHERE tenant_id = $1', [tenantId]);

    res.json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: tenant.status,
        subscriptionPlan: tenant.subscription_plan,
        maxUsers: tenant.max_users,
        maxProjects: tenant.max_projects,
        createdAt: tenant.created_at,
        stats: {
          totalUsers: parseInt(usersCount.rows[0].count),
          totalProjects: parseInt(projectsCount.rows[0].count),
          totalTasks: parseInt(tasksCount.rows[0].count)
        }
      }
    });
  } catch (err) {
    console.error('Get tenant details error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// API 6: Update Tenant
const updateTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const userRole = req.user.role;
    const userTenantId = req.user.tenantId;
    const userId = req.user.userId;
    const { name, status, subscriptionPlan, maxUsers, maxProjects } = req.body;

    // Check authorization
    if (userRole !== 'super_admin' && userTenantId !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check if trying to update restricted fields as tenant admin
    if (userRole !== 'super_admin' && (status || subscriptionPlan || maxUsers !== undefined || maxProjects !== undefined)) {
      return res.status(403).json({ success: false, message: 'Only super admin can update these fields' });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (status !== undefined && userRole === 'super_admin') {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (subscriptionPlan !== undefined && userRole === 'super_admin') {
      updates.push(`subscription_plan = $${paramCount++}`);
      values.push(subscriptionPlan);
    }
    if (maxUsers !== undefined && userRole === 'super_admin') {
      updates.push(`max_users = $${paramCount++}`);
      values.push(maxUsers);
    }
    if (maxProjects !== undefined && userRole === 'super_admin') {
      updates.push(`max_projects = $${paramCount++}`);
      values.push(maxProjects);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date());
    values.push(tenantId);

    const query = `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const tenant = result.rows[0];

    // Log audit
    await logAudit(tenantId, userId, 'UPDATE_TENANT', 'tenant', tenantId);

    res.json({
      success: true,
      message: 'Tenant updated successfully',
      data: {
        id: tenant.id,
        name: tenant.name,
        updatedAt: tenant.updated_at
      }
    });
  } catch (err) {
    console.error('Update tenant error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// API 7: List All Tenants (super admin only)
const listTenants = async (req, res) => {
  try {
    const userRole = req.user.role;
    const { page = 1, limit = 10, status, subscriptionPlan } = req.query;

    if (userRole !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only super admin can list tenants' });
    }

    let query = 'SELECT * FROM tenants WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (status) {
      query += ` AND status = $${paramCount++}`;
      values.push(status);
    }
    if (subscriptionPlan) {
      query += ` AND subscription_plan = $${paramCount++}`;
      values.push(subscriptionPlan);
    }

    // Get total count
    const countResult = await db.query(`SELECT COUNT(*) FROM tenants WHERE 1=1${status ? ` AND status = $${values.length}` : ''}${subscriptionPlan ? ` AND subscription_plan = $${values.length}` : ''}`, values);
    const totalTenants = parseInt(countResult.rows[0].count);

    // Get paginated results
    const offset = (page - 1) * limit;
    query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    values.push(limit, offset);

    const result = await db.query(query, values);

    const tenants = await Promise.all(result.rows.map(async (t) => {
      const users = await db.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [t.id]);
      const projects = await db.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [t.id]);

      return {
        id: t.id,
        name: t.name,
        subdomain: t.subdomain,
        status: t.status,
        subscriptionPlan: t.subscription_plan,
        totalUsers: parseInt(users.rows[0].count),
        totalProjects: parseInt(projects.rows[0].count),
        createdAt: t.created_at
      };
    }));

    const totalPages = Math.ceil(totalTenants / limit);

    res.json({
      success: true,
      data: {
        tenants,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTenants,
          limit: parseInt(limit)
        }
      }
    });
  } catch (err) {
    console.error('List tenants error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getTenantDetails,
  updateTenant,
  listTenants
};
