const pool = require('./db');

async function checkAndCreateTable() {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS case_queries (
                id SERIAL PRIMARY KEY,
                case_id INTEGER REFERENCES diagnosis_cases(id) ON DELETE CASCADE,
                user_internal_uuid UUID NOT NULL,
                query_text TEXT NOT NULL,
                ai_response TEXT,
                response_time_ms INTEGER,
                tokens_used INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;

        console.log('Running query to create case_queries table...');
        await pool.query(createTableQuery);
        console.log('Table case_queries verified/created successfully.');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        pool.end();
    }
}

checkAndCreateTable();
