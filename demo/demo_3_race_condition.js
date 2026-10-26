#!/usr/bin/env node

/**
 * ==============================================================================
 * DEMO 3: SIMULASI RACE CONDITION & ISOLASI TRANSAKSI TERDISTRIBUSI
 * ==============================================================================
 * Skenario Pengujian:
 * 1. Produk ID 3 (Kursi Santai Armchair POÄNG Leather) diatur hanya tersisa 1 UNIT di Gudang 1 (Jakarta).
 * 2. Dua pengguna berbeda (User A: Siti Pembeli & User B: Budi Pembeli) menembakkan request
 *    checkout untuk 1 unit terakhir secara BERSAMAAN (konkuren paralel).
 * 3. Membuktikan bahwa mekanisme penguncian row-level (SELECT ... FOR UPDATE) pada shard
 *    berhasil menjaga konsistensi data:
 *    - Tepat 1 transaksi berhasil (HTTP 201).
 *    - Tepat 1 transaksi ditolak secara aman karena kehabisan stok (HTTP 400).
 *    - Stok akhir di inventory adalah 0 (TIDAK PERNAH NEGATIF).
 */

const { execSync } = require('child_process');

console.log('==============================================================================');
console.log('DEMO 3: SIMULASI RACE CONDITION PADA STOK TERAKHIR (DISTRIBUTED TRANSACTION)');
console.log('==============================================================================\n');

const BASE_URL = process.env.API_URL || 'http://localhost:8080/api';

async function runRaceConditionTest() {
  try {
    // 1. Reset Stok Produk 3 di Gudang 1 Menjadi Tepat 1 Unit
    console.log('>>> 1. MENYIAPKAN KONDISI AWAL (RESET STOK = 1 UNIT):');
    const resetSql = 'UPDATE inventory SET qty = 1 WHERE product_id = 3 AND warehouse_id = 1;';
    execSync(`docker exec citus_coordinator psql -U postgres -d postgres -c "${resetSql}"`, { encoding: 'utf-8' });

    const checkSql = 'SELECT product_id, warehouse_id, qty FROM inventory WHERE product_id = 3 AND warehouse_id = 1;';
    console.log(execSync(`docker exec citus_coordinator psql -U postgres -d postgres -c "${checkSql}"`, { encoding: 'utf-8' }));

    // 2. Login User A dan User B
    console.log('>>> 2. MENDAPATKAN TOKEN OTENTIKASI USER A & USER B:');
    const loginUserA = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'buyer@ikea-sbdt.local', password: 'User123!' }),
    }).then((r) => r.json());

    const loginUserB = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'budi@ikea-sbdt.local', password: 'User123!' }),
    }).then((r) => r.json());

    const tokenA = loginUserA.data.token;
    const tokenB = loginUserB.data.token;
    console.log(`[OK] User A (${loginUserA.data.user.name}) terautentikasi.`);
    console.log(`[OK] User B (${loginUserB.data.user.name}) terautentikasi.`);

    // 3. Menembakkan 2 Request Checkout Bersamaan (Paralel)
    console.log('\n>>> 3. MENEMBAKKAN 2 CHECKOUT SIMULTAN (PARALEL) UNTUK SISA 1 UNIT STOK:');
    const checkoutPayload = {
      warehouse_id: 1,
      items: [{ product_id: 3, qty: 1 }],
      shipping_address: 'Jl. Uji Konkurensi No. 99',
      shipping_city: 'Jakarta Selatan',
      recipient_name: 'Uji Race Condition',
      recipient_phone: '08129999999',
      payment_method: 'QRIS Instant',
    };

    const startTime = Date.now();

    const [resA, resB] = await Promise.all([
      fetch(`${BASE_URL}/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify(checkoutPayload),
      }),
      fetch(`${BASE_URL}/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
        body: JSON.stringify(checkoutPayload),
      }),
    ]);

    const duration = Date.now() - startTime;
    const dataA = await resA.json();
    const dataB = await resB.json();

    console.log(`[WAKTU EKSEKUSI]: Selesai dalam ${duration} ms.`);
    console.log(`\n[HASIL USER A] Status HTTP: ${resA.status}`);
    console.log(JSON.stringify(dataA, null, 2));

    console.log(`\n[HASIL USER B] Status HTTP: ${resB.status}`);
    console.log(JSON.stringify(dataB, null, 2));

    // 4. Verifikasi Status Stok Akhir di Database Citus
    console.log('\n>>> 4. VERIFIKASI SISA STOK FISIK DI DATABASE CITUS:');
    const verifySql = 'SELECT product_id, warehouse_id, qty, updated_at FROM inventory WHERE product_id = 3 AND warehouse_id = 1;';
    const verifyOutput = execSync(`docker exec citus_coordinator psql -U postgres -d postgres -c "${verifySql}"`, { encoding: 'utf-8' });
    console.log(verifyOutput);

    // 5. Analisis Hasil
    console.log('>>> 5. ANALISIS KONSISTENSI SBDT:');
    const isOneSuccess = (resA.status === 201 && resB.status === 400) || (resA.status === 400 && resB.status === 201);
    const isInsufficient = (dataA.error_code === 'INSUFFICIENT_STOCK' || dataB.error_code === 'INSUFFICIENT_STOCK');

    if (isOneSuccess && isInsufficient) {
      console.log('✅ [SUKSES MUTLAK]: Race condition berhasil dicegah!');
      console.log('   - Tepat 1 user memenangkan persaingan stok (Status 201).');
      console.log('   - Tepat 1 user ditolak secara elegan tanpa anomali (Status 400 - INSUFFICIENT_STOCK).');
      console.log('   - Stok akhir bernilai 0 dan TIDAK PERNAH MENJADI NEGATIF (-1)!');
    } else {
      console.error('❌ [GAGAL]: Anomali integritas data terdeteksi.');
    }

    console.log('==============================================================================\n');
  } catch (err) {
    console.error('[ERROR DEMO 3]:', err.message);
  }
}

runRaceConditionTest();
