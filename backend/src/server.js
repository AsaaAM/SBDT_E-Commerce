require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`[IKEA SBDT Backend API] Berjalan pada port ${PORT}`);
  console.log(`[Instance ID]: ${process.env.INSTANCE_ID || 'standalone'}`);
  console.log(`[Citus Coordinator]: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`[Replica Host]: ${process.env.DB_REPLICA_HOST}:${process.env.DB_REPLICA_PORT}`);
  console.log(`====================================================`);
});
