const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }

    next();
  };
};

const authorizeTenant = (req, res, next) => {
  // Super admin can access any tenant
  if (req.user.role === 'super_admin') {
    next();
    return;
  }

  // Regular users must belong to the tenant
  const requestedTenantId = req.params.tenantId || req.body.tenantId;
  
  if (requestedTenantId && req.user.tenantId !== requestedTenantId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  next();
};

module.exports = {
  authenticateToken,
  authorizeRole,
  authorizeTenant
};
