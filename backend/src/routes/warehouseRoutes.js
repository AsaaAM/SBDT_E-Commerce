const express = require('express');
const {
  getWarehouseStock,
  mutateStock,
  inputStock,
  getWarehouseOrders,
  updateOrderStatus,
  getStockMovements,
} = require('../controllers/warehouseController');
const { authenticateToken } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');

const router = express.Router();

// Dilindungi: Hanya orang gudang, admin, dan owner yang memiliki akses
router.use(authenticateToken, requireRole(['warehouse', 'admin', 'owner']));

router.get('/stock', getWarehouseStock);
router.post('/stock-mutation', mutateStock);
router.post('/input-stock', inputStock);
router.get('/orders', getWarehouseOrders);
router.patch('/orders/:orderId/status', updateOrderStatus);
router.get('/movements', getStockMovements);

module.exports = router;
