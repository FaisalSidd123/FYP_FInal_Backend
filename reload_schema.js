const pool = require('./db');

async function reloadCache() {
  console.log('🔄 Reloading PostgREST schema cache...');
  const client = await pool.connect();
  try {
    // Notify PostgREST to reload its schema cache
    await client.query(`NOTIFY pgrst, 'reload schema'`);
    console.log('✅ PostgREST schema cache reload notified successfully!');
  } catch (err) {
    console.error('❌ Error reloading cache:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

reloadCache();
