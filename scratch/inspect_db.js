const pool = require('../db');

async function inspect() {
    try {
        console.log(`\n--- Schema for users ---`);
        const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);
        console.table(columns.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

inspect();
