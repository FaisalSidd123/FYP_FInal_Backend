const pool = require('../db');

async function checkEmbeddingColumn() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type, udt_name, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'embeddings';
    `);
    console.log('Columns on embeddings table:');
    console.log(res.rows);
  } catch (err) {
    console.error('Error checking columns:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkEmbeddingColumn();
