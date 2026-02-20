const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'db.eehqzrypyapilzqmrjgj.supabase.co',
  database: 'postgres',  // Note: it's 'postgres', not your old database name
  password: 'UqJ9ZyyY-b%Zk83',
  port: 5432, // or 6543 for transaction mode (see notes below)
  ssl: {
    rejectUnauthorized: false // Required for Supabase connection
  },
  // Optional: Add connection timeout
  connectionTimeoutMillis: 10000, // 10 seconds
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Error connecting to Supabase:', err.stack);
  }
  console.log('✅ Supabase database connected successfully');
  release();
});

module.exports = pool;