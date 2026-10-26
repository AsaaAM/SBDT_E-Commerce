const express = require('express');
const {
  getDashboardAnalytics,
  listAdmins,
  createAdmin,
} = require('../controllers/ownerController');
const { authenticateToken } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');

const router = express.Router();

// Dilindungi: Hanya Owner yang memiliki akses penuh
router.use(authenticateToken, requireRole(['owner']));

router.get('/analytics', getDashboardAnalytics);
router.get('/admins', listAdmins);
router.post('/admins', createAdmin);

module.exports = router;
