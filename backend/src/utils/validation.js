const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: error.details.map(d => d.message).join(', ') 
      });
    }
    req.validatedBody = value;
    next();
  };
};

const validateTenantRegistration = Joi.object({
  tenantName: Joi.string().required().min(3),
  subdomain: Joi.string().required().alphanum().lowercase().min(3).max(63),
  adminEmail: Joi.string().email().required(),
  adminPassword: Joi.string().required().min(8),
  adminFullName: Joi.string().required()
});

const validateLogin = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  tenantSubdomain: Joi.string().allow(null, '')
});

const validateCreateUser = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required().min(8),
  fullName: Joi.string().required(),
  role: Joi.string().valid('user', 'tenant_admin').default('user')
});

const validateCreateProject = Joi.object({
  name: Joi.string().required().min(3),
  description: Joi.string().allow(''),
  status: Joi.string().valid('active', 'archived', 'completed').default('active')
});

const validateCreateTask = Joi.object({
  title: Joi.string().required().min(3),
  description: Joi.string().allow(''),
  assignedTo: Joi.string().uuid().allow(null),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  dueDate: Joi.date().allow(null)
});

module.exports = {
  validateRequest,
  validateTenantRegistration,
  validateLogin,
  validateCreateUser,
  validateCreateProject,
  validateCreateTask
};
