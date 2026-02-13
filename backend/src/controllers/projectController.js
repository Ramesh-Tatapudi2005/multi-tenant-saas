const db = require('../config/database');
const { logAudit } = require('../utils/auditLog');
const { v4: uuidv4 } = require('uuid');

// API 12: Create Project
const createProject = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    const { name, description, status = 'active' } = req.validatedBody;

    // Check tenant
    const tenantResult = await db.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const tenant = tenantResult.rows[0];

    // Check project limit
    const projectCount = await db.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [tenantId]);
    if (parseInt(projectCount.rows[0].count) >= tenant.max_projects) {
      return res.status(403).json({ success: false, message: 'Project limit reached for your subscription' });
    }

    const projectId = uuidv4();

    await db.query(
      `INSERT INTO projects (id, tenant_id, name, description, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [projectId, tenantId, name, description || null, status, userId]
    );

    // Log audit
    await logAudit(tenantId, userId, 'CREATE_PROJECT', 'project', projectId);

    res.status(201).json({
      success: true,
      data: {
        id: projectId,
        tenantId,
        name,
        description: description || null,
        status,
        createdBy: userId,
        createdAt: new Date()
      }
    });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// API 13: List Projects
const listProjects = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { status, search, page = 1, limit = 20 } = req.query;

    let query = 'SELECT p.*, u.full_name FROM projects p LEFT JOIN users u ON p.created_by = u.id WHERE p.tenant_id = $1';
    const values = [tenantId];
    let paramCount = 2;

    if (status) {
      query += ` AND p.status = $${paramCount++}`;
      values.push(status);
    }

    if (search) {
      query += ` AND p.name ILIKE $${paramCount++}`;
      values.push(`%${search}%`);
    }

    // Get total count
    const countQuery = query.replace('SELECT p.*, u.full_name', 'SELECT COUNT(*)');
    const countResult = await db.query(countQuery, values.slice());
    const totalProjects = parseInt(countResult.rows[0].count);

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(limit, offset);

    const result = await db.query(query, values);

    const projects = await Promise.all(result.rows.map(async (p) => {
      const tasks = await db.query('SELECT COUNT(*) FROM tasks WHERE project_id = $1', [p.id]);
      const completedTasks = await db.query('SELECT COUNT(*) FROM tasks WHERE project_id = $1 AND status = $2', [p.id, 'completed']);

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        createdBy: {
          id: p.created_by,
          fullName: p.full_name
        },
        taskCount: parseInt(tasks.rows[0].count),
        completedTaskCount: parseInt(completedTasks.rows[0].count),
        createdAt: p.created_at
      };
    }));

    const totalPages = Math.ceil(totalProjects / limit);

    res.json({
      success: true,
      data: {
        projects,
        total: totalProjects,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          limit: parseInt(limit)
        }
      }
    });
  } catch (err) {
    console.error('List projects error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// API 14: Update Project
const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { name, description, status } = req.body;

    // Get project
    const projectResult = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const project = projectResult.rows[0];

    // Check authorization
    if (project.tenant_id !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const isCreator = project.created_by === userId;
    const isAdmin = userRole === 'tenant_admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date());
    values.push(projectId);

    const query = `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await db.query(query, values);

    const updated = result.rows[0];

    // Log audit
    await logAudit(tenantId, userId, 'UPDATE_PROJECT', 'project', projectId);

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        status: updated.status,
        updatedAt: updated.updated_at
      }
    });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// API 15: Delete Project
const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Get project
    const projectResult = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const project = projectResult.rows[0];

    // Check authorization
    if (project.tenant_id !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const isCreator = project.created_by === userId;
    const isAdmin = userRole === 'tenant_admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Delete project (cascade deletes tasks)
    await db.query('DELETE FROM projects WHERE id = $1', [projectId]);

    // Log audit
    await logAudit(tenantId, userId, 'DELETE_PROJECT', 'project', projectId);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  createProject,
  listProjects,
  updateProject,
  deleteProject
};
