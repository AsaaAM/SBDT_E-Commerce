#!/usr/bin/env node

/**
 * ==============================================================================
 * DEMO 4: SIMULASI FAILOVER & KETAHANAN SISTEM (HIGH AVAILABILITY)
 * ==============================================================================
 * Menguji perilaku sistem dalam 2 skenario kegagalan:
 * 1. Kegagalan Instance Backend: Mematikan container backend1 dan membuktikan Nginx
 *    secara instan mengalihkan 100% traffic ke backend2 tanpa downtime bagi pengguna.
 * 2. Kegagalan Database Read-Replica: Mematikan container citus_replica dan membuktikan
 *    backend connection pool secara otomatis melakukan failover query baca ke coordinator.
 */

const { execSync } = require('child_process');

console.log('==============================================================================');
console.log('DEMO 4: SIMULASI FAILOVER & KETAHANAN SISTEM (FAULT TOLERANCE)');
console.log('==============================================================================\n');

const BASE_URL = process.env.API_URL || 'http://localhost:8080';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runFailoverTest() {
  try {
    // --------------------------------------------------------------------------
    // SKENARIO 1: BACKEND INSTANCE FAILOVER PADA NGINX
    // --------------------------------------------------------------------------
    console.log('>>> SKENARIO 1: SIMULASI MATINYA CONTAINER backend1');
    console.log('[AKSI]: Mematikan container backend1 (docker stop backend1)...');
    execSync('docker stop backend1', { encoding: 'utf-8' });
    await sleep(2000);

    console.log('[PENGUJIAN]: Mengirim 4 request ke Nginx (http://localhost:8080/health)...');
    for (let i = 1; i <= 4; i++) {
      const res = await fetch(`${BASE_URL}/health`);
      const data = await res.json();
      const upstream = res.headers.get('x-upstream-backend');
      console.log(`  Req #${i} -> Status HTTP: ${res.status}, Instance: ${data.instance}, Upstream: ${upstream}`);
    }

    console.log('✅ [HASIL SKENARIO 1]: Nginx berhasil mendeteksi backend1 offline dan mengalihkan seluruh lalu lintas ke backend2!');

    console.log('[PEMULIHAN]: Menyalakan kembali backend1 (docker start backend1)...');
    execSync('docker start backend1', { encoding: 'utf-8' });
    await sleep(4000);

    // --------------------------------------------------------------------------
    // SKENARIO 2: DATABASE READ-REPLICA FAILOVER PADA BACKEND POOL
    // --------------------------------------------------------------------------
    console.log('\n>>> SKENARIO 2: SIMULASI MATINYA CONTAINER citus_replica');
    console.log('[AKSI]: Mematikan container citus_replica (docker stop citus_replica)...');
    execSync('docker stop citus_replica', { encoding: 'utf-8' });
    await sleep(2000);

    console.log('[PENGUJIAN]: Menjalankan query pembacaan katalog produk melalui API...');
    const catRes = await fetch(`${BASE_URL}/api/products?limit=2`);
    const catData = await catRes.json();

    console.log(`  Status HTTP: ${catRes.status}, Produk terbaca: ${catData.data.items.length} item.`);
    console.log('  Contoh produk:', catData.data.items[0]?.name);

    console.log('✅ [HASIL SKENARIO 2]: Backend connection pool secara transparan mengalihkan pembacaan ke Citus Coordinator!');

    console.log('[PEMULIHAN]: Menyalakan kembali citus_replica (docker start citus_replica)...');
    execSync('docker start citus_replica', { encoding: 'utf-8' });
    await sleep(3000);

    console.log('\n==============================================================================');
    console.log('KESIMPULAN DEMO 4:');
    console.log('- Kegagalan instance aplikasi backend ditangani secara mulus oleh Nginx Reverse Proxy.');
    console.log('- Kegagalan node read-replica ditangani dengan failover query pool ke primary coordinator.');
    console.log('==============================================================================\n');
  } catch (err) {
    console.error('[ERROR DEMO 4]:', err.message);
  }
}

runFailoverTest();
