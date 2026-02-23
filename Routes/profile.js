// backend/routes/profile.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// ============================================
// GET /api/profile/stats/:uid - Get profile statistics
// ============================================
router.get('/stats/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        console.log('📊 Fetching profile stats for user:', uid);

        // Get user internal UUID
        const userQuery = 'SELECT internal_uuid, * FROM users WHERE uid = $1';
        const userResult = await pool.query(userQuery, [uid]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = userResult.rows[0];
        const userInternalUuid = user.internal_uuid;

        // Get diagnosis cases statistics
        const diagnosisStatsQuery = `
      SELECT 
        COUNT(*) as total_diagnosis_cases,
        AVG(confidence)::integer as avg_diagnosis_confidence,
        COUNT(CASE WHEN severity IN ('high', 'critical') THEN 1 END) as high_severity_cases,
        COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_severity_cases,
        COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_severity_cases,
        MAX(created_at) as last_diagnosis_date
      FROM diagnosis_cases 
      WHERE user_internal_uuid = $1
    `;

        const diagnosisStats = await pool.query(diagnosisStatsQuery, [userInternalUuid]);

        // Get case attempts statistics (from quiz)
        const quizStatsQuery = `
      SELECT 
        COUNT(*) as total_quiz_attempts,
        AVG(score)::integer as avg_quiz_score,
        SUM(score) as total_score,
        SUM(total_questions) as total_questions_attempted,
        AVG(time_spent)::integer as avg_time_spent,
        COUNT(DISTINCT case_id) as unique_cases_attempted,
        COUNT(CASE WHEN score = total_questions THEN 1 END) as perfect_scores
      FROM case_attempts 
      WHERE user_internal_uuid = $1
    `;

        const quizStats = await pool.query(quizStatsQuery, [userInternalUuid]);

        // Get random cases practice stats
        const randomCasesStatsQuery = `
      SELECT 
        COUNT(*) as total_random_cases_practiced,
        AVG(avg_score)::integer as avg_random_cases_score
      FROM random_cases rc
      JOIN case_attempts ca ON rc.id = ca.case_id
      WHERE ca.user_internal_uuid = $1
    `;

        const randomCasesStats = await pool.query(randomCasesStatsQuery, [userInternalUuid]);

        // Calculate overall accuracy rate
        const totalQuestions = parseInt(quizStats.rows[0].total_questions_attempted) || 0;
        const totalScore = parseInt(quizStats.rows[0].total_score) || 0;
        const overallAccuracy = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

        // Calculate skill levels based on actual data
        const skills = {
            anatomy: calculateSkillLevel('anatomy', diagnosisStats, quizStats),
            diagnosis: calculateSkillLevel('diagnosis', diagnosisStats, quizStats),
            procedures: calculateSkillLevel('procedures', diagnosisStats, quizStats)
        };

        // Calculate rank based on performance
        const rank = calculateRank(
            overallAccuracy,
            parseInt(diagnosisStats.rows[0].total_diagnosis_cases) || 0,
            parseInt(quizStats.rows[0].perfect_scores) || 0
        );

        // Calculate XP and level
        const { level, xp, nextLevelXp } = calculateLevelAndXP(
            parseInt(diagnosisStats.rows[0].total_diagnosis_cases) || 0,
            parseInt(quizStats.rows[0].total_quiz_attempts) || 0,
            overallAccuracy
        );

        // Compile all statistics
        const profileStats = {
            user: {
                uid: user.uid,
                email: user.email,
                display_name: user.display_name,
                photo_url: user.photo_url,
                phone_number: user.phone_number,
                role: user.role,
                specialization: user.specialization,
                experience_years: user.experience_years,
                medical_license: user.medical_license,
                age: user.age,
                gender: user.gender,
                medical_conditions: user.medical_conditions,
                reason_for_interest: user.reason_for_interest,
                learning_goals: user.learning_goals,
                role_completed: user.role_completed,
                created_at: user.created_at,
                last_login: user.last_login
            },
            diagnosis: {
                total_cases: parseInt(diagnosisStats.rows[0].total_diagnosis_cases) || 0,
                avg_confidence: diagnosisStats.rows[0].avg_diagnosis_confidence || 0,
                severity_breakdown: {
                    high: parseInt(diagnosisStats.rows[0].high_severity_cases) || 0,
                    medium: parseInt(diagnosisStats.rows[0].medium_severity_cases) || 0,
                    low: parseInt(diagnosisStats.rows[0].low_severity_cases) || 0
                },
                last_activity: diagnosisStats.rows[0].last_diagnosis_date
            },
            quizzes: {
                total_attempts: parseInt(quizStats.rows[0].total_quiz_attempts) || 0,
                avg_score: quizStats.rows[0].avg_quiz_score || 0,
                total_score: parseInt(quizStats.rows[0].total_score) || 0,
                total_questions: totalQuestions,
                avg_time_spent: quizStats.rows[0].avg_time_spent || 0,
                unique_cases: parseInt(quizStats.rows[0].unique_cases_attempted) || 0,
                perfect_scores: parseInt(quizStats.rows[0].perfect_scores) || 0,
                random_cases_practiced: parseInt(randomCasesStats.rows[0].total_random_cases_practiced) || 0
            },
            performance: {
                overall_accuracy: overallAccuracy,
                total_practice_time: Math.round(totalQuestions * 2 / 60), // Rough estimate in hours
                skills: skills,
                rank: rank,
                level: level,
                xp: xp,
                next_level_xp: nextLevelXp
            }
        };

        console.log('✅ Profile stats compiled:', profileStats);

        res.status(200).json({
            success: true,
            stats: profileStats
        });

    } catch (error) {
        console.error('❌ Error fetching profile stats:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Helper function to calculate skill levels
function calculateSkillLevel(skillType, diagnosisStats, quizStats) {
    const totalCases = parseInt(diagnosisStats.rows[0]?.total_diagnosis_cases) || 0;
    const avgConfidence = diagnosisStats.rows[0]?.avg_diagnosis_confidence || 0;
    const quizScore = quizStats.rows[0]?.avg_quiz_score || 0;

    switch (skillType) {
        case 'anatomy':
            return Math.min(100, Math.round((totalCases * 5) + (avgConfidence * 0.3)));
        case 'diagnosis':
            return Math.min(100, Math.round((avgConfidence * 0.5) + (quizScore * 0.5)));
        case 'procedures':
            return Math.min(100, Math.round((totalCases * 3) + (quizScore * 0.2)));
        default:
            return 0;
    }
}

// Helper function to calculate rank
function calculateRank(accuracy, totalCases, perfectScores) {
    if (accuracy >= 95 && totalCases >= 20 && perfectScores >= 5) return "Elite Diagnostician";
    if (accuracy >= 90 && totalCases >= 15 && perfectScores >= 3) return "Master Clinician";
    if (accuracy >= 85 && totalCases >= 10 && perfectScores >= 1) return "Senior Resident";
    if (accuracy >= 80 && totalCases >= 5) return "Junior Resident";
    if (accuracy >= 70 && totalCases >= 2) return "Medical Student";
    return "Novice";
}

// Helper function to calculate level and XP
function calculateLevelAndXP(totalCases, totalQuizzes, accuracy) {
    const baseXP = (totalCases * 10) + (totalQuizzes * 5) + (accuracy * 2);
    const level = Math.floor(baseXP / 100) + 1;
    const xp = baseXP % 100;
    const nextLevelXp = 100;

    return { level, xp, nextLevelXp };
}

module.exports = router;