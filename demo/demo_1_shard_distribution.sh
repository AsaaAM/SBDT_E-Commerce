#!/usr/bin/env bash
# ==============================================================================
# DEMO 1: DISTRIBUSI SHARD & PEMETAAN WORKER CITUS (Bash Edition)
# ==============================================================================
echo "=============================================================================="
echo "DEMO 1: INSPEKSI DISTRIBUSI SHARD & REPLIKASI TABEL CITUS DATA"
echo "=============================================================================="

echo -e "\n>>> 1. WORKER NODES AKTIF DALAM KLUSTER:"
docker exec citus_coordinator psql -U postgres -d postgres -c "SELECT nodeid, nodename, nodeport, isactive FROM pg_dist_node ORDER BY nodeid;"

echo -e "\n>>> 2. TIPE TABEL CITUS (REFERENCE VS DISTRIBUTED):"
docker exec citus_coordinator psql -U postgres -d postgres -c "
SELECT table_name, citus_table_type, COALESCE(distribution_column, '<replicated>') as dist_col, colocation_id
FROM citus_tables ORDER BY citus_table_type, table_name;
"

echo -e "\n>>> 3. RINGKASAN JUMLAH SHARD PER WORKER NODE:"
docker exec citus_coordinator psql -U postgres -d postgres -c "
SELECT nodename, nodeport, count(*) as total_shards, pg_size_pretty(sum(shard_size)) as total_size
FROM citus_shards GROUP BY nodename, nodeport ORDER BY nodename;
"

echo -e "\n>>> 4. SAMPEL PENEMPATAN SHARD TABEL ORDERS & INVENTORY:"
docker exec citus_coordinator psql -U postgres -d postgres -c "
SELECT table_name, shardid, nodename, nodeport FROM citus_shards
WHERE table_name IN ('inventory', 'orders', 'order_items') ORDER BY shardid ASC LIMIT 12;
"
