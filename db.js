const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'health_simulator',
  password: 'Admin@123',
  port: 5432,
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Error acquiring client', err.stack);
  }
  console.log('✅ Database connected successfully');
  release();
});

module.exports = pool;  // ✅ Make sure you're exporting 'pool', not something else