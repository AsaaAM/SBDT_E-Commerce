#!/usr/bin/env node

/**
 * ==============================================================================
 * DEMO 2: QUERY LINTAS SHARD & DISTRIBUTED AGGREGATION PLAN (CITUS)
 * ==============================================================================
 * Skrip ini memperlihatkan:
 * 1. Distributed Query Execution Plan (EXPLAIN) dari Citus
 * 2. Bagaimana Citus melakukan pushdown agregasi (SUM, COUNT) ke worker nodes
 * 3. Eksekusi query analitik riil lintas shard orders dan reference table warehouses
 */

const { execSync } = require('child_process');

console.log('==============================================================================');
console.log('DEMO 2: QUERY LINTAS SHARD & RENCANA EKSEKUSI TERDISTRIBUSI (EXPLAIN)');
console.log('==============================================================================\n');

function runPsql(sql) {
  const singleLineSql = sql.replace(/\s+/g, ' ').trim();
  const cmd = `docker exec citus_coordinator psql -U postgres -d postgres -c "${singleLineSql}"`;
  return execSync(cmd, { encoding: 'utf-8' });
}

try {
  const query = `
    SELECT 
      o.warehouse_id,
      w.name as warehouse_name,
      w.city,
      COUNT(o.id) as total_orders,
      SUM(o.total) as total_revenue,
      AVG(o.total) as average_order_value
    FROM orders o
    JOIN warehouses w ON o.warehouse_id = w.id
    WHERE o.status NOT IN ('dibatalkan')
    GROUP BY o.warehouse_id, w.name, w.city
    ORDER BY total_revenue DESC;
  `;

  // 1. Eksekusi EXPLAIN Rencana Kueri Terdistribusi
  console.log('>>> 1. DISTRIBUTED QUERY EXECUTION PLAN (EXPLAIN):');
  console.log(runPsql(`EXPLAIN (VERBOSE, COSTS OFF) ${query}`));

  console.log('PENJELASAN ARSITEKTURAL EXPLAIN PLAN:');
  console.log('- Coordinator memecah query menjadi sub-queries paralel yang dikirim ke tiap shard worker.');
  console.log('- Custom Scan (Citus Adaptive): Citus mendeteksi join antara distributed table (orders) dan reference table (warehouses).');
  console.log('- Karena warehouses adalah Reference Table (terduplikasi di setiap worker), JOIN terjadi 100% lokal di setiap worker!');
  console.log('- Agregasi parsial (Partial SUM & COUNT) dihitung di worker, lalu coordinator menggabungkan hasil akhir (Final Merge).');

  // 2. Eksekusi Query Hasil Riil Lintas Shard
  console.log('\n>>> 2. HASIL EKSEKUSI QUERY AGREGASI LINTAS SHARD:');
  console.log(runPsql(query));

  console.log('==============================================================================\n');
} catch (err) {
  console.error('[ERROR DEMO 2]:', err.message);
}
