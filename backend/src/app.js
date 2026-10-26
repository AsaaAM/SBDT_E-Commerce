const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { primaryPool, replicaPool } = require('./config/db');
const { errorHandler } = require('./middlewares/errorHandler');

// Import Rute
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ownerRoutes = require('./routes/ownerRoutes');

const path = require('path');
const fs = require('fs');

const app = express();

// Pastikan direktori uploads tersedia
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware Umum
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static serving untuk asset gambar yang diunggah
app.use('/uploads', express.static(uploadsDir));

// Header Identifier Instance Backend (Berguna untuk membuktikan Nginx Load Balancing)
const INSTANCE_ID = process.env.INSTANCE_ID || `backend-pid-${process.pid}`;
app.use((req, res, next) => {
  res.setHeader('X-Backend-Instance', INSTANCE_ID);
  next();
});

// Endpoint Health Check untuk Docker & Nginx
app.get('/health', async (req, res) => {
  let primaryDbStatus = 'DOWN';
  let replicaDbStatus = 'DOWN';
  let workerNodesCount = 0;

  try {
    const primaryTest = await primaryPool.query('SELECT 1 as healthy');
    if (primaryTest.rows.length > 0) primaryDbStatus = 'UP';

    const workersRes = await primaryPool.query('SELECT count(*) as count FROM citus_get_active_worker_nodes()');
    workerNodesCount = parseInt(workersRes.rows[0].count, 10);
  } catch (err) {
    primaryDbStatus = `ERROR: ${err.message}`;
  }

  try {
    const replicaTest = await replicaPool.query('SELECT 1 as healthy');
    if (replicaTest.rows.length > 0) replicaDbStatus = 'UP';
  } catch (err) {
    replicaDbStatus = `FAILOVER_ACTIVE (${err.message})`;
  }

  const isHealthy = primaryDbStatus === 'UP';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'OK' : 'DEGRADED',
    instance: INSTANCE_ID,
    timestamp: new Date().toISOString(),
    database: {
      coordinator_primary: primaryDbStatus,
      streaming_replica: replicaDbStatus,
      active_citus_workers: workerNodesCount,
      location_transparency: 'ENABLED (Koneksi tertuju ke Coordinator)',
    },
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/owner', ownerRoutes);

// Error Handler Terpusat
app.use(errorHandler);

module.exports = app;
