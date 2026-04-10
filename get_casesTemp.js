const pool = require('./db');

async function getCases() {
    try {
        const result = await pool.query('SELECT id, title, patient_info, symptoms FROM random_cases LIMIT 5');
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
getCases();
