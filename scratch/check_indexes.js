const pool = require('../db');

async function checkIndexes() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'embeddings';
    `);
    console.log('Indexes on embeddings table:');
    console.log(res.rows);
  } catch (err) {
    console.error('Error checking indexes:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkIndexes();
