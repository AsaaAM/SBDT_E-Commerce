const bcrypt = require('bcryptjs');
const { queryRead, queryWrite } = require('../config/db');

const getDashboardAnalytics = async (req, res, next) => {
  try {
    // 1. Ringkasan Eksekutif (KPI Cards)
    // ATURAN SBDT: Pendapatan Cair (total_revenue) HANYA dihitung jika pesanan sudah divalidasi TERKIRIM oleh Admin (Duit Cair)!
    const summarySql = `
      SELECT 
        COALESCE(SUM(CASE WHEN status IN ('terkirim', 'selesai') THEN total ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status NOT IN ('terkirim', 'selesai', 'dibatalkan') THEN total ELSE 0 END), 0) as pending_escrow,
        COUNT(id) as total_orders,
        COUNT(CASE WHEN status IN ('terkirim', 'selesai') THEN 1 END) as settled_orders_count,
        COALESCE(AVG(CASE WHEN status IN ('terkirim', 'selesai') THEN total END), 0) as average_order_value
      FROM orders
      WHERE status NOT IN ('dibatalkan')
    `;
    const summaryRes = await queryRead(summarySql);

    const stockSql = `
      SELECT 
        COALESCE(SUM(i.qty), 0) as total_physical_stock,
        COALESCE(SUM(i.qty * p.price), 0) as total_stock_valuation
      FROM inventory i
      JOIN products p ON i.product_id = p.id
    `;
    const stockRes = await queryRead(stockSql);

    // 2. Tren Penjualan Harian (Duit Cair dari Pesanan Terkirim) - Query Agregasi Lintas Shard
    const salesTrendSql = `
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        COUNT(id) as orders_count,
        COALESCE(SUM(CASE WHEN status IN ('terkirim', 'selesai') THEN total ELSE 0 END), 0) as revenue
      FROM orders
      WHERE status NOT IN ('dibatalkan')
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
    `;
    const trendRes = await queryRead(salesTrendSql);

    // 3. Performa Tiap Gudang Regional (Cross-shard comparison omset cair)
    const warehousePerfSql = `
      SELECT 
        w.id as warehouse_id,
        w.code as warehouse_code,
        w.name as warehouse_name,
        w.city,
        w.region,
        COUNT(o.id) as orders_fulfilled,
        COALESCE(SUM(CASE WHEN o.status IN ('terkirim', 'selesai') THEN o.total ELSE 0 END), 0) as revenue,
        COALESCE(AVG(CASE WHEN o.status IN ('terkirim', 'selesai') THEN o.total END), 0) as avg_order_val
      FROM warehouses w
      LEFT JOIN orders o ON w.id = o.warehouse_id AND o.status NOT IN ('dibatalkan')
      GROUP BY w.id
      ORDER BY revenue DESC
    `;
    const warehousePerfRes = await queryRead(warehousePerfSql);

    // 4. Produk Terlaris (Top Selling Furniture)
    const topProductsSql = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.price,
        p.image_url,
        c.name as category_name,
        COALESCE(SUM(oi.qty), 0) as total_sold,
        COALESCE(SUM(oi.total_price), 0) as total_revenue
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      GROUP BY p.id, c.name
      ORDER BY total_sold DESC
      LIMIT 6
    `;
    const topProductsRes = await queryRead(topProductsSql);

    // 5. Distribusi Stok per Gudang
    const stockPerWhSql = `
      SELECT 
        w.id,
        w.code,
        w.name,
        w.city,
        COALESCE(SUM(i.qty), 0) as total_qty,
        COALESCE(SUM(i.qty * p.price), 0) as total_value
      FROM warehouses w
      LEFT JOIN inventory i ON w.id = i.warehouse_id
      LEFT JOIN products p ON i.product_id = p.id
      GROUP BY w.id
      ORDER BY w.id ASC
    `;
    const stockPerWhRes = await queryRead(stockPerWhSql);

    res.json({
      success: true,
      data: {
        kpi: {
          ...summaryRes.rows[0],
          ...stockRes.rows[0],
        },
        sales_trend: trendRes.rows,
        warehouse_performance: warehousePerfRes.rows,
        top_products: topProductsRes.rows,
        warehouse_stock_distribution: stockPerWhRes.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

const listAdmins = async (req, res, next) => {
  try {
    const result = await queryRead(
      "SELECT id, name, email, role, phone, address, created_at FROM users WHERE role IN ('admin', 'owner') ORDER BY id ASC"
    );
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, phone, address } = req.body;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const seqRes = await queryWrite("SELECT nextval('users_id_seq') AS new_id");
    const newId = parseInt(seqRes.rows[0].new_id, 10);

    const result = await queryWrite(
      `INSERT INTO users (id, name, email, password_hash, role, phone, address)
       VALUES ($1, $2, $3, $4, 'admin', $5, $6)
       RETURNING id, name, email, role, phone, address, created_at`,
      [newId, name, email, passwordHash, phone || null, address || null]
    );

    res.status(201).json({
      success: true,
      message: 'Akun Administrator baru berhasil didaftarkan oleh Owner.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardAnalytics,
  listAdmins,
  createAdmin,
};
