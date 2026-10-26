const { queryRead, queryWrite, getClient } = require('../config/db');

const getWarehouseStock = async (req, res, next) => {
  try {
    const { warehouse_id } = req.query;

    const whereClause = warehouse_id ? 'WHERE i.warehouse_id = $1' : '';
    const params = warehouse_id ? [parseInt(warehouse_id, 10)] : [];

    const sql = `
      SELECT 
        i.product_id,
        i.warehouse_id,
        i.qty,
        i.safety_stock,
        i.updated_at,
        p.sku,
        p.name as product_name,
        p.price,
        p.image_url,
        c.name as category_name,
        w.name as warehouse_name,
        w.code as warehouse_code,
        w.city as warehouse_city
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN warehouses w ON i.warehouse_id = w.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY w.id ASC, i.qty ASC
    `;

    const result = await queryRead(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

const mutateStock = async (req, res, next) => {
  const client = await getClient();
  try {
    const staffId = req.user.id;
    const { warehouse_id, product_id, type, qty, notes } = req.body;

    if (!warehouse_id || !product_id || !type || !qty || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'warehouse_id, product_id, type (IN/OUT/ADJUSTMENT), dan qty (> 0) wajib diisi.',
      });
    }

    if (!['IN', 'OUT', 'ADJUSTMENT'].includes(type.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Tipe mutasi tidak valid. Harus IN, OUT, atau ADJUSTMENT.',
      });
    }

    await client.query('BEGIN');

    // Kunci baris inventory untuk mutasi aman
    const invSql = `
      SELECT qty FROM inventory
      WHERE product_id = $1 AND warehouse_id = $2
      FOR UPDATE
    `;
    const invRes = await client.query(invSql, [product_id, warehouse_id]);

    let currentQty = 0;
    if (invRes.rows.length === 0) {
      // Inisialisasi baris jika belum ada
      await client.query(
        'INSERT INTO inventory (product_id, warehouse_id, qty) VALUES ($1, $2, 0)',
        [product_id, warehouse_id]
      );
      currentQty = 0;
    } else {
      currentQty = parseInt(invRes.rows[0].qty, 10);
    }

    const mutationQty = parseInt(qty, 10);
    let finalQty = currentQty;
    let changeQty = 0;

    if (type.toUpperCase() === 'IN') {
      finalQty = currentQty + mutationQty;
      changeQty = mutationQty;
    } else if (type.toUpperCase() === 'OUT') {
      if (currentQty < mutationQty) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Stok tidak mencukupi untuk pengeluaran barang. Sisa stok: ${currentQty}, diminta: ${mutationQty}.`,
        });
      }
      finalQty = currentQty - mutationQty;
      changeQty = -mutationQty;
    } else if (type.toUpperCase() === 'ADJUSTMENT') {
      changeQty = mutationQty - currentQty;
      finalQty = mutationQty;
    }

    // Update stok di inventory
    await client.query(
      'UPDATE inventory SET qty = $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2 AND warehouse_id = $3',
      [finalQty, product_id, warehouse_id]
    );

    // Catat ke log mutasi terdistribusi
    const movementSql = `
      INSERT INTO stock_movements (
        warehouse_id, product_id, movement_type, reference_type, reference_id,
        change_qty, final_qty, notes, created_by
      ) VALUES ($1, $2, $3, 'MANUAL_MUTATION', $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const moveRes = await client.query(movementSql, [
      warehouse_id,
      product_id,
      type.toUpperCase(),
      `MUT-${Date.now()}`,
      changeQty,
      finalQty,
      notes || 'Mutasi stok manual oleh staf gudang',
      staffId,
    ]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Mutasi stok berhasil dicatat ke basis data terdistribusi.',
      data: {
        product_id,
        warehouse_id,
        previous_qty: currentQty,
        final_qty: finalQty,
        movement: moveRes.rows[0],
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

const getWarehouseOrders = async (req, res, next) => {
  try {
    const { warehouse_id, status } = req.query;

    const whereConditions = [];
    const params = [];
    let counter = 1;

    if (warehouse_id) {
      whereConditions.push(`o.warehouse_id = $${counter}`);
      params.push(parseInt(warehouse_id, 10));
      counter++;
    }

    if (status) {
      whereConditions.push(`o.status = $${counter}`);
      params.push(status);
      counter++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        o.id, o.warehouse_id, o.order_number, o.status, o.total,
        o.recipient_name, o.recipient_phone, o.shipping_address, o.shipping_city, o.created_at,
        w.name as warehouse_name,
        s.tracking_number, s.courier, s.status as shipment_status,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id AND oi.warehouse_id = o.warehouse_id) as total_items
      FROM orders o
      JOIN warehouses w ON o.warehouse_id = w.id
      LEFT JOIN shipments s ON o.id = s.order_id AND o.warehouse_id = s.warehouse_id
      ${whereClause}
      ORDER BY o.created_at DESC
    `;

    const result = await queryRead(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, warehouse_id } = req.body;

    const validStatuses = ['diproses', 'dikemas', 'dikirim', 'selesai', 'dibatalkan'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status tidak valid. Pilihan: ${validStatuses.join(', ')}`,
      });
    }

    if (!warehouse_id) {
      return res.status(400).json({
        success: false,
        message: 'warehouse_id wajib disertakan untuk query shard yang tepat.',
      });
    }

    // Update status pesanan
    const orderRes = await queryWrite(
      `UPDATE orders 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND warehouse_id = $3
       RETURNING *`,
      [status, orderId, warehouse_id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan pada shard gudang tersebut.',
      });
    }

    // Sinkronkan status pengiriman
    if (status === 'dikirim') {
      await queryWrite(
        `UPDATE shipments
         SET status = 'dalam_perjalanan', dispatched_at = CURRENT_TIMESTAMP
         WHERE order_id = $1 AND warehouse_id = $2`,
        [orderId, warehouse_id]
      );
    } else if (status === 'selesai') {
      await queryWrite(
        `UPDATE shipments
         SET status = 'terkirim', delivered_at = CURRENT_TIMESTAMP
         WHERE order_id = $1 AND warehouse_id = $2`,
        [orderId, warehouse_id]
      );
    }

    res.json({
      success: true,
      message: `Status pesanan berhasil diubah menjadi "${status}".`,
      data: orderRes.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const getStockMovements = async (req, res, next) => {
  try {
    const { warehouse_id, limit = 50 } = req.query;

    const whereClause = warehouse_id ? 'WHERE sm.warehouse_id = $1' : '';
    const params = warehouse_id ? [parseInt(warehouse_id, 10), parseInt(limit, 10)] : [parseInt(limit, 10)];

    const sql = `
      SELECT 
        sm.id, sm.warehouse_id, sm.product_id, sm.movement_type,
        sm.reference_type, sm.reference_id, sm.change_qty, sm.final_qty,
        sm.notes, sm.created_at,
        p.name as product_name, p.sku as product_sku,
        w.name as warehouse_name,
        u.name as staff_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      JOIN warehouses w ON sm.warehouse_id = w.id
      LEFT JOIN users u ON sm.created_by = u.id
      ${whereClause}
      ORDER BY sm.created_at DESC
      LIMIT $${params.length}
    `;

    const result = await queryRead(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

const inputStock = async (req, res, next) => {
  const client = await getClient();
  try {
    const staffId = req.user.id;
    const { warehouse_id, product_id, qty, notes } = req.body;

    if (!warehouse_id || !product_id || !qty || parseInt(qty, 10) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'warehouse_id (1=Tangerang, 2=Sidoarjo, 3=Medan), product_id, dan qty (> 0) wajib diisi.',
      });
    }

    const whId = parseInt(warehouse_id, 10);
    const prodId = parseInt(product_id, 10);
    const addedQty = parseInt(qty, 10);

    await client.query('BEGIN');

    // Cek atau kunci inventory pada shard gudang tersebut
    const invRes = await client.query(
      'SELECT qty FROM inventory WHERE product_id = $1 AND warehouse_id = $2 FOR UPDATE',
      [prodId, whId]
    );

    let finalQty = addedQty;
    if (invRes.rows.length === 0) {
      await client.query(
        'INSERT INTO inventory (product_id, warehouse_id, qty) VALUES ($1, $2, $3)',
        [prodId, whId, finalQty]
      );
    } else {
      const currentQty = parseInt(invRes.rows[0].qty, 10);
      finalQty = currentQty + addedQty;
      await client.query(
        'UPDATE inventory SET qty = $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2 AND warehouse_id = $3',
        [finalQty, prodId, whId]
      );
    }

    // Catat mutasi stok
    await client.query(
      `INSERT INTO stock_movements (
        warehouse_id, product_id, movement_type, reference_type, reference_id,
        change_qty, final_qty, notes, created_by
      ) VALUES ($1, $2, 'IN', 'WAREHOUSE_INPUT', $3, $4, $5, $6, $7)`,
      [
        whId,
        prodId,
        `INPUT-${Date.now()}`,
        addedQty,
        finalQty,
        notes || `Penerimaan stok barang masuk ke Gudang ID ${whId}`,
        staffId,
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Berhasil mencatat stok masuk ${addedQty} unit ke Gudang ID ${whId}.`,
      data: {
        warehouse_id: whId,
        product_id: prodId,
        added_qty: addedQty,
        final_qty: finalQty,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

module.exports = {
  getWarehouseStock,
  mutateStock,
  inputStock,
  getWarehouseOrders,
  updateOrderStatus,
  getStockMovements,
};
