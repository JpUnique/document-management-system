import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/stats/dashboard - aggregated stats for dashboard
router.get('/dashboard', authenticate, async (_req: Request, res: Response) => {
  const [users, documents, folders, storage, recent, byDept, byStatus, byType] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total,
                       COUNT(*) FILTER (WHERE status = 'active')::int AS active
                FROM users`),
    pool.query(`SELECT COUNT(*)::int AS total,
                       COUNT(*) FILTER (WHERE is_starred = true)::int AS starred,
                       COUNT(*) FILTER (WHERE status = 'published')::int AS published,
                       COUNT(*) FILTER (WHERE status = 'draft')::int AS draft,
                       COUNT(*) FILTER (WHERE status = 'archived')::int AS archived
                FROM documents`),
    pool.query(`SELECT COUNT(*)::int AS total FROM folders`),
    pool.query(`SELECT COALESCE(SUM(file_size), 0)::bigint AS total_bytes FROM documents`),
    pool.query(`SELECT d.id, d.title, d.file_type, d.updated_at, u.name AS owner_name
                FROM documents d LEFT JOIN users u ON d.owner_id = u.id
                ORDER BY d.updated_at DESC LIMIT 10`),
    pool.query(`SELECT COALESCE(department, 'Unassigned') AS department, COUNT(*)::int AS count
                FROM documents GROUP BY department ORDER BY count DESC`),
    pool.query(`SELECT status, COUNT(*)::int AS count FROM documents GROUP BY status`),
    pool.query(`SELECT
                  CASE
                    WHEN file_type LIKE 'image/%' THEN 'images'
                    WHEN file_type LIKE 'video/%' THEN 'videos'
                    WHEN file_type LIKE 'audio/%' THEN 'audio'
                    WHEN file_type LIKE 'application/pdf' THEN 'pdf'
                    WHEN file_type LIKE 'application/msword%' OR file_type LIKE '%wordprocessingml%' THEN 'word'
                    WHEN file_type LIKE '%spreadsheetml%' OR file_type LIKE 'application/vnd.ms-excel%' THEN 'excel'
                    ELSE 'other'
                  END AS category,
                  COUNT(*)::int AS count
                FROM documents GROUP BY category ORDER BY count DESC`),
  ]);

  res.json({
    users: users.rows[0],
    documents: documents.rows[0],
    folders: folders.rows[0],
    storage: {
      total_bytes: Number(storage.rows[0].total_bytes),
      total_mb: Math.round(Number(storage.rows[0].total_bytes) / (1024 * 1024) * 100) / 100,
    },
    recent_documents: recent.rows,
    by_department: byDept.rows,
    by_status: byStatus.rows,
    by_type: byType.rows,
  });
});

// GET /api/stats/activity - activity over time (last 30 days)
router.get('/activity', authenticate, async (_req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT DATE(created_at) AS date,
            COUNT(*)::int AS count,
            COUNT(*) FILTER (WHERE action LIKE 'document.%')::int AS document_actions,
            COUNT(*) FILTER (WHERE action LIKE 'user.%')::int AS user_actions
     FROM audit_logs
     WHERE created_at >= NOW() - INTERVAL '30 days'
     GROUP BY DATE(created_at)
     ORDER BY date ASC`
  );
  res.json({ activity: result.rows });
});

export default router;