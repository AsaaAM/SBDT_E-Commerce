-- ==============================================================================
-- SISTEM BASIS DATA TERDISTRIBUSI (SBDT) - MARKETPLACE FURNITUR (GAYA IKEA)
-- SKEMA BASIS DATA UTAMA (DDL)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS citus;

-- 1. TABEL PENGGUNA (users)
-- Dijadikan reference table agar relasi ke tabel terdistribusi (orders) tetap valid
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('user', 'warehouse', 'admin', 'owner')),
    phone VARCHAR(30),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABEL KATEGORI (categories) - Reference Table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL PRODUK (products) - Reference Table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    dimensions VARCHAR(100),
    weight_kg NUMERIC(6, 2),
    material VARCHAR(100),
    color VARCHAR(50),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABEL GUDANG REGIONAL (warehouses) - Reference Table
CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABEL PROMO (promos) - Reference Table
CREATE TABLE IF NOT EXISTS promos (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    discount_percent INT NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
    max_discount NUMERIC(12, 2),
    min_purchase NUMERIC(12, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABEL INVENTARIS/STOK (inventory) - Distributed Table (shard key: warehouse_id)
CREATE TABLE IF NOT EXISTS inventory (
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id INT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    qty INT NOT NULL DEFAULT 0 CHECK (qty >= 0),
    safety_stock INT NOT NULL DEFAULT 5,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, warehouse_id)
);

-- 7. TABEL KERANJANG BELANJA (carts & cart_items) - Coordinator Table
CREATE TABLE IF NOT EXISTS carts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    qty INT NOT NULL DEFAULT 1 CHECK (qty > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (cart_id, product_id)
);

-- 8. TABEL PESANAN (orders) - Distributed Table (shard key: warehouse_id)
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL,
    warehouse_id INT NOT NULL REFERENCES warehouses(id),
    user_id INT NOT NULL REFERENCES users(id),
    order_number VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'menunggu_pembayaran' 
        CHECK (status IN ('menunggu_pembayaran', 'dibayar', 'diproses', 'dikemas', 'dikirim', 'terkirim', 'selesai', 'dibatalkan')),
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100),
    recipient_name VARCHAR(150) NOT NULL,
    recipient_phone VARCHAR(30) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, warehouse_id)
);

-- 9. TABEL ITEM PESANAN (order_items) - Distributed Table (shard key: warehouse_id, colocate with orders)
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL,
    warehouse_id INT NOT NULL,
    order_id BIGINT NOT NULL,
    product_id INT NOT NULL REFERENCES products(id),
    qty INT NOT NULL CHECK (qty > 0),
    unit_price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, warehouse_id),
    FOREIGN KEY (order_id, warehouse_id) REFERENCES orders(id, warehouse_id) ON DELETE CASCADE
);

-- 10. TABEL PEMBAYARAN (payments) - Distributed Table (shard key: warehouse_id, colocate with orders)
CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL,
    warehouse_id INT NOT NULL,
    order_id BIGINT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'success', 'failed')),
    amount NUMERIC(12, 2) NOT NULL,
    transaction_ref VARCHAR(100),
    va_number VARCHAR(50),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, warehouse_id),
    FOREIGN KEY (order_id, warehouse_id) REFERENCES orders(id, warehouse_id) ON DELETE CASCADE
);

-- 11. TABEL PENGIRIMAN (shipments) - Distributed Table (shard key: warehouse_id, colocate with orders)
CREATE TABLE IF NOT EXISTS shipments (
    id BIGSERIAL,
    warehouse_id INT NOT NULL,
    order_id BIGINT NOT NULL,
    tracking_number VARCHAR(100) NOT NULL,
    courier VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'siap_dikirim'
        CHECK (status IN ('siap_dikirim', 'dalam_perjalanan', 'terkirim', 'gagal')),
    dispatched_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, warehouse_id),
    FOREIGN KEY (order_id, warehouse_id) REFERENCES orders(id, warehouse_id) ON DELETE CASCADE
);

-- 12. TABEL MUTASI STOK / AUDIT (stock_movements) - Distributed Table (shard key: warehouse_id, colocate with orders)
CREATE TABLE IF NOT EXISTS stock_movements (
    id BIGSERIAL,
    warehouse_id INT NOT NULL REFERENCES warehouses(id),
    product_id INT NOT NULL REFERENCES products(id),
    movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT', 'CHECKOUT', 'CANCEL')),
    reference_type VARCHAR(50),
    reference_id VARCHAR(50),
    change_qty INT NOT NULL,
    final_qty INT NOT NULL,
    notes TEXT,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, warehouse_id)
);

-- Indeks Tambahan untuk Optimalisasi Query
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_prod ON stock_movements(product_id, warehouse_id);
