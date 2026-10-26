const { getClient, queryRead, queryWrite } = require('../config/db');

const checkout = async (req, res, next) => {
  const client = await getClient();
  try {
    const userId = req.user.id;
    const {
      warehouse_id,
      items, // array of { product_id, qty }
      shipping_address,
      shipping_city,
      recipient_name,
      recipient_phone,
      notes,
      promo_code,
      payment_method = 'QRIS Instant',
    } = req.body;

    if (!warehouse_id) {
      return res.status(400).json({
        success: false,
        message: 'warehouse_id wajib dipilih untuk penentuan shard gudang regional.',
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Daftar item belanja tidak boleh kosong.',
      });
    }

    if (!shipping_address || !recipient_name || !recipient_phone) {
      return res.status(400).json({
        success: false,
        message: 'Alamat pengiriman, nama penerima, dan nomor telepon wajib diisi.',
      });
    }

    // Urutkan item berdasarkan product_id untuk mencegah deadlock saat locking baris bersamaan
    const sortedItems = [...items].sort((a, b) => a.product_id - b.product_id);

    // =========================================================================
    // MEMULAI TRANSAKSI TERDISTRIBUSI
    // =========================================================================
    await client.query('BEGIN');

    let subtotal = 0;
    const lockedProducts = [];

    // 1. PENGUNCIAN ROW-LEVEL (SELECT ... FOR UPDATE) PADA SHARD INVENTORY
    for (const item of sortedItems) {
      const lockSql = `
        SELECT i.qty, i.product_id, i.warehouse_id, p.name as product_name, p.price, p.sku
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        WHERE i.product_id = $1 AND i.warehouse_id = $2
        FOR UPDATE OF i
      `;

      const lockRes = await client.query(lockSql, [item.product_id, warehouse_id]);

      if (lockRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Produk ID ${item.product_id} tidak terdaftar pada Gudang ID ${warehouse_id}.`,
        });
      }

      const invRow = lockRes.rows[0];
      const availableQty = parseInt(invRow.qty, 10);
      const requestedQty = parseInt(item.qty, 10);

      // PENGECEKAN ATOMIK SISA STOK
      if (availableQty < requestedQty) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error_code: 'INSUFFICIENT_STOCK',
          message: `Stok "${invRow.product_name}" di gudang ini tidak mencukupi. Tersisa: ${availableQty}, Diminta: ${requestedQty}. Transaksi dibatalkan secara aman.`,
        });
      }

      const itemTotal = requestedQty * parseFloat(invRow.price);
      subtotal += itemTotal;

      lockedProducts.push({
        ...invRow,
        requestedQty,
        itemTotal,
        currentQty: availableQty,
        newQty: availableQty - requestedQty,
      });
    }

    // 2. HITUNG DISKON PROMO (JIKA ADA)
    let discount = 0;
    let appliedPromoCode = null;
    if (promo_code && typeof promo_code === 'string' && promo_code.trim()) {
      const cleanPromo = promo_code.trim().toUpperCase();

      // a. Cek apakah user sudah pernah memakai kode promo ini (1x/user rule)
      const usageRes = await client.query(
        'SELECT id FROM promo_usages WHERE user_id = $1 AND UPPER(promo_code) = $2',
        [userId, cleanPromo]
      );
      if (usageRes.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error_code: 'PROMO_ALREADY_USED',
          message: `Kode promo "${cleanPromo}" sudah pernah Anda gunakan sebelumnya. Setiap kode promo hanya dapat digunakan 1 kali per pengguna.`,
        });
      }

      // b. Cek validitas promo di tabel referensi promos
      const promoRes = await client.query(
        'SELECT * FROM promos WHERE UPPER(code) = $1 AND is_active = TRUE AND end_date >= CURRENT_DATE',
        [cleanPromo]
      );
      if (promoRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error_code: 'INVALID_PROMO',
          message: `Kode promo "${cleanPromo}" tidak valid atau masa berlakunya telah berakhir.`,
        });
      }

      const promo = promoRes.rows[0];
      if (subtotal < parseFloat(promo.min_purchase)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error_code: 'PROMO_MIN_PURCHASE',
          message: `Kode promo "${cleanPromo}" memerlukan minimum transaksi Rp ${Number(promo.min_purchase).toLocaleString('id-ID')}. Subtotal belanja Anda: Rp ${Number(subtotal).toLocaleString('id-ID')}.`,
        });
      }

      discount = (subtotal * promo.discount_percent) / 100;
      if (promo.max_discount && discount > parseFloat(promo.max_discount)) {
        discount = parseFloat(promo.max_discount);
      }
      appliedPromoCode = cleanPromo;
    }

    const total = Math.max(0, subtotal - discount);
    const orderNumber = `ORD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // Penentuan VA Demo & Status Awal
    const isVA = payment_method.toLowerCase().includes('virtual account') || payment_method.toLowerCase().includes('va');
    let vaNumber = null;
    if (isVA) {
      if (payment_method.toLowerCase().includes('bca')) {
        vaNumber = `8808${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      } else if (payment_method.toLowerCase().includes('mandiri')) {
        vaNumber = `89008${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      } else if (payment_method.toLowerCase().includes('bni')) {
        vaNumber = `988${Math.floor(10000000000 + Math.random() * 90000000000)}`;
      } else if (payment_method.toLowerCase().includes('bri')) {
        vaNumber = `12800${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      } else {
        vaNumber = `8808${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      }
    }

    const initialOrderStatus = isVA ? 'menunggu_pembayaran' : 'diproses';
    const initialPaymentStatus = isVA ? 'pending' : 'success';

    // 3. INSERT KE TABEL TERDISTRIBUSI: orders (shard key: warehouse_id)
    const orderSql = `
      INSERT INTO orders (
        warehouse_id, user_id, order_number, status, subtotal, discount, total,
        shipping_address, shipping_city, recipient_name, recipient_phone, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, order_number, status, total, created_at
    `;
    const orderRes = await client.query(orderSql, [
      warehouse_id,
      userId,
      orderNumber,
      initialOrderStatus,
      subtotal,
      discount,
      total,
      shipping_address,
      shipping_city || 'Kota Tujuan',
      recipient_name,
      recipient_phone,
      notes || null,
    ]);

    const createdOrder = orderRes.rows[0];
    const orderId = createdOrder.id;

    // 4. INSERT KE TABEL TERDISTRIBUSI: order_items & UPDATE INVENTORY & AUDIT LOG
    for (const prod of lockedProducts) {
      // a. Insert Order Item (colocated with orders on warehouse_id)
      await client.query(
        `INSERT INTO order_items (warehouse_id, order_id, product_id, qty, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [warehouse_id, orderId, prod.product_id, prod.requestedQty, prod.price, prod.itemTotal]
      );

      // b. Kurangi Stok Fisik di Inventory secara Atomik
      await client.query(
        `UPDATE inventory 
         SET qty = $1, updated_at = CURRENT_TIMESTAMP
         WHERE product_id = $2 AND warehouse_id = $3`,
        [prod.newQty, prod.product_id, warehouse_id]
      );

      // c. Catat Audit Mutasi Stok (colocated on warehouse_id)
      await client.query(
        `INSERT INTO stock_movements (
          warehouse_id, product_id, movement_type, reference_type, reference_id,
          change_qty, final_qty, notes, created_by
        ) VALUES ($1, $2, 'CHECKOUT', 'ORDER', $3, $4, $5, $6, $7)`,
        [
          warehouse_id,
          prod.product_id,
          orderNumber,
          -prod.requestedQty,
          prod.newQty,
          `Pengurangan stok checkout pesanan ${orderNumber}`,
          userId,
        ]
      );
    }

    // 5. INSERT KE TABEL TERDISTRIBUSI: payments (colocated on warehouse_id)
    const transactionRef = `TRX-${payment_method.replace(/\s+/g, '').toUpperCase()}-${Date.now()}`;
    await client.query(
      `INSERT INTO payments (warehouse_id, order_id, payment_method, payment_status, amount, transaction_ref, va_number, paid_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [warehouse_id, orderId, payment_method, initialPaymentStatus, total, transactionRef, vaNumber, isVA ? null : new Date()]
    );

    // 6. INSERT KE TABEL TERDISTRIBUSI: shipments (colocated on warehouse_id)
    const whCode = warehouse_id === 1 ? 'JKT' : warehouse_id === 2 ? 'SBY' : 'MDN';
    const trackingNumber = `IKEA-EXP-${whCode}-${Math.floor(10000000 + Math.random() * 90000000)}`;
    await client.query(
      `INSERT INTO shipments (warehouse_id, order_id, tracking_number, courier, status)
       VALUES ($1, $2, $3, 'JNE Trucking (JTR)', 'siap_dikirim')`,
      [warehouse_id, orderId, trackingNumber]
    );

    // 7. KOSONGKAN ITEM KERANJANG PENGGUNA YANG DIBELI
    const cartRes = await client.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
    if (cartRes.rows.length > 0) {
      const cartId = cartRes.rows[0].id;
      const productIds = sortedItems.map((it) => it.product_id);
      await client.query(
        'DELETE FROM cart_items WHERE cart_id = $1 AND product_id = ANY($2::int[])',
        [cartId, productIds]
      );
    }

    // 8. CATAT PEMAKAIAN PROMO DI TABEL REFERENSI (GARANSI 1X/USER SECARA ATOMIK)
    if (appliedPromoCode) {
      await client.query(
        `INSERT INTO promo_usages (user_id, promo_code, order_number)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, promo_code) DO NOTHING`,
        [userId, appliedPromoCode, orderNumber]
      );
    }

    // =========================================================================
    // COMMIT TRANSAKSI TERDISTRIBUSI
    // =========================================================================
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: isVA 
        ? 'Pesanan berhasil dibuat! Silakan bayar menggunakan nomor Virtual Account demo.' 
        : 'Transaksi checkout berhasil dieksekusi secara atomik!',
      data: {
        order_id: orderId,
        order_number: createdOrder.order_number,
        warehouse_id,
        subtotal,
        discount,
        total,
        status: createdOrder.status,
        payment: {
          method: payment_method,
          status: initialPaymentStatus,
          transaction_ref: transactionRef,
          va_number: vaNumber,
        },
        shipment: {
          tracking_number: trackingNumber,
          courier: 'JNE Trucking (JTR)',
          status: 'siap_dikirim',
        },
        items_count: lockedProducts.length,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

const payOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { warehouse_id } = req.body;
    const userId = req.user.id;

    if (!warehouse_id) {
      const findWh = await queryRead('SELECT warehouse_id FROM orders WHERE id = $1 LIMIT 1', [id]);
      if (findWh.rows.length > 0) {
        warehouse_id = findWh.rows[0].warehouse_id;
      } else {
        return res.status(404).json({
          success: false,
          message: 'Pesanan tidak ditemukan pada shard gudang manapun.',
        });
      }
    }

    // Update payments
    const payRes = await queryWrite(
      `UPDATE payments 
       SET payment_status = 'success', paid_at = CURRENT_TIMESTAMP 
       WHERE order_id = $1 AND warehouse_id = $2
       RETURNING *`,
      [id, warehouse_id]
    );

    // Update status pesanan ke 'diproses'
    const orderRes = await queryWrite(
      `UPDATE orders 
       SET status = 'diproses', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND warehouse_id = $2
       RETURNING *`,
      [id, warehouse_id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan pada shard gudang tersebut.',
      });
    }

    res.json({
      success: true,
      message: 'Simulasi Pembayaran VA Berhasil Dikonfirmasi! Pesanan Anda kini diteruskan ke gudang regional.',
      data: {
        order: orderRes.rows[0],
        payment: payRes.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        o.id, o.warehouse_id, o.order_number, o.status, o.subtotal, o.discount, o.total,
        o.shipping_address, o.shipping_city, o.recipient_name, o.recipient_phone, o.created_at,
        w.name as warehouse_name, w.city as warehouse_city,
        p.payment_method, p.payment_status, p.transaction_ref, p.va_number, p.paid_at,
        s.tracking_number, s.courier, s.status as shipment_status,
        COALESCE(
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'item_id', oi.id,
              'product_id', oi.product_id,
              'product_name', pr.name,
              'product_image', pr.image_url,
              'product_sku', pr.sku,
              'qty', oi.qty,
              'unit_price', oi.unit_price,
              'total_price', oi.total_price
            )
          ) FROM order_items oi
            JOIN products pr ON oi.product_id = pr.id
            WHERE oi.order_id = o.id AND oi.warehouse_id = o.warehouse_id
          ), '[]'::json
        ) as items
      FROM orders o
      JOIN warehouses w ON o.warehouse_id = w.id
      LEFT JOIN payments p ON o.id = p.order_id AND o.warehouse_id = p.warehouse_id
      LEFT JOIN shipments s ON o.id = s.order_id AND o.warehouse_id = s.warehouse_id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `;

    const result = await queryRead(sql, [userId]);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Jika bukan admin/owner/gudang, batasi hanya pesanan milik pengguna
    const isStaff = ['warehouse', 'admin', 'owner'].includes(userRole);
    const userCondition = isStaff ? '' : 'AND o.user_id = $2';
    const params = isStaff ? [id] : [id, userId];

    const sql = `
      SELECT 
        o.id, o.warehouse_id, o.user_id, o.order_number, o.status, o.subtotal, o.discount, o.total,
        o.shipping_address, o.shipping_city, o.recipient_name, o.recipient_phone, o.notes, o.created_at,
        u.name as customer_name, u.email as customer_email,
        w.name as warehouse_name, w.city as warehouse_city, w.region as warehouse_region,
        p.payment_method, p.payment_status, p.transaction_ref, p.va_number, p.paid_at,
        s.tracking_number, s.courier, s.status as shipment_status, s.dispatched_at, s.delivered_at,
        COALESCE(
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'item_id', oi.id,
              'product_id', oi.product_id,
              'product_name', pr.name,
              'product_sku', pr.sku,
              'product_image', pr.image_url,
              'qty', oi.qty,
              'unit_price', oi.unit_price,
              'total_price', oi.total_price
            )
          ) FROM order_items oi
            JOIN products pr ON oi.product_id = pr.id
            WHERE oi.order_id = o.id AND oi.warehouse_id = o.warehouse_id
          ), '[]'::json
        ) as items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN warehouses w ON o.warehouse_id = w.id
      LEFT JOIN payments p ON o.id = p.order_id AND o.warehouse_id = p.warehouse_id
      LEFT JOIN shipments s ON o.id = s.order_id AND o.warehouse_id = s.warehouse_id
      WHERE o.id = $1 ${userCondition}
    `;

    const result = await queryRead(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan atau Anda tidak memiliki akses.',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const checkPromo = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { code, subtotal } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Kode promo harus diisi.',
      });
    }

    const cleanPromo = code.trim().toUpperCase();

    // 1. Cek riwayat pemakaian user di promo_usages (garansi 1x/user)
    const usageCheck = await queryRead(
      'SELECT id, used_at FROM promo_usages WHERE user_id = $1 AND UPPER(promo_code) = $2',
      [userId, cleanPromo]
    );

    if (usageCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error_code: 'PROMO_ALREADY_USED',
        message: `Kode promo "${cleanPromo}" sudah pernah Anda gunakan sebelumnya. Setiap kode promo hanya dapat digunakan 1 kali per akun.`,
      });
    }

    // 2. Cek apakah promo ada di tabel referensi promos
    const promoRes = await queryRead(
      'SELECT * FROM promos WHERE UPPER(code) = $1',
      [cleanPromo]
    );

    if (promoRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error_code: 'PROMO_NOT_FOUND',
        message: `Kode promo "${cleanPromo}" tidak ditemukan atau tidak valid.`,
      });
    }

    const promo = promoRes.rows[0];

    if (!promo.is_active) {
      return res.status(400).json({
        success: false,
        error_code: 'PROMO_INACTIVE',
        message: `Kode promo "${cleanPromo}" saat ini sedang dinonaktifkan.`,
      });
    }

    const now = new Date();
    if (promo.start_date && new Date(promo.start_date) > now) {
      return res.status(400).json({
        success: false,
        error_code: 'PROMO_NOT_STARTED',
        message: `Kode promo "${cleanPromo}" baru dapat digunakan mulai ${new Date(promo.start_date).toLocaleDateString('id-ID')}.`,
      });
    }

    if (promo.end_date && new Date(promo.end_date) < new Date(now.setHours(0,0,0,0))) {
      return res.status(400).json({
        success: false,
        error_code: 'PROMO_EXPIRED',
        message: `Kode promo "${cleanPromo}" telah kedaluwarsa pada ${new Date(promo.end_date).toLocaleDateString('id-ID')}.`,
      });
    }

    const sub = parseFloat(subtotal || 0);
    const minPurchase = parseFloat(promo.min_purchase || 0);
    if (sub > 0 && sub < minPurchase) {
      return res.status(400).json({
        success: false,
        error_code: 'MIN_PURCHASE_NOT_MET',
        message: `Minimal belanja untuk promo ini adalah Rp ${Math.round(minPurchase).toLocaleString('id-ID')}. Belanja Anda saat ini: Rp ${Math.round(sub).toLocaleString('id-ID')}.`,
      });
    }

    let disc = (sub * promo.discount_percent) / 100;
    if (promo.max_discount && disc > parseFloat(promo.max_discount)) {
      disc = parseFloat(promo.max_discount);
    }

    return res.json({
      success: true,
      message: `Kode promo "${cleanPromo}" berhasil digunakan! Diskon ${promo.discount_percent}% diterapkan. (Maksimal 1x per akun)`,
      data: {
        ...promo,
        discountAmount: disc,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkout,
  payOrder,
  getUserOrders,
  getOrderDetail,
  checkPromo,
};

