const pool = require('../db');

async function checkEmbeddingDimension() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT atttypmod 
      FROM pg_attribute 
      WHERE attrelid = 'public.embeddings'::regclass 
        AND attname = 'embedding';
    `);
    console.log('atttypmod:', res.rows[0].atttypmod);
  } catch (err) {
    console.error('Error checking dimension:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkEmbeddingDimension();
