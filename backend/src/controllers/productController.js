const { queryRead } = require('../config/db');

const listProducts = async (req, res, next) => {
  try {
    const {
      q,
      category,
      min_price,
      max_price,
      warehouse_id,
      page = 1,
      limit = 12,
      sort = 'newest',
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    let paramCounter = 1;

    let whereConditions = ['p.is_active = TRUE'];

    if (q) {
      whereConditions.push(`(p.name ILIKE $${paramCounter} OR p.description ILIKE $${paramCounter} OR p.sku ILIKE $${paramCounter})`);
      params.push(`%${q}%`);
      paramCounter++;
    }

    if (category) {
      whereConditions.push(`c.slug = $${paramCounter}`);
      params.push(category);
      paramCounter++;
    }

    if (min_price) {
      whereConditions.push(`p.price >= $${paramCounter}`);
      params.push(parseFloat(min_price));
      paramCounter++;
    }

    if (max_price) {
      whereConditions.push(`p.price <= $${paramCounter}`);
      params.push(parseFloat(max_price));
      paramCounter++;
    }

    let sortClause = 'ORDER BY p.id DESC';
    if (sort === 'price_asc') sortClause = 'ORDER BY p.price ASC';
    if (sort === 'price_desc') sortClause = 'ORDER BY p.price DESC';
    if (sort === 'name_asc') sortClause = 'ORDER BY p.name ASC';

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Query Total Count untuk Pagination
    const countSql = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `;
    const countResult = await queryRead(countSql, params);
    const totalItems = parseInt(countResult.rows[0].total, 10);

    // Query Data Produk Beserta Total Stok & Breakdown Stok Gudang
    const dataSql = `
      SELECT 
        p.id, p.sku, p.name, p.slug, p.description, p.price,
        p.dimensions, p.weight_kg, p.material, p.color, p.image_url,
        c.id as category_id, c.name as category_name, c.slug as category_slug,
        COALESCE(SUM(i.qty), 0) as total_stock,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'warehouse_id', w.id,
            'warehouse_code', w.code,
            'warehouse_name', w.name,
            'city', w.city,
            'qty', COALESCE(i.qty, 0)
          ) ORDER BY w.id
        ) FILTER (WHERE w.id IS NOT NULL) as warehouse_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id ${warehouse_id ? `AND i.warehouse_id = ${parseInt(warehouse_id, 10)}` : ''}
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      ${whereClause}
      GROUP BY p.id, c.id
      ${sortClause}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    params.push(parseInt(limit, 10));
    params.push(offset);

    const result = await queryRead(dataSql, params);

    res.json({
      success: true,
      data: {
        items: result.rows,
        pagination: {
          total_items: totalItems,
          total_pages: Math.ceil(totalItems / parseInt(limit, 10)),
          current_page: parseInt(page, 10),
          limit: parseInt(limit, 10),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProductDetail = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const isId = /^\d+$/.test(idOrSlug);

    const condition = isId ? 'p.id = $1' : 'p.slug = $1';

    const sql = `
      SELECT 
        p.id, p.sku, p.name, p.slug, p.description, p.price,
        p.dimensions, p.weight_kg, p.material, p.color, p.image_url, p.created_at,
        c.id as category_id, c.name as category_name, c.slug as category_slug,
        COALESCE(SUM(i.qty), 0) as total_stock,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'warehouse_id', w.id,
            'warehouse_code', w.code,
            'warehouse_name', w.name,
            'city', w.city,
            'region', w.region,
            'qty', COALESCE(i.qty, 0)
          ) ORDER BY w.id
        ) FILTER (WHERE w.id IS NOT NULL) as warehouse_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE ${condition} AND p.is_active = TRUE
      GROUP BY p.id, c.id
    `;

    const result = await queryRead(sql, [idOrSlug]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produk furnitur tidak ditemukan.',
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

const listCategories = async (req, res, next) => {
  try {
    const sql = `
      SELECT c.id, c.name, c.slug, c.description, c.icon, c.image_url,
             COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = TRUE
      GROUP BY c.id
      ORDER BY c.id ASC
    `;
    const result = await queryRead(sql);
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

const listWarehouses = async (req, res, next) => {
  try {
    const result = await queryRead(
      'SELECT id, code, name, region, city, address, phone FROM warehouses WHERE is_active = TRUE ORDER BY id ASC'
    );
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

const listPromos = async (req, res, next) => {
  try {
    const result = await queryRead(
      'SELECT id, code, title, discount_percent, max_discount, min_purchase, start_date, end_date, is_active, created_at FROM promos ORDER BY id DESC'
    );
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listProducts,
  getProductDetail,
  listCategories,
  listWarehouses,
  listPromos,
};
