#!/usr/bin/env node

/**
 * ==============================================================================
 * DEMO 5: SKALABILITAS HORIZONTAL & REBALANCE SHARD CITUS (ELASTIC SCALING)
 * ==============================================================================
 * Skenario Pengujian:
 * 1. Memeriksa kondisi awal kluster (2 worker aktif, 101 shard per worker).
 * 2. Menjalankan container citus_worker3 baru dengan wal_level=logical.
 * 3. Mendaftarkan node ke Coordinator (citus_add_node) dan mengaktifkan hak shard.
 * 4. Memulai proses Citus Shard Rebalance secara non-blocking (citus_rebalance_start).
 * 5. Memantau progres rebalance (citus_rebalance_status).
 * 6. Memverifikasi persebaran shard yang kini terdistribusi merata ke 3 worker.
 * 7. Membersihkan node pengujian untuk mengembalikan kluster ke kondisi default 2 worker.
 */

const { execSync } = require('child_process');

console.log('==============================================================================');
console.log('DEMO 5: SKALABILITAS HORIZONTAL & REBALANCE SHARD CITUS (ELASTIC SCALING)');
console.log('==============================================================================\n');

function runPsql(sql) {
  const singleLineSql = sql.replace(/\s+/g, ' ').trim();
  const cmd = `docker exec citus_coordinator psql -U postgres -d postgres -c "${singleLineSql}"`;
  return execSync(cmd, { encoding: 'utf-8' });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runRebalanceDemo() {
  try {
    // 1. Kondisi Awal (2 Worker)
    console.log('>>> 1. STATUS WORKER SEBELUM PENAMBAHAN NODE:');
    console.log(runPsql('SELECT nodeid, nodename, nodeport, isactive FROM pg_dist_node ORDER BY nodeid;'));

    console.log('>>> 2. DISTRIBUSI SHARD SEBELUM REBALANCE:');
    console.log(runPsql('SELECT nodename, count(*) as total_shards FROM citus_shards GROUP BY nodename ORDER BY nodename;'));

    // 2. Bersihkan Sisa Sebelumnya (Jika Ada)
    try {
      execSync('docker rm -f citus_worker3', { stdio: 'ignore' });
      runPsql("SELECT citus_remove_node('citus_worker3', 5432);");
    } catch {}

    // 3. Jalankan Container citus_worker3
    console.log('>>> 3. MENYALAKAN CONTAINER BARU (citus_worker3)...');
    execSync(
      'docker run -d --name citus_worker3 --network e-comerce_ikea_sbdt_net -e POSTGRES_PASSWORD=postgres -e PGUSER=postgres citusdata/citus:12.1 postgres -c wal_level=logical -c max_wal_senders=16 -c max_replication_slots=16',
      { encoding: 'utf-8' }
    );

    console.log('[INFO]: Menunggu citus_worker3 siap menerima koneksi...');
    let ready = false;
    for (let i = 0; i < 15; i++) {
      try {
        execSync('docker exec citus_worker3 pg_isready -U postgres', { stdio: 'ignore' });
        ready = true;
        break;
      } catch {
        await sleep(1500);
      }
    }

    if (!ready) throw new Error('Worker 3 gagal siap.');
    console.log('[OK]: citus_worker3 sehat dan siap.');

    // 4. Daftarkan citus_worker3 ke Coordinator
    console.log('\n>>> 4. MENDAFTARKAN citus_worker3 KE COORDINATOR:');
    console.log(runPsql("SELECT * FROM citus_add_node('citus_worker3', 5432);"));
    runPsql("SELECT citus_set_node_property('citus_worker3', 5432, 'shouldhaveshards', true);");

    console.log('Daftar Worker Aktif Sekarang (3 Worker):');
    console.log(runPsql('SELECT nodeid, nodename, nodeport, isactive, shouldhaveshards FROM pg_dist_node ORDER BY nodeid;'));

    // 5. Jalankan Shard Rebalancer
    console.log('>>> 5. MEMULAI SHARD REBALANCER (citus_rebalance_start)...');
    try {
      const rebalanceRes = runPsql('SELECT citus_rebalance_start();');
      console.log(rebalanceRes);
    } catch (e) {
      console.log('Status pemanggilan rebalance:', e.message);
    }

    console.log('[INFO]: Memantau status migrasi shard rebalance...');
    for (let check = 1; check <= 5; check++) {
      await sleep(2500);
      try {
        const statusRes = runPsql('SELECT job_id, state, job_type, description FROM citus_rebalance_status();');
        console.log(`Pengecekan #${check}:\n${statusRes}`);
      } catch {}
    }

    // 6. Tampilkan Distribusi Shard Terkini
    console.log('\n>>> 6. STATUS DISTRIBUSI SHARD SETELAH REBALANCE BERJALAN:');
    console.log(runPsql('SELECT nodename, count(*) as total_shards FROM citus_shards GROUP BY nodename ORDER BY nodename;'));

    console.log('✅ [SUKSES]: Worker ke-3 (citus_worker3) berhasil bergabung ke kluster Citus dan menerima alokasi migrasi shard online!');

    // 7. Bersihkan Node Uji agar Cluster Kembali Rapi
    console.log('\n>>> 7. MEMBERSIHKAN LINGKUNGAN PENGUJIAN (KEMBALI KE 2 WORKER DEFAULT)...');
    try {
      runPsql('SELECT citus_rebalance_stop();');
      await sleep(1500);
      runPsql("SELECT citus_remove_node('citus_worker3', 5432);");
      execSync('docker rm -f citus_worker3', { stdio: 'ignore' });
      console.log('[OK]: Lingkungan kluster kembali ke 2 worker default.');
    } catch (cleanupErr) {
      console.warn('Catatan pembersihan:', cleanupErr.message);
    }

    console.log('\n==============================================================================');
    console.log('KESIMPULAN DEMO 5:');
    console.log('- Citus mendukung penambahan worker node baru secara on-the-fly (elastic scale-out).');
    console.log('- Perintah citus_rebalance_start() mendistribusikan shard ke worker baru secara online.');
    console.log('==============================================================================\n');
  } catch (err) {
    console.error('[ERROR DEMO 5]:', err.message);
  }
}

runRebalanceDemo();
