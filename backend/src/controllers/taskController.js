const db = require('../config/database');
const { logAudit } = require('../utils/auditLog');
const { v4: uuidv4 } = require('uuid');

// API 16: Create Task
const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    const { title, description, assignedTo, priority = 'medium', dueDate } = req.validatedBody;

    // Check project exists and belongs to tenant
    const projectResult = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const project = projectResult.rows[0];
    if (project.tenant_id !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check assigned user belongs to same tenant
    if (assignedTo) {
      const assignedUserResult = await db.query('SELECT * FROM users WHERE id = $1 AND tenant_id = $2', [assignedTo, tenantId]);
      if (assignedUserResult.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Assigned user does not belong to your tenant' });
      }
    }

    const taskId = uuidv4();

    await db.query(
      `INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [taskId, projectId, tenantId, title, description || null, 'todo', priority, assignedTo || null, dueDate || null]
    );

    // Log audit
    await logAudit(tenantId, userId, 'CREATE_TASK', 'task', taskId);

    res.status(201).json({
      success: true,
      data: {
        id: taskId,
        projectId,
        tenantId,
        title,
        description: description || null,
        status: 'todo',
        priority,
        assignedTo: assignedTo || null,
        dueDate: dueDate || null,
        createdAt: new Date()
      }
    });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// API 17: List Project Tasks
const listTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tenantId = req.user.tenantId;
    const { status, assignedTo, priority, search, page = 1, limit = 50 } = req.query;

    // Check project exists and belongs to tenant
    const projectResult = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const project = projectResult.rows[0];
    if (project.tenant_id !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    let query = 'SELECT t.*, u.full_name, u.email FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id WHERE t.project_id = $1';
    const values = [projectId];
    let paramCount = 2;

    if (status) {
      query += ` AND t.status = $${paramCount++}`;
      values.push(status);
    }

    if (assignedTo) {
      query += ` AND t.assigned_to = $${paramCount++}`;
      values.push(assignedTo);
    }

    if (priority) {
      query += ` AND t.priority = $${paramCount++}`;
      values.push(priority);
    }

    if (search) {
      query += ` AND t.title ILIKE $${paramCount++}`;
      values.push(`%${search}%`);
    }

    // Get total count
    const countQuery = query.replace('SELECT t.*, u.full_name, u.email', 'SELECT COUNT(*)');
    const countResult = await db.query(countQuery, values.slice());
    const totalTasks = parseInt(countResult.rows[0].count);

    // Add pagination and ordering
    const offset = (page - 1) * limit;
    query += ` ORDER BY t.priority DESC, t.due_date ASC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(limit, offset);

    const result = await db.query(query, values);

    const tasks = result.rows.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      assignedTo: t.assigned_to ? {
        id: t.assigned_to,
        fullName: t.full_name,
        email: t.email
      } : null,
      dueDate: t.due_date,
      createdAt: t.created_at
    }));

    const totalPages = Math.ceil(totalTasks / limit);

    res.json({
      success: true,
      data: {
        tasks,
        total: totalTasks,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          limit: parseInt(limit)
        }
      }
    });
  } catch (err) {
    console.error('List tasks error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// API 18: Update Task Status
const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    const { status } = req.body;

    // Get task
    const taskResult = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = taskResult.rows[0];

    // Check tenant access
    if (task.tenant_id !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Update status
    await db.query('UPDATE tasks SET status = $1, updated_at = $2 WHERE id = $3', [status, new Date(), taskId]);

    // Log audit
    await logAudit(tenantId, userId, 'UPDATE_TASK_STATUS', 'task', taskId);

    res.json({
      success: true,
      data: {
        id: taskId,
        status,
        updatedAt: new Date()
      }
    });
  } catch (err) {
    console.error('Update task status error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// API 19: Update Task (all fields)
const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;

    // Get task
    const taskResult = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = taskResult.rows[0];

    // Check tenant access
    if (task.tenant_id !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check assigned user if provided
    if (assignedTo) {
      const assignedUserResult = await db.query('SELECT * FROM users WHERE id = $1 AND tenant_id = $2', [assignedTo, tenantId]);
      if (assignedUserResult.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Assigned user does not belong to your tenant' });
      }
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }

    if (assignedTo !== undefined) {
      updates.push(`assigned_to = $${paramCount++}`);
      values.push(assignedTo || null);
    }

    if (dueDate !== undefined) {
      updates.push(`due_date = $${paramCount++}`);
      values.push(dueDate || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date());
    values.push(taskId);

    const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await db.query(query, values);
    const updated = result.rows[0];

    // Get assigned user details if exists
    let assignedUserDetails = null;
    if (updated.assigned_to) {
      const userResult = await db.query('SELECT id, full_name, email FROM users WHERE id = $1', [updated.assigned_to]);
      if (userResult.rows.length > 0) {
        assignedUserDetails = {
          id: userResult.rows[0].id,
          fullName: userResult.rows[0].full_name,
          email: userResult.rows[0].email
        };
      }
    }

    // Log audit
    await logAudit(tenantId, userId, 'UPDATE_TASK', 'task', taskId);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        status: updated.status,
        priority: updated.priority,
        assignedTo: assignedUserDetails,
        dueDate: updated.due_date,
        updatedAt: updated.updated_at
      }
    });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  createTask,
  listTasks,
  updateTaskStatus,
  updateTask
};
