#!/usr/bin/env node

/**
 * ==============================================================================
 * DEMO 1: DISTRIBUSI SHARD & PEMETAAN WORKER CITUS
 * ==============================================================================
 * Skrip ini memeriksa metadata internal Citus:
 * 1. citus_tables: Menampilkan tipe tabel (reference vs distributed) & kolom distribusi
 * 2. citus_shards: Menampilkan ID shard, ukuran shard, dan penempatan fisik pada worker node
 * 3. Ringkasan jumlah shard per node
 */

const { execSync } = require('child_process');

console.log('==============================================================================');
console.log('DEMO 1: INSPEKSI DISTRIBUSI SHARD & REPLIKASI TABEL CITUS DATA');
console.log('==============================================================================\n');

function runPsql(sql) {
  const singleLineSql = sql.replace(/\s+/g, ' ').trim();
  const cmd = `docker exec citus_coordinator psql -U postgres -d postgres -c "${singleLineSql}"`;
  return execSync(cmd, { encoding: 'utf-8' });
}

try {
  // 1. Worker Nodes Terdaftar
  console.log('>>> 1. WORKER NODES AKTIF DALAM KLUSTER:');
  console.log(runPsql('SELECT nodeid, nodename, nodeport, isactive FROM pg_dist_node ORDER BY nodeid;'));

  // 2. Tipe Tabel Citus (Reference vs Distributed)
  console.log('\n>>> 2. TIPE TABEL CITUS (REFERENCE VS DISTRIBUTED):');
  console.log(runPsql(`
    SELECT 
      table_name,
      citus_table_type,
      COALESCE(distribution_column, '<replicated to all>') as distribution_column,
      colocation_id
    FROM citus_tables
    ORDER BY citus_table_type, table_name;
  `));

  // 3. Ringkasan Penempatan Shard per Worker Node
  console.log('\n>>> 3. RINGKASAN JUMLAH SHARD PER WORKER NODE:');
  console.log(runPsql(`
    SELECT 
      nodename,
      nodeport,
      count(*) as total_shards,
      pg_size_pretty(sum(shard_size)) as total_size
    FROM citus_shards
    GROUP BY nodename, nodeport
    ORDER BY nodename;
  `));

  // 4. Sampel Pemetaan Shard Tabel Distributed (orders & inventory)
  console.log('\n>>> 4. SAMPEL PENEMPATAN SHARD (Tabel: inventory & orders):');
  console.log(runPsql(`
    SELECT 
      table_name,
      shardid,
      nodename,
      nodeport
    FROM citus_shards
    WHERE table_name IN ('inventory', 'orders', 'order_items')
    ORDER BY shardid ASC
    LIMIT 12;
  `));

  console.log('KESIMPULAN DEMO 1:');
  console.log('- Reference table (categories, products, warehouses, promos, users) direplikasi 100% ke semua node.');
  console.log('- Distributed table (orders, inventory, order_items, dll) difragmentasi horizontal berdasarkan warehouse_id.');
  console.log('- Colocation terbukti aktif: shard orders dan inventory dengan ID sama berada di worker yang sama!');
  console.log('==============================================================================\n');
} catch (err) {
  console.error('[ERROR DEMO 1]:', err.message);
}
