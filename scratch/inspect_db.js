const pool = require('../db');

async function inspectTable() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
    `);
    console.log('Columns in users table:');
    res.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
  } catch (err) {
    console.error('Error inspecting table:', err);
  } finally {
    await pool.end();
  }
}

inspectTable();
