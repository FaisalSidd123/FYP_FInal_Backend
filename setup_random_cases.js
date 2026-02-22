const pool = require('./db');

async function setupRandomCases() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Creating tables...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS random_cases (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                patient_info VARCHAR(255),
                symptoms JSONB,
                severity VARCHAR(50),
                icon VARCHAR(50),
                color VARCHAR(50),
                date VARCHAR(50),
                confidence INTEGER,
                description TEXT,
                recommendations JSONB,
                tests JSONB,
                questions JSONB,
                times_used INTEGER DEFAULT 0,
                avg_score INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS case_attempts (
                id SERIAL PRIMARY KEY,
                case_id INTEGER REFERENCES random_cases(id) ON DELETE CASCADE,
                user_internal_uuid UUID NOT NULL,
                answers JSONB,
                score INTEGER,
                total_questions INTEGER,
                time_spent INTEGER,
                completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Check if there are already cases
        const checkRes = await client.query('SELECT COUNT(*) FROM random_cases');
        if (parseInt(checkRes.rows[0].count) === 0) {
            console.log('Populating seed data...');
            const seedData = [
                {
                    title: "Severe Asthma Attack",
                    patient_info: "32-year-old female",
                    symptoms: ["Acute dyspnea", "Wheezing", "Chest tightness"],
                    severity: "High",
                    icon: "Activity",
                    color: "bg-orange-500",
                    date: "2 hours ago",
                    confidence: 92,
                    description: "Acute exacerbation with reduced peak flow. Patient presents with audible wheezing and accessory muscle use.",
                    recommendations: ["Nebulized albuterol", "Systemic corticosteroids", "Oxygen therapy", "Monitor peak flow"],
                    tests: ["Spirometry", "Peak flow measurement", "Chest X-ray", "ABG analysis"],
                    questions: [
                        {
                            question: "What is the most appropriate initial treatment for this patient?",
                            options: ["Intravenous antibiotics", "Nebulized albuterol", "Oral antihistamines", "Chest physiotherapy"],
                            correct: 1,
                            explanation: "Nebulized short-acting beta-agonists (like albuterol) are the first-line treatment for acute asthma exacerbations to rapidly reverse bronchoconstriction."
                        },
                        {
                            question: "Which finding would indicate a severe, life-threatening attack?",
                            options: ["Audible wheezing", "Coughing", "Silent chest", "Tachycardia"],
                            correct: 2,
                            explanation: "A 'silent chest' occurs when airflow is so restricted that wheezing cannot be heard, indicating impending respiratory failure."
                        }
                    ]
                },
                {
                    title: "Community Pneumonia",
                    patient_info: "68-year-old male",
                    symptoms: ["Fever", "Productive cough", "Crackles", "Dyspnea"],
                    severity: "Medium",
                    icon: "AlertCircle",
                    color: "bg-red-500",
                    date: "1 day ago",
                    confidence: 96,
                    description: "Lobar pneumonia with consolidation in right lower lobe. Patient is febrile with productive cough.",
                    recommendations: ["Antibiotic therapy", "Chest physiotherapy", "Hydration", "Fever management"],
                    tests: ["Chest X-ray", "Sputum culture", "CBC", "CRP levels"],
                    questions: [
                        {
                            question: "Which auscultatory finding is most consistent with lobar consolidation?",
                            options: ["Scattered wheezes", "Bronchial breath sounds and crackles over the lobe", "Diminished breath sounds globally", "Pleural friction rub"],
                            correct: 1,
                            explanation: "Consolidation transmits higher-frequency sounds better, leading to bronchial breath sounds and crackles over the affected area."
                        },
                        {
                            question: "What is the most common bacterial cause of typical community-acquired pneumonia?",
                            options: ["Staphylococcus aureus", "Haemophilus influenzae", "Streptococcus pneumoniae", "Mycoplasma pneumoniae"],
                            correct: 2,
                            explanation: "Streptococcus pneumoniae is the most frequent bacterial cause of typical community-acquired pneumonia."
                        }
                    ]
                },
                {
                    title: "Pulmonary Embolism",
                    patient_info: "45-year-old female",
                    symptoms: ["Sudden dyspnea", "Pleuritic chest pain", "Tachycardia", "Hemoptysis"],
                    severity: "Critical",
                    icon: "Activity",
                    color: "bg-rose-500",
                    date: "Just admitted",
                    confidence: 89,
                    description: "Suspected PE in post-operative patient with unilateral leg swelling.",
                    recommendations: ["Anticoagulation", "Oxygen", "CT angiography", "Monitor vitals"],
                    tests: ["CT pulmonary angiography", "D-dimer", "ABG", "Lower limb ultrasound"],
                    questions: [
                        {
                            question: "What is the gold standard imaging modality for diagnosing pulmonary embolism?",
                            options: ["Chest X-ray", "Pulmonary angiography / CTPA", "Echocardiogram", "V/Q scan"],
                            correct: 1,
                            explanation: "CT Pulmonary Angiography (CTPA) is the imaging modality of choice for suspected PE."
                        }
                    ]
                }
            ];

            for (const item of seedData) {
                await client.query(`
                    INSERT INTO random_cases (
                        title, patient_info, symptoms, severity, icon, color, date, confidence, description, recommendations, tests, questions
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                `, [
                    item.title,
                    item.patient_info,
                    JSON.stringify(item.symptoms),
                    item.severity,
                    item.icon,
                    item.color,
                    item.date,
                    item.confidence,
                    item.description,
                    JSON.stringify(item.recommendations),
                    JSON.stringify(item.tests),
                    JSON.stringify(item.questions)
                ]);
            }
            console.log('Seed data inserted.');
        } else {
            console.log('Tables already populated.');
        }

        await client.query('COMMIT');
        console.log('Setup completed successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in setup:', err);
    } finally {
        client.release();
        pool.end();
    }
}

setupRandomCases();
