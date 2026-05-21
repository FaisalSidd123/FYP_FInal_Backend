const pool = require('./db');
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'random_cases'").then(res => {
  console.log(res.rows.map(r => `${r.column_name}: ${r.data_type}`).join('\n'));
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
