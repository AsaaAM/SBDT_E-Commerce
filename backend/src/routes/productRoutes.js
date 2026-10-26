const express = require('express');
const {
  listProducts,
  getProductDetail,
  listCategories,
  listWarehouses,
  listPromos,
} = require('../controllers/productController');

const router = express.Router();

router.get('/', listProducts);
router.get('/categories', listCategories);
router.get('/warehouses', listWarehouses);
router.get('/promos', listPromos);
router.get('/:idOrSlug', getProductDetail);

module.exports = router;
