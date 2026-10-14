/**
 * Role-based authorization middleware.
 * Ensures the authenticated user has one of the required roles.
 *
 * @param  {...string} allowedRoles - e.g. 'admin', 'student'
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: This resource requires one of the following roles: [${allowedRoles.join(', ')}]. Your role is "${req.user.role}".`
      });
    }

    next();
  };
}

module.exports = {
  requireRole
};
