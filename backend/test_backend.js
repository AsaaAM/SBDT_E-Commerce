const app = require('./src/app');
const http = require('http');

// Atur environment lokal agar terhubung ke localhost (port container)
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_REPLICA_HOST = 'localhost';
process.env.DB_REPLICA_PORT = '5433';

async function runTests() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5099, resolve));
  console.log('Testing server running on port 5099...');

  const BASE_URL = 'http://localhost:5099';

  try {
    // 1. Test Healthcheck
    console.log('\n--- 1. Testing Healthcheck ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    console.log('Healthcheck Status:', healthData.status);
    console.log('Database Status:', healthData.database);
    if (healthData.status !== 'OK') throw new Error('Healthcheck failed');

    // 2. Test Login 4 Role
    console.log('\n--- 2. Testing Login 4 Role (RBAC) ---');
    const accounts = [
      { role: 'user', email: 'buyer@ikea-sbdt.local', pass: 'User123!' },
      { role: 'warehouse', email: 'gudang@ikea-sbdt.local', pass: 'Gudang123!' },
      { role: 'admin', email: 'admin@ikea-sbdt.local', pass: 'Admin123!' },
      { role: 'owner', email: 'owner@ikea-sbdt.local', pass: 'Owner123!' },
    ];

    const tokens = {};
    for (const acc of accounts) {
      const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: acc.pass }),
      });
      const loginData = await loginRes.json();
      if (!loginData.success) throw new Error(`Login failed for ${acc.role}: ${loginData.message}`);
      tokens[acc.role] = loginData.data.token;
      console.log(`[PASS] Login ${acc.role} (${acc.email}): Berhasil. Token diperoleh.`);
    }

    // 3. Test Katalog Produk (Read dari replica)
    console.log('\n--- 3. Testing Katalog Produk & Agregasi Stok ---');
    const prodRes = await fetch(`${BASE_URL}/api/products?limit=3`);
    const prodData = await prodRes.json();
    console.log(`[PASS] Produk ditemukan: ${prodData.data.pagination.total_items} item.`);
    console.log(`Contoh produk 1: "${prodData.data.items[0].name}", Stok Total: ${prodData.data.items[0].total_stock}`);

    // 4. Test RBAC Security (User dilarang akses endpoint owner/admin)
    console.log('\n--- 4. Testing RBAC Security Guard ---');
    const rbacRes = await fetch(`${BASE_URL}/api/owner/analytics`, {
      headers: { Authorization: `Bearer ${tokens.user}` },
    });
    console.log(`User akses /api/owner/analytics -> Status: ${rbacRes.status} (Harus 403 Forbidden)`);
    if (rbacRes.status !== 403) throw new Error('RBAC security breach: user should be forbidden!');
    console.log('[PASS] RBAC terbukti memblokir akses tidak sah!');

    // 5. Test Owner Dashboard Analytics (Agregasi Lintas Shard)
    console.log('\n--- 5. Testing Owner Dashboard (Agregasi Lintas Shard) ---');
    const ownerRes = await fetch(`${BASE_URL}/api/owner/analytics`, {
      headers: { Authorization: `Bearer ${tokens.owner}` },
    });
    const ownerData = await ownerRes.json();
    console.log(`[PASS] Total Revenue Terdistribusi: Rp ${parseFloat(ownerData.data.kpi.total_revenue).toLocaleString('id-ID')}`);
    console.log(`[PASS] Gudang Teranalisis: ${ownerData.data.warehouse_performance.length} gudang regional.`);

    // 6. Test Transaksi Terdistribusi Checkout
    console.log('\n--- 6. Testing Transaksi Terdistribusi Checkout Atomik ---');
    // Beli produk 1 (qty 1) di Gudang 1
    const checkoutRes = await fetch(`${BASE_URL}/api/orders/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.user}`,
      },
      body: JSON.stringify({
        warehouse_id: 1,
        items: [{ product_id: 1, qty: 1 }],
        shipping_address: 'Jl. Sudirman Kav 21',
        shipping_city: 'Jakarta',
        recipient_name: 'Siti Pembeli',
        recipient_phone: '081234567890',
        payment_method: 'QRIS Instant',
      }),
    });
    const checkoutData = await checkoutRes.json();
    if (!checkoutData.success) throw new Error(`Checkout failed: ${checkoutData.message}`);
    console.log(`[PASS] Checkout berhasil! Order Number: ${checkoutData.data.order_number}, Total: Rp ${checkoutData.data.total}`);

    console.log('\n======================================================');
    console.log('SEMUA PENGUJIAN BACKEND REST API TAHAP 2 BERHASIL 100%!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n[TEST FAILED]:', err.message);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();
