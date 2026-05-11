import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
  const { user_id, resource_type, resource_id, action, limit = '100' } = req.query;
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (user_id) { conditions.push(`al.user_id = $${idx++}`); params.push(user_id); }
  if (resource_type) { conditions.push(`al.resource_type = $${idx++}`); params.push(resource_type); }
  if (resource_id) { conditions.push(`al.resource_id = $${idx++}`); params.push(resource_id); }
  if (action) { conditions.push(`al.action = $${idx++}`); params.push(action); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(parseInt(limit as string, 10));

  const result = await pool.query(
    `SELECT al.*, u.name AS user_name, u.email AS user_email
     FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     ${where} ORDER BY al.created_at DESC LIMIT $${idx}`,
    params
  );
  res.json({ logs: result.rows });
});

router.delete('/', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  const { before } = req.query;
  if (before) {
    await pool.query('DELETE FROM audit_logs WHERE created_at < $1', [before]);
  } else {
    await pool.query('TRUNCATE audit_logs');
  }
  res.json({ success: true });
});

export default router;