// backend/routes/stats.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// ============================================
// GET /api/stats/dashboard/:uid - Get dashboard statistics for a user
// ============================================
router.get('/dashboard/:uid', verifyToken, async (req, res) => {
    try {
        const { uid } = req.params;
        
        if (uid !== req.user.uid) {
            return res.status(403).json({ success: false, error: 'Forbidden: UID mismatch' });
        }
        
        console.log('📊 Fetching dashboard stats for user:', uid);

        // Get user internal UUID
        const userQuery = 'SELECT internal_uuid FROM users WHERE uid = $1';
        const userResult = await pool.query(userQuery, [uid]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const userInternalUuid = userResult.rows[0].internal_uuid;

        // Get diagnosis cases statistics
        const diagnosisStatsQuery = `
      SELECT 
        COUNT(*) as total_diagnosis_cases,
        COUNT(CASE WHEN severity IN ('high', 'critical') THEN 1 END) as high_severity_cases,
        AVG(confidence)::integer as avg_diagnosis_confidence,
        COUNT(CASE WHEN file_url IS NOT NULL THEN 1 END) as cases_with_images,
        MAX(created_at) as last_diagnosis_date
      FROM diagnosis_cases 
      WHERE user_internal_uuid = $1
    `;

        const diagnosisStats = await pool.query(diagnosisStatsQuery, [userInternalUuid]);

        // Get case attempts statistics (from quiz)
        const caseAttemptsStatsQuery = `
      SELECT 
        COUNT(*) as total_quiz_attempts,
        AVG(score)::integer as avg_quiz_score,
        SUM(score) as total_score,
        SUM(total_questions) as total_questions_attempted,
        AVG(time_spent)::integer as avg_time_spent,
        COUNT(DISTINCT case_id) as unique_cases_attempted,
        MAX(completed_at) as last_quiz_date,
        COUNT(CASE WHEN completed_at >= NOW() - INTERVAL '7 days' THEN 1 END) as quizzes_last_7_days,
        COUNT(CASE WHEN score = total_questions THEN 1 END) as perfect_scores
      FROM case_attempts 
      WHERE user_internal_uuid = $1
    `;

        const caseAttemptsStats = await pool.query(caseAttemptsStatsQuery, [userInternalUuid]);

        // Get recent activity (combine diagnosis and quiz attempts)
        const recentActivityQuery = `
      (SELECT 
        'diagnosis' as type,
        created_at as date,
        case_title as title,
        confidence as score,
        severity
      FROM diagnosis_cases 
      WHERE user_internal_uuid = $1)
      
      UNION ALL
      
      (SELECT 
        'quiz' as type,
        completed_at as date,
        rc.title as title,
        score,
        rc.severity
      FROM case_attempts ca
      JOIN random_cases rc ON ca.case_id = rc.id
      WHERE ca.user_internal_uuid = $1)
      
      ORDER BY date DESC
      LIMIT 5
    `;

        const recentActivity = await pool.query(recentActivityQuery, [userInternalUuid]);

        // Get learning streak (consecutive days with activity)
        const streakQuery = `
      WITH daily_activity AS (
        SELECT DISTINCT DATE(created_at) as activity_date
        FROM diagnosis_cases
        WHERE user_internal_uuid = $1
        
        UNION
        
        SELECT DISTINCT DATE(completed_at) as activity_date
        FROM case_attempts
        WHERE user_internal_uuid = $1
      ),
      streak_calc AS (
        SELECT 
          activity_date,
          activity_date - (ROW_NUMBER() OVER (ORDER BY activity_date))::integer as streak_group
        FROM daily_activity
        WHERE activity_date <= CURRENT_DATE
      )
      SELECT 
        COUNT(*) as current_streak
      FROM streak_calc
      WHERE streak_group = (
        SELECT streak_group 
        FROM streak_calc 
        WHERE activity_date = CURRENT_DATE
      )
    `;

        const streakResult = await pool.query(streakQuery, [userInternalUuid]);
        const currentStreak = streakResult.rows[0]?.current_streak || 0;

        // Calculate accuracy rate from quiz attempts
        const accuracyQuery = `
      SELECT 
        CASE 
          WHEN SUM(total_questions) > 0 
          THEN (SUM(score)::float / SUM(total_questions) * 100)::integer
          ELSE 0
        END as accuracy_rate
      FROM case_attempts
      WHERE user_internal_uuid = $1
    `;

        const accuracyResult = await pool.query(accuracyQuery, [userInternalUuid]);
        const accuracyRate = accuracyResult.rows[0]?.accuracy_rate || 0;

        // Get weekly progress for charts
        const weeklyProgressQuery = `
      WITH last_7_days AS (
        SELECT generate_series(
          CURRENT_DATE - 6,
          CURRENT_DATE,
          '1 day'::interval
        )::date as day
      ),
      daily_diagnosis AS (
        SELECT 
          DATE(created_at) as day,
          COUNT(*) as diagnosis_count,
          AVG(confidence)::integer as avg_confidence
        FROM diagnosis_cases
        WHERE user_internal_uuid = $1
          AND created_at >= CURRENT_DATE - 6
        GROUP BY DATE(created_at)
      ),
      daily_quizzes AS (
        SELECT 
          DATE(completed_at) as day,
          COUNT(*) as quiz_count,
          AVG(score)::integer as avg_score
        FROM case_attempts
        WHERE user_internal_uuid = $1
          AND completed_at >= CURRENT_DATE - 6
        GROUP BY DATE(completed_at)
      )
      SELECT 
        ld.day,
        COALESCE(dd.diagnosis_count, 0) as diagnosis_count,
        COALESCE(dd.avg_confidence, 0) as avg_confidence,
        COALESCE(dq.quiz_count, 0) as quiz_count,
        COALESCE(dq.avg_score, 0) as avg_score
      FROM last_7_days ld
      LEFT JOIN daily_diagnosis dd ON ld.day = dd.day
      LEFT JOIN daily_quizzes dq ON ld.day = dq.day
      ORDER BY ld.day
    `;

        const weeklyProgress = await pool.query(weeklyProgressQuery, [userInternalUuid]);

        // Compile all statistics
        const stats = {
            modules: {
                completed: parseInt(diagnosisStats.rows[0].total_diagnosis_cases) || 0,
                inProgress: 0, // This would need a separate table for modules
                total: 12 // You can set this based on your total available modules
            },
            diagnosis: {
                total_cases: parseInt(diagnosisStats.rows[0].total_diagnosis_cases) || 0,
                high_severity: parseInt(diagnosisStats.rows[0].high_severity_cases) || 0,
                avg_confidence: diagnosisStats.rows[0].avg_diagnosis_confidence || 0,
                cases_with_images: parseInt(diagnosisStats.rows[0].cases_with_images) || 0
            },
            quizzes: {
                total_attempts: parseInt(caseAttemptsStats.rows[0].total_quiz_attempts) || 0,
                avg_score: caseAttemptsStats.rows[0].avg_quiz_score || 0,
                total_score: parseInt(caseAttemptsStats.rows[0].total_score) || 0,
                total_questions: parseInt(caseAttemptsStats.rows[0].total_questions_attempted) || 0,
                avg_time_spent: caseAttemptsStats.rows[0].avg_time_spent || 0,
                unique_cases: parseInt(caseAttemptsStats.rows[0].unique_cases_attempted) || 0,
                quizzes_last_7_days: parseInt(caseAttemptsStats.rows[0].quizzes_last_7_days) || 0,
                perfect_scores: parseInt(caseAttemptsStats.rows[0].perfect_scores) || 0
            },
            learning: {
                current_streak: currentStreak,
                accuracy_rate: accuracyRate,
                total_practice_hours: (parseInt(caseAttemptsStats.rows[0].total_questions_attempted || 0) * 2) / 60, // Rough estimate
                last_activity: diagnosisStats.rows[0].last_diagnosis_date || caseAttemptsStats.rows[0].last_quiz_date || null,
                rank: calculateRank(accuracyRate, parseInt(diagnosisStats.rows[0].total_diagnosis_cases) || 0)
            },
            recent_activity: recentActivity.rows,
            weekly_progress: weeklyProgress.rows
        };

        console.log('✅ Dashboard stats compiled:', stats);

        res.status(200).json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('❌ Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Helper function to calculate rank based on performance
function calculateRank(accuracyRate, totalCases) {
    if (accuracyRate >= 90 && totalCases >= 20) return "Top 5%";
    if (accuracyRate >= 80 && totalCases >= 10) return "Top 10%";
    if (accuracyRate >= 70 && totalCases >= 5) return "Top 15%";
    if (accuracyRate >= 60) return "Top 25%";
    return "Top 50%";
}

module.exports = router;