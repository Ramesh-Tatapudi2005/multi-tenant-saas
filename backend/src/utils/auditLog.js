const db = require('../config/database');

const logAudit = async (tenantId, userId, action, entityType, entityId, ipAddress = null) => {
  try {
    await db.query(
      'INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [tenantId, userId, action, entityType, entityId, ipAddress]
    );
  } catch (err) {
    console.error('Error logging audit:', err);
  }
};

module.exports = {
  logAudit
};
