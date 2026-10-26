const { queryRead, queryWrite } = require('../config/db');

// Helper untuk memastikan cart pengguna ada
const getOrCreateCartId = async (userId) => {
  let cartResult = await queryWrite(
    'SELECT id FROM carts WHERE user_id = $1',
    [userId]
  );

  if (cartResult.rows.length === 0) {
    cartResult = await queryWrite(
      'INSERT INTO carts (user_id) VALUES ($1) RETURNING id',
      [userId]
    );
  }

  return cartResult.rows[0].id;
};

const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cartId = await getOrCreateCartId(userId);

    const itemsSql = `
      SELECT 
        ci.id as item_id,
        ci.product_id,
        ci.qty,
        p.sku,
        p.name,
        p.slug,
        p.price,
        p.image_url,
        p.weight_kg,
        (ci.qty * p.price) as subtotal
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = $1
      ORDER BY ci.id ASC
    `;

    const itemsResult = await queryRead(itemsSql, [cartId]);
    const items = itemsResult.rows;

    if (items.length > 0) {
      const productIds = items.map((it) => it.product_id);
      const stockSql = `
        SELECT 
          inv.product_id,
          inv.warehouse_id,
          w.name as warehouse_name,
          w.city,
          inv.qty
        FROM inventory inv
        JOIN warehouses w ON inv.warehouse_id = w.id
        WHERE inv.product_id = ANY($1::int[])
        ORDER BY inv.warehouse_id ASC
      `;
      const stockRes = await queryRead(stockSql, [productIds]);
      const stockMap = {};
      for (const s of stockRes.rows) {
        if (!stockMap[s.product_id]) stockMap[s.product_id] = [];
        stockMap[s.product_id].push({
          warehouse_id: s.warehouse_id,
          warehouse_name: s.warehouse_name,
          city: s.city,
          qty: parseInt(s.qty, 10),
        });
      }

      for (const item of items) {
        item.warehouse_stock = stockMap[item.product_id] || [];
      }
    }

    const totalQty = items.reduce((sum, item) => sum + parseInt(item.qty, 10), 0);
    const totalPrice = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    res.json({
      success: true,
      data: {
        cart_id: cartId,
        items,
        total_items: items.length,
        total_qty: totalQty,
        total_price: totalPrice,
      },
    });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { product_id, qty = 1 } = req.body;

    if (!product_id || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'product_id dan qty (> 0) wajib disertakan.',
      });
    }

    const cartId = await getOrCreateCartId(userId);

    // Upsert ke cart_items
    const sql = `
      INSERT INTO cart_items (cart_id, product_id, qty)
      VALUES ($1, $2, $3)
      ON CONFLICT (cart_id, product_id)
      DO UPDATE SET qty = cart_items.qty + EXCLUDED.qty
      RETURNING id, cart_id, product_id, qty
    `;

    const result = await queryWrite(sql, [cartId, product_id, qty]);

    res.json({
      success: true,
      message: 'Produk berhasil ditambahkan ke keranjang.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { qty } = req.body;

    if (qty <= 0) {
      return removeCartItem(req, res, next);
    }

    const cartId = await getOrCreateCartId(userId);

    const result = await queryWrite(
      'UPDATE cart_items SET qty = $1 WHERE id = $2 AND cart_id = $3 RETURNING *',
      [qty, itemId, cartId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item keranjang tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      message: 'Jumlah item berhasil diperbarui.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const cartId = await getOrCreateCartId(userId);

    await queryWrite(
      'DELETE FROM cart_items WHERE id = $1 AND cart_id = $2',
      [itemId, cartId]
    );

    res.json({
      success: true,
      message: 'Item berhasil dihapus dari keranjang.',
    });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cartId = await getOrCreateCartId(userId);

    await queryWrite('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    res.json({
      success: true,
      message: 'Keranjang belanja berhasil dikosongkan.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
