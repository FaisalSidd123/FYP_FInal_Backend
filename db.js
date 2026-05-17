const { Pool } = require('pg');
require('dotenv').config();

// Connect using DATABASE_URL if available (Railway standard), 
// otherwise fallback to individual environment variables or local hardcoded strings
const baseConfig = {
  keepAlive: true,
  keepalive: true, // both styles for safety
  max: 10, // keep local development pool light
  idleTimeoutMillis: 10000, // close idle connections after 10s to prevent unexpected drops
  connectionTimeoutMillis: 5000, // wait 5s to connect before timing out
};

const connectionConfig = process.env.DATABASE_URL 
  ? { 
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      ...baseConfig
    }
  : {
      // Changed to the reliable IPv4 pooler settings to prevent ENOTFOUND / IPv6 network blocks locally
      user: process.env.DB_USER || 'postgres.eehqzrypyapilzqmrjgj',
      host: process.env.DB_HOST || 'aws-1-ap-southeast-1.pooler.supabase.com',
      database: process.env.DB_NAME || 'postgres',
      password: process.env.DB_PASSWORD || 'UqJ9ZyyY-b%Zk83',
      port: process.env.DB_PORT || 6543,
      ssl: {
        rejectUnauthorized: false
      },
      ...baseConfig
    };

const pool = new Pool(connectionConfig);

// Handle idle connection errors gracefully without crashing the server
pool.on('error', (err, client) => {
  console.error('⚠️ Unexpected error on idle client in pg pool:', err.message);
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Error connecting to Database:', err.stack);
  }
  console.log('✅ Database connected successfully');
  release();
});

module.exports = pool;