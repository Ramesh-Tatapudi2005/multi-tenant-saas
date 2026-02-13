const express = require('express');
const router = express.Router({ mergeParams: true });
const { createTask, listTasks, updateTaskStatus, updateTask } = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest, validateCreateTask } = require('../utils/validation');

// All requests require authentication
router.use(authenticateToken);

// API 17: List tasks for a project
router.get('/', listTasks);

// API 16: Create task
router.post('/', validateRequest(validateCreateTask), createTask);

// API 18: Update task status (PATCH)
router.patch('/:taskId/status', updateTaskStatus);

// API 19: Update task (PUT)
router.put('/:taskId', updateTask);

module.exports = router;
