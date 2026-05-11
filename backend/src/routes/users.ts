import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../db/pool';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logAudit } from '../utils/audit';

const router = Router();

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['admin', 'editor', 'viewer']),
  department: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['admin', 'editor', 'viewer']).optional(),
  department: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  avatar_url: z.string().optional().nullable(),
});

// GET /api/users - list all users (with optional filters)
router.get('/', authenticate, async (req: Request, res: Response) => {
  const { department, role, status, search } = req.query;
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (department) { conditions.push(`department = $${idx++}`); params.push(department); }
  if (role) { conditions.push(`role = $${idx++}`); params.push(role); }
  if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
  if (search) {
    conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query(
    `SELECT id, email, name, role, department, avatar_url, status, last_login, created_at, updated_at
     FROM users ${where} ORDER BY created_at DESC`,
    params
  );
  res.json({ users: result.rows });
});

// GET /api/users/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT id, email, name, role, department, avatar_url, status, last_login, created_at
     FROM users WHERE id = $1`,
    [req.params.id]
  );
  if (result.rows.length === 0) throw new AppError(404, 'User not found');
  res.json({ user: result.rows[0] });
});

// POST /api/users - admin only
router.post('/', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  const body = createUserSchema.parse(req.body);
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [body.email]);
  if (existing.rows.length > 0) throw new AppError(409, 'Email already exists');

  const passwordHash = await bcrypt.hash(body.password, 10);
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, name, role, department)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, name, role, department, status, created_at`,
    [body.email, passwordHash, body.name, body.role, body.department || null]
  );

  await logAudit(req, 'user.create', 'user', result.rows[0].id, { email: body.email });
  res.status(201).json({ user: result.rows[0] });
});

// PATCH /api/users/:id - admin only
router.patch('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  const body = updateUserSchema.parse(req.body);
  const fields: string[] = [];
  const params: any[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined) {
      fields.push(`${key} = $${idx++}`);
      params.push(value);
    }
  }
  if (fields.length === 0) throw new AppError(400, 'No fields to update');

  params.push(req.params.id);
  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
     RETURNING id, email, name, role, department, avatar_url, status, updated_at`,
    params
  );
  if (result.rows.length === 0) throw new AppError(404, 'User not found');

  await logAudit(req, 'user.update', 'user', req.params.id, body);
  res.json({ user: result.rows[0] });
});

// DELETE /api/users/:id - admin only
router.delete('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  if (req.params.id === req.user!.userId) {
    throw new AppError(400, 'Cannot delete your own account');
  }
  const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
  if (result.rows.length === 0) throw new AppError(404, 'User not found');

  await logAudit(req, 'user.delete', 'user', req.params.id);
  res.json({ success: true });
});

// POST /api/users/:id/reset-password - admin only
router.post('/:id/reset-password', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  const { password } = z.object({ password: z.string().min(6) }).parse(req.body);
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id',
    [passwordHash, req.params.id]
  );
  if (result.rows.length === 0) throw new AppError(404, 'User not found');

  await logAudit(req, 'user.reset_password', 'user', req.params.id);
  res.json({ success: true });
});

// GET /api/users/stats/departments
router.get('/stats/departments', authenticate, async (_req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT department, COUNT(*)::int as user_count
     FROM users WHERE department IS NOT NULL
     GROUP BY department ORDER BY user_count DESC`
  );
  res.json({ departments: result.rows });
});

export default router;