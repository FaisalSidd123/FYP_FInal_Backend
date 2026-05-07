const pool = require('./db');

(async () => {
  try {
    await pool.query(`ALTER TABLE diagnosis_cases ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT NULL`);
    console.log('ai_analysis column added successfully');
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    process.exit();
  }
})();
