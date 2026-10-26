/**
 * Role-Based Access Control (RBAC) Middleware
 * @param {Array<string>} allowedRoles - Daftar role yang diizinkan ('user', 'warehouse', 'admin', 'owner')
 */
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Otorisasi gagal. Pengguna belum login.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Endpoint ini hanya untuk role: [${allowedRoles.join(', ')}]. Role Anda saat ini: ${req.user.role}`,
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
};
