const pool = require('./db');

async function updateEnum() {
  console.log('🔄 Adding "generated" to source_type_enum...');
  const client = await pool.connect();
  try {
    // ALTER TYPE cannot be run inside a transaction block (BEGIN...COMMIT) usually,
    // so we run it directly.
    await client.query(`ALTER TYPE source_type_enum ADD VALUE IF NOT EXISTS 'generated';`);
    console.log('✅ Value "generated" added to source_type_enum!');
    
    // Also run NOTIFY
    await client.query(`NOTIFY pgrst, 'reload schema'`);
    console.log('✅ PostgREST schema cache reload notified successfully!');
  } catch (err) {
    console.error('❌ Error updating enum:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

updateEnum();
