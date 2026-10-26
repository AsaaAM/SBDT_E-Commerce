const bcrypt = require('bcryptjs');
const { queryRead, queryWrite } = require('../config/db');

// --- PRODUK CRUD ---
const createProduct = async (req, res, next) => {
  try {
    const {
      category_id,
      sku,
      name,
      slug,
      description,
      price,
      dimensions,
      weight_kg,
      material,
      color,
      image_url,
      initial_stock = [], // array of { warehouse_id, qty }
    } = req.body;

    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const insertSql = `
      INSERT INTO products (
        category_id, sku, name, slug, description, price,
        dimensions, weight_kg, material, color, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await queryWrite(insertSql, [
      category_id || null,
      sku,
      name,
      generatedSlug,
      description || null,
      price,
      dimensions || null,
      weight_kg || null,
      material || null,
      color || null,
      image_url || null,
    ]);

    const createdProduct = result.rows[0];

    // Inisialisasi stok awal di gudang jika disediakan
    if (initial_stock && Array.isArray(initial_stock)) {
      for (const st of initial_stock) {
        if (st.warehouse_id && st.qty) {
          await queryWrite(
            `INSERT INTO inventory (product_id, warehouse_id, qty)
             VALUES ($1, $2, $3)
             ON CONFLICT (product_id, warehouse_id) DO UPDATE SET qty = EXCLUDED.qty`,
            [createdProduct.id, st.warehouse_id, st.qty]
          );
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Produk furnitur berhasil ditambahkan.',
      data: createdProduct,
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      category_id,
      sku,
      name,
      description,
      price,
      dimensions,
      weight_kg,
      material,
      color,
      image_url,
      is_active,
    } = req.body;

    const sql = `
      UPDATE products SET
        category_id = COALESCE($1, category_id),
        sku = COALESCE($2, sku),
        name = COALESCE($3, name),
        description = COALESCE($4, description),
        price = COALESCE($5, price),
        dimensions = COALESCE($6, dimensions),
        weight_kg = COALESCE($7, weight_kg),
        material = COALESCE($8, material),
        color = COALESCE($9, color),
        image_url = COALESCE($10, image_url),
        is_active = COALESCE($11, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `;

    const result = await queryWrite(sql, [
      category_id,
      sku,
      name,
      description,
      price,
      dimensions,
      weight_kg,
      material,
      color,
      image_url,
      is_active,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      message: 'Data produk berhasil diperbarui.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Soft delete agar riwayat transaksi masa lalu tetap konsisten
    const result = await queryWrite(
      'UPDATE products SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, name, is_active',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      message: 'Produk dinonaktifkan (soft-delete).',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// --- KATEGORI CRUD ---
const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, icon, image_url } = req.body;
    const catSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const seqRes = await queryWrite("SELECT COALESCE((SELECT MAX(id) FROM categories), 0) + 1 AS new_id");
    const newId = parseInt(seqRes.rows[0].new_id, 10);

    const result = await queryWrite(
      'INSERT INTO categories (id, name, slug, description, icon, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [newId, name, catSlug, description || null, icon || null, image_url || null]
    );

    res.status(201).json({
      success: true,
      message: 'Kategori baru berhasil ditambahkan.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, description, icon, image_url } = req.body;

    const curRes = await queryRead('SELECT * FROM categories WHERE id = $1', [id]);
    if (curRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan.' });
    }
    const cur = curRes.rows[0];

    const updatedName = name !== undefined ? name : cur.name;
    const updatedSlug = slug !== undefined ? slug : cur.slug;
    const updatedDesc = description !== undefined ? description : cur.description;
    const updatedIcon = icon !== undefined ? icon : cur.icon;
    const updatedImg = image_url !== undefined ? image_url : cur.image_url;

    const result = await queryWrite(
      `UPDATE categories SET 
        name = $1,
        slug = $2,
        description = $3,
        icon = $4,
        image_url = $5
       WHERE id = $6 RETURNING *`,
      [updatedName, updatedSlug, updatedDesc, updatedIcon, updatedImg, id]
    );

    res.json({
      success: true,
      message: 'Kategori berhasil diperbarui.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await queryWrite('DELETE FROM categories WHERE id = $1', [id]);
    res.json({
      success: true,
      message: 'Kategori berhasil dihapus.',
    });
  } catch (error) {
    next(error);
  }
};

// --- PROMO CRUD ---
const createPromo = async (req, res, next) => {
  try {
    const { code, title, discount_percent, max_discount, min_purchase, start_date, end_date } = req.body;

    if (!code || !discount_percent) {
      return res.status(400).json({
        success: false,
        message: 'Kode promo dan persentase diskon wajib diisi.',
      });
    }

    const seqRes = await queryWrite("SELECT COALESCE((SELECT MAX(id) FROM promos), 0) + 1 AS new_id");
    const newId = parseInt(seqRes.rows[0].new_id, 10);

    const startDateVal = start_date || new Date().toISOString().split('T')[0];
    const endDateVal = end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = await queryWrite(
      `INSERT INTO promos (id, code, title, discount_percent, max_discount, min_purchase, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        newId,
        code.trim().toUpperCase(),
        title || `Diskon ${discount_percent}%`,
        parseFloat(discount_percent),
        max_discount ? parseFloat(max_discount) : null,
        min_purchase ? parseFloat(min_purchase) : 0,
        startDateVal,
        endDateVal,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Kode promo berhasil dibuat.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const updatePromo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, title, discount_percent, max_discount, min_purchase, is_active, start_date, end_date } = req.body;

    const currentPromo = await queryRead('SELECT * FROM promos WHERE id = $1', [id]);
    if (currentPromo.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Promo tidak ditemukan.' });
    }
    const cur = currentPromo.rows[0];

    const updatedCode = code !== undefined ? code.trim().toUpperCase() : cur.code;
    const updatedTitle = title !== undefined ? title : cur.title;
    const updatedDisc = discount_percent !== undefined ? parseFloat(discount_percent) : cur.discount_percent;
    const updatedMaxDisc = max_discount !== undefined ? (max_discount ? parseFloat(max_discount) : null) : cur.max_discount;
    const updatedMinPurch = min_purchase !== undefined ? (min_purchase ? parseFloat(min_purchase) : 0) : cur.min_purchase;
    const updatedIsActive = is_active !== undefined ? is_active : cur.is_active;
    const updatedStart = start_date !== undefined ? start_date : cur.start_date;
    const updatedEnd = end_date !== undefined ? end_date : cur.end_date;

    const result = await queryWrite(
      `UPDATE promos SET
        code = $1,
        title = $2,
        discount_percent = $3,
        max_discount = $4,
        min_purchase = $5,
        is_active = $6,
        start_date = $7,
        end_date = $8
       WHERE id = $9 RETURNING *`,
      [
        updatedCode,
        updatedTitle,
        updatedDisc,
        updatedMaxDisc,
        updatedMinPurch,
        updatedIsActive,
        updatedStart,
        updatedEnd,
        id,
      ]
    );

    res.json({
      success: true,
      message: 'Promo berhasil diperbarui.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const deletePromo = async (req, res, next) => {
  try {
    const { id } = req.params;
    await queryWrite('DELETE FROM promos WHERE id = $1', [id]);
    res.json({
      success: true,
      message: 'Kode promo berhasil dihapus.',
    });
  } catch (error) {
    next(error);
  }
};

// --- MANAJEMEN AKUN ---
const listUsers = async (req, res, next) => {
  try {
    const { role, q } = req.query;
    const whereConditions = [];
    const params = [];
    let counter = 1;

    if (role) {
      whereConditions.push(`role = $${counter}`);
      params.push(role);
      counter++;
    }

    if (q) {
      whereConditions.push(`(name ILIKE $${counter} OR email ILIKE $${counter})`);
      params.push(`%${q}%`);
      counter++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT id, name, email, role, phone, address, created_at
      FROM users
      ${whereClause}
      ORDER BY id ASC
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

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role = 'user', phone, address } = req.body;

    if (!['user', 'warehouse', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role yang diizinkan untuk dibuat oleh admin: user, warehouse, admin.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const seqRes = await queryWrite("SELECT nextval('users_id_seq') AS new_id");
    const newId = parseInt(seqRes.rows[0].new_id, 10);

    const result = await queryWrite(
      `INSERT INTO users (id, name, email, password_hash, role, phone, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, role, phone, address, created_at`,
      [newId, name, email, passwordHash, role, phone || null, address || null]
    );

    res.status(201).json({
      success: true,
      message: `Akun dengan role "${role}" berhasil dibuat.`,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'warehouse', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role tidak valid.',
      });
    }

    const result = await queryWrite(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, id]
    );

    res.json({
      success: true,
      message: 'Role pengguna berhasil diubah.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const { warehouse_id, status, limit = 50 } = req.query;

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

    params.push(parseInt(limit, 10));

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        o.id, o.warehouse_id, o.order_number, o.status, o.total, o.created_at,
        u.name as customer_name, u.email as customer_email,
        w.name as warehouse_name, w.city as warehouse_city,
        p.payment_method, p.payment_status,
        s.tracking_number, s.status as shipment_status
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN warehouses w ON o.warehouse_id = w.id
      LEFT JOIN payments p ON o.id = p.order_id AND o.warehouse_id = p.warehouse_id
      LEFT JOIN shipments s ON o.id = s.order_id AND o.warehouse_id = s.warehouse_id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${counter}
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

const path = require('path');
const fs = require('fs');

const uploadAsset = async (req, res, next) => {
  try {
    const { fileName, base64Data } = req.body;
    if (!base64Data) {
      return res.status(400).json({
        success: false,
        message: 'base64Data gambar wajib disertakan.',
      });
    }

    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    let ext = 'jpg';

    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';
      else if (mime.includes('svg')) ext = 'svg';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(base64Data, 'base64');
    }

    const cleanName = (fileName || 'asset')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 30);
    const uniqueFileName = `${Date.now()}-${cleanName}.${ext}`;
    const uploadDir = path.join(__dirname, '../../public/uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, uniqueFileName);
    fs.writeFileSync(filePath, buffer);

    const assetUrl = `/uploads/${uniqueFileName}`;

    res.json({
      success: true,
      message: 'Asset gambar berhasil disimpan ke folder lokal server.',
      data: {
        url: assetUrl,
        filename: uniqueFileName,
      },
    });
  } catch (error) {
    next(error);
  }
};

const validateOrderDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { warehouse_id } = req.body || {};

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

    // Update status pesanan ke 'terkirim'
    const orderRes = await queryWrite(
      `UPDATE orders 
       SET status = 'terkirim', updated_at = CURRENT_TIMESTAMP 
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

    // Update status pengiriman ke 'terkirim' dan catat timestamp delivered_at
    const shipRes = await queryWrite(
      `UPDATE shipments 
       SET status = 'terkirim', delivered_at = CURRENT_TIMESTAMP 
       WHERE order_id = $1 AND warehouse_id = $2 
       RETURNING *`,
      [id, warehouse_id]
    );

    res.json({
      success: true,
      message: 'Resi pesanan divalidasi berhasil! Status pesanan kini TERKIRIM dan dana telah dicairkan (Duit Cair) ke grafik omset Owner.',
      data: {
        order: orderRes.rows[0],
        shipment: shipRes.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
