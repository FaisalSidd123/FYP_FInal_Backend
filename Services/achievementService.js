const pool = require('../db');

/**
 * Achievement and Mastery Service
 */
const AchievementService = {
    /**
     * Updates user mastery and checks for new achievements
     * @param {string} userInternalUuid 
     * @param {string} eventType 'diagnosis' | 'quiz'
     * @param {object} data Relevant data for the event
     */
    async trackActivity(userInternalUuid, eventType, data = {}) {
        try {
            console.log(`📈 Tracking activity for user ${userInternalUuid}: ${eventType}`);

            // 1. Ensure user_mastery record exists
            await pool.query(`
                INSERT INTO user_mastery (user_internal_uuid, last_activity)
                VALUES ($1, NOW())
                ON CONFLICT (user_internal_uuid) DO UPDATE SET last_activity = NOW();
            `, [userInternalUuid]);

            // 2. Calculate XP gained
            let xpGained = 0;
            if (eventType === 'diagnosis') {
                xpGained = 200;
                await pool.query(`
                    UPDATE user_mastery 
                    SET total_diagnoses = total_diagnoses + 1,
                        total_xp = total_xp + $2
                    WHERE user_internal_uuid = $1
                `, [userInternalUuid, xpGained]);
            } else if (eventType === 'quiz') {
                const score = data.score || 0;
                const totalPossible = data.total_possible || 10;
                const isPerfect = score >= totalPossible;

                xpGained = 100 + (score * 10); // 100 base + 10 per point
                if (isPerfect) xpGained += 300; // Perfect bonus

                await pool.query(`
                    UPDATE user_mastery 
                    SET total_quizzes = total_quizzes + 1,
                        perfect_quizzes = perfect_quizzes + (CASE WHEN $3 = true THEN 1 ELSE 0 END),
                        total_xp = total_xp + $2
                    WHERE user_internal_uuid = $1
                `, [userInternalUuid, xpGained, isPerfect]);
            }

            // 3. Update Level based on XP (1000 XP per level)
            await pool.query(`
                UPDATE user_mastery 
                SET current_level = FLOOR(total_xp / 1000) + 1,
                    updated_at = NOW()
                WHERE user_internal_uuid = $1
            `, [userInternalUuid]);

            // 4. Check for achievements
            await this.checkAchievements(userInternalUuid);

            return { success: true, xpGained };
        } catch (error) {
            console.error('❌ Error in AchievementService:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Checks all achievements for a user
     */
    async checkAchievements(userInternalUuid) {
        try {
            // Get user's current stats
            const masteryRes = await pool.query('SELECT * FROM user_mastery WHERE user_internal_uuid = $1', [userInternalUuid]);
            if (masteryRes.rows.length === 0) return;
            const mastery = masteryRes.rows[0];

            // Get all achievements user DOES NOT have yet
            const pendingAchRes = await pool.query(`
                SELECT * FROM achievements 
                WHERE id NOT IN (
                    SELECT achievement_id FROM user_achievements WHERE user_internal_uuid = $1
                )
            `, [userInternalUuid]);

            for (const achievement of pendingAchRes.rows) {
                let unlocked = false;

                if (achievement.requirement_type === 'count') {
                    const count = achievement.category === 'diagnosis' ? mastery.total_diagnoses : mastery.total_quizzes;
                    if (count >= achievement.requirement_value) unlocked = true;
                } else if (achievement.requirement_type === 'score' && achievement.category === 'quiz') {
                    if (mastery.perfect_quizzes > 0) unlocked = true;
                } else if (achievement.requirement_type === 'streak') {
                    // Streaks are calculated in stats.js, but we can check highest_streak in mastery if we update it
                    // For now, let's just use a placeholder check or skip
                }

                if (unlocked) {
                    await pool.query(`
                        INSERT INTO user_achievements (user_internal_uuid, achievement_id)
                        VALUES ($1, $2)
                        ON CONFLICT DO NOTHING;
                    `, [userInternalUuid, achievement.id]);

                    // Add XP reward for achievement
                    await pool.query(`
                        UPDATE user_mastery 
                        SET total_xp = total_xp + $2,
                            current_level = FLOOR((total_xp + $2) / 1000) + 1
                        WHERE user_internal_uuid = $1
                    `, [userInternalUuid, achievement.xp_reward]);

                    console.log(`🏆 Achievement Unlocked: ${achievement.title} for user ${userInternalUuid}`);
                }
            }
        } catch (error) {
            console.error('❌ Error checking achievements:', error);
        }
    }
};

module.exports = AchievementService;
