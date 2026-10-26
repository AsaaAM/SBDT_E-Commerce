const express = require('express');
const { checkout, payOrder, getUserOrders, getOrderDetail, checkPromo } = require('../controllers/orderController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateToken);

// Cek validitas promo dan garansi 1x/user
router.post('/check-promo', checkPromo);

// Checkout transaksi terdistribusi (bisa dipanggil oleh user)
router.post('/checkout', checkout);
router.post('/:id/pay', payOrder);
router.get('/', getUserOrders);
router.get('/:id', getOrderDetail);

module.exports = router;

