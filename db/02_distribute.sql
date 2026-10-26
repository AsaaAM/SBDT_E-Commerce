-- ==============================================================================
-- SISTEM BASIS DATA TERDISTRIBUSI (SBDT) - MARKETPLACE FURNITUR (GAYA IKEA)
-- REGISTRASI WORKER & DISTRIBUSI TABEL CITUS
-- ==============================================================================

-- 1. DAFTARKAN WORKER NODES KE COORDINATOR
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_dist_node WHERE nodename = 'citus_worker1' AND nodeport = 5432) THEN
        PERFORM citus_add_node('citus_worker1', 5432);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_dist_node WHERE nodename = 'citus_worker2' AND nodeport = 5432) THEN
        PERFORM citus_add_node('citus_worker2', 5432);
    END IF;
END $$;

-- 2. BUAT REFERENCE TABLES (DIREPLIKASI KE SEMUA NODE: COORDINATOR & WORKER)
-- Reference tables memungkinkan query join produk, kategori, dan gudang tetap lokal di setiap worker
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_dist_partition WHERE logicalrelid = 'categories'::regclass) THEN
        PERFORM create_reference_table('categories');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_dist_partition WHERE logicalrelid = 'products'::regclass) THEN
        PERFORM create_reference_table('products');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_dist_partition WHERE logicalrelid = 'warehouses'::regclass) THEN
        PERFORM create_reference_table('warehouses');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_dist_partition WHERE logicalrelid = 'promos'::regclass) THEN
        PERFORM create_reference_table('promos');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_dist_partition WHERE logicalrelid = 'users'::regclass) THEN
        PERFORM create_reference_table('users');
    END IF;
END $$;

-- 3. BUAT DISTRIBUTED TABLES (FRAGMENTASI HORIZONTAL BERDASARKAN warehouse_id)
-- Colocation: semua tabel transaksi dan operasional terkait digabungkan dalam grup shard yang sama
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_dist_partition WHERE logicalrelid = 'inventory'::regclass) THEN
        PERFORM create_distributed_table('inventory', 'warehouse_id');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_dist_partition WHERE logicalrelid = 'orders'::regclass) THEN
        PERFORM create_distributed_table('orders', 'warehouse_id', colocate_with => 'inventory');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_dist_partition WHERE logicalrelid = 'order_items'::regclass) THEN
        PERFORM create_distributed_table('order_items', 'warehouse_id', colocate_with => 'orders');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_dist_partition WHERE logicalrelid = 'payments'::regclass) THEN
        PERFORM create_distributed_table('payments', 'warehouse_id', colocate_with => 'orders');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_dist_partition WHERE logicalrelid = 'shipments'::regclass) THEN
        PERFORM create_distributed_table('shipments', 'warehouse_id', colocate_with => 'orders');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_dist_partition WHERE logicalrelid = 'stock_movements'::regclass) THEN
        PERFORM create_distributed_table('stock_movements', 'warehouse_id', colocate_with => 'orders');
    END IF;
END $$;
