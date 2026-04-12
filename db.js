const { Pool } = require('pg');
require('dotenv').config();

// Connect using DATABASE_URL if available (Railway standard), 
// otherwise fallback to individual environment variables or local hardcoded strings
const connectionConfig = process.env.DATABASE_URL 
  ? { 
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
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
      connectionTimeoutMillis: 10000,
    };

const pool = new Pool(connectionConfig);

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Error connecting to Database:', err.stack);
  }
  console.log('✅ Database connected successfully');
  release();
});

module.exports = pool;