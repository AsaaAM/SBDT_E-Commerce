#!/usr/bin/env bash
# ==============================================================================
# DEMO 2: QUERY LINTAS SHARD & DISTRIBUTED AGGREGATION PLAN (Bash Edition)
# ==============================================================================
echo "=============================================================================="
echo "DEMO 2: QUERY LINTAS SHARD & RENCANA EKSEKUSI TERDISTRIBUSI (EXPLAIN)"
echo "=============================================================================="

QUERY="SELECT o.warehouse_id, w.name as warehouse_name, w.city, COUNT(o.id) as total_orders, SUM(o.total) as total_revenue, AVG(o.total) as average_order_value FROM orders o JOIN warehouses w ON o.warehouse_id = w.id WHERE o.status NOT IN ('dibatalkan') GROUP BY o.warehouse_id, w.name, w.city ORDER BY total_revenue DESC;"

echo -e "\n>>> 1. DISTRIBUTED QUERY EXECUTION PLAN (EXPLAIN):"
docker exec citus_coordinator psql -U postgres -d postgres -c "EXPLAIN (VERBOSE, COSTS OFF) $QUERY"

echo -e "\n>>> 2. HASIL EKSEKUSI QUERY AGREGASI LINTAS SHARD:"
docker exec citus_coordinator psql -U postgres -d postgres -c "$QUERY"
