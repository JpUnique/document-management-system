import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logAudit } from '../utils/audit';

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  avatar_url: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(6),
});

// PATCH /api/profile
router.patch('/', authenticate, async (req: Request, res: Response) => {
  const body = updateProfileSchema.parse(req.body);
  const fields: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  for (const [k, v] of Object.entries(body)) {
    if (v !== undefined) { fields.push(`${k} = $${idx++}`); params.push(v); }
  }
  if (!fields.length) throw new AppError(400, 'No fields to update');
  params.push(req.user!.userId);
  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
     RETURNING id, email, name, role, department, avatar_url, status`,
    params
  );
  await logAudit(req, 'profile.update', 'user', req.user!.userId, body);
  res.json({ user: result.rows[0] });
});

// POST /api/profile/change-password
router.post('/change-password', authenticate, async (req: Request, res: Response) => {
  const { current_password, new_password } = changePasswordSchema.parse(req.body);
  const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user!.userId]);
  if (!result.rows.length) throw new AppError(404, 'User not found');

  const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
  if (!valid) throw new AppError(401, 'Current password is incorrect');

  const newHash = await bcrypt.hash(new_password, 10);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user!.userId]);
  await logAudit(req, 'profile.change_password', 'user', req.user!.userId);
  res.json({ success: true });
});

export default router;