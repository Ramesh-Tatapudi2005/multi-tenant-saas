const express = require('express');
const router = express.Router();
const { createProject, listProjects, updateProject, deleteProject } = require('../controllers/projectController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest, validateCreateProject } = require('../utils/validation');

// All requests require authentication
router.use(authenticateToken);

// API 13: List projects
router.get('/', listProjects);

// API 12: Create project
router.post('/', validateRequest(validateCreateProject), createProject);

// API 14: Update project
router.put('/:projectId', updateProject);

// API 15: Delete project
router.delete('/:projectId', deleteProject);

// Include task routes under projects
router.use('/:projectId/tasks', require('./taskRoutes'));

module.exports = router;
