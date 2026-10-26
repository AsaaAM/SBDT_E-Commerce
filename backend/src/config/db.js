const { Pool } = require('pg');
require('dotenv').config();

// Koneksi Primary Pool (Citus Coordinator)
// Backend hanya tahu alamat Coordinator; Coordinator yang merouting shard ke Worker
const primaryPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Koneksi Read-Replica Pool (Citus Streaming Replica)
// Digunakan untuk read-intensive queries (katalog produk, kategori)
const replicaPool = new Pool({
  host: process.env.DB_REPLICA_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_REPLICA_PORT || process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
});

primaryPool.on('error', (err) => {
  console.error('[DB Primary Pool Error]:', err.message);
});

replicaPool.on('error', (err) => {
  console.warn('[DB Replica Pool Warning]:', err.message);
});

/**
 * Eksekusi query baca dengan failover otomatis ke primary jika replica offline
 */
const queryRead = async (text, params) => {
  try {
    return await replicaPool.query(text, params);
  } catch (err) {
    console.warn(`[Read Replica Failover] Gagal query replica (${err.message}). Mengalihkan ke Primary Pool.`);
    return await primaryPool.query(text, params);
  }
};

/**
 * Eksekusi query tulis / transaksi terdistribusi pada Primary (Coordinator)
 */
const queryWrite = async (text, params) => {
  return await primaryPool.query(text, params);
};

/**
 * Dapatkan dedicated client dari Primary Pool untuk transaksi (BEGIN ... COMMIT/ROLLBACK)
 */
const getClient = async () => {
  return await primaryPool.connect();
};

module.exports = {
  primaryPool,
  replicaPool,
  queryRead,
  queryWrite,
  getClient,
};
