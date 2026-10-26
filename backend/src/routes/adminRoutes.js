const express = require('express');
const {
  createProduct,
  updateProduct,
  deleteProduct,
  createCategory,
  updateCategory,
  deleteCategory,
  createPromo,
  updatePromo,
  deletePromo,
  listUsers,
  createUser,
  updateUserRole,
  getAllOrders,
  uploadAsset,
  validateOrderDelivery,
} = require('../controllers/adminController');
const { authenticateToken } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');

const router = express.Router();

// Dilindungi: Hanya Admin dan Owner yang memiliki akses
router.use(authenticateToken, requireRole(['admin', 'owner']));

// Asset Upload (Gambar Lokal)
router.post('/upload', uploadAsset);

// Produk CRUD
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Kategori CRUD
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Promo CRUD
router.post('/promos', createPromo);
router.put('/promos/:id', updatePromo);
router.delete('/promos/:id', deletePromo);

// Manajemen Pengguna
router.get('/users', listUsers);
router.post('/users', createUser);
router.patch('/users/:id/role', updateUserRole);

// Monitoring & Validasi Pesanan
router.get('/orders', getAllOrders);
router.post('/orders/:id/validate-delivery', validateOrderDelivery);

module.exports = router;
