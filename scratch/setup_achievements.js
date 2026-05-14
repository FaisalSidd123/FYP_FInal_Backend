const pool = require('../db');

async function setupAchievements() {
    try {
        console.log('🚀 Starting Achievements System Setup...');

        // 1. Create Achievements Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS achievements (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                key_name VARCHAR(50) UNIQUE NOT NULL,
                title VARCHAR(100) NOT NULL,
                description TEXT,
                icon_name VARCHAR(50),
                category VARCHAR(50),
                requirement_type VARCHAR(50),
                requirement_value INTEGER,
                xp_reward INTEGER DEFAULT 50,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ Achievements table created');

        // 2. Create User Achievements Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_achievements (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_internal_uuid UUID REFERENCES users(internal_uuid) ON DELETE CASCADE,
                achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
                unlocked_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_internal_uuid, achievement_id)
            );
        `);
        console.log('✅ User Achievements table created');

        // 3. Create User Mastery Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_mastery (
                user_internal_uuid UUID PRIMARY KEY REFERENCES users(internal_uuid) ON DELETE CASCADE,
                total_xp INTEGER DEFAULT 0,
                current_level INTEGER DEFAULT 1,
                total_diagnoses INTEGER DEFAULT 0,
                total_quizzes INTEGER DEFAULT 0,
                perfect_quizzes INTEGER DEFAULT 0,
                highest_streak INTEGER DEFAULT 0,
                last_activity TIMESTAMP,
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ User Mastery table created');

        // 4. Seed initial achievements
        const initialAchievements = [
            ['first_diagnosis', 'First Diagnosis', 'Analyzed your first clinical case', 'Award', 'diagnosis', 'count', 1, 100],
            ['case_analyst', 'Case Analyst', 'Analyzed 5 clinical cases', 'BookOpen', 'diagnosis', 'count', 5, 250],
            ['diagnostic_expert', 'Diagnostic Expert', 'Analyzed 20 clinical cases', 'Target', 'diagnosis', 'count', 20, 1000],
            ['quiz_master', 'Quiz Master', 'Completed 10 clinical quizzes', 'Brain', 'quiz', 'count', 10, 500],
            ['perfect_score', 'Perfect Score', 'Achieved 100% on a clinical quiz', 'Zap', 'quiz', 'score', 100, 300],
            ['consistent_learner', 'Consistent Learner', 'Maintained a 7-day activity streak', 'TrendingUp', 'streak', 'streak', 7, 750]
        ];

        for (const [key, title, desc, icon, cat, reqType, reqVal, xp] of initialAchievements) {
            await pool.query(`
                INSERT INTO achievements (key_name, title, description, icon_name, category, requirement_type, requirement_value, xp_reward)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (key_name) DO UPDATE SET 
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    icon_name = EXCLUDED.icon_name,
                    xp_reward = EXCLUDED.xp_reward;
            `, [key, title, desc, icon, cat, reqType, reqVal, xp]);
        }
        console.log('✅ Initial achievements seeded');

        console.log('🎉 Achievements System Setup Complete!');
    } catch (err) {
        console.error('❌ Setup failed:', err);
    } finally {
        process.exit();
    }
}

setupAchievements();
