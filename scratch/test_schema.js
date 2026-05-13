const pool = require('../db');

async function testSchemaCheck() {
  try {
    const res = await pool.query(`
      SELECT table_schema, column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log('Columns found for table "users":');
    res.rows.forEach(row => {
      console.log(`- ${row.table_schema}.${row.column_name}`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

testSchemaCheck();
