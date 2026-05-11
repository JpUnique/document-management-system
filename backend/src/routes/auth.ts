import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../db/pool';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['admin', 'editor', 'viewer']).optional().default('viewer'),
  department: z.string().optional(),
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const body = registerSchema.parse(req.body);
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [body.email]);
  if (existing.rows.length > 0) {
    throw new AppError(409, 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(body.password, 10);
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, name, role, department)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, name, role, department, status, created_at`,
    [body.email, passwordHash, body.name, body.role, body.department || null]
  );

  await logAudit(req, 'user.register', 'user', result.rows[0].id, { email: body.email });
  res.status(201).json({ user: result.rows[0] });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const result = await pool.query(
    `SELECT id, email, password_hash, name, role, department, status, avatar_url
     FROM users WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new AppError(401, 'Invalid credentials');
  }

  const user = result.rows[0];
  if (user.status !== 'active') {
    throw new AppError(403, 'Account is inactive or suspended');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new AppError(401, 'Invalid credentials');
  }

  await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await logAudit(req, 'user.login', 'user', user.id, { email });

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      avatar_url: user.avatar_url,
    },
  });
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError(400, 'Refresh token required');

  try {
    const payload = verifyRefreshToken(refreshToken);
    const newAccessToken = signAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });
    res.json({ accessToken: newAccessToken });
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token');
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  await logAudit(req, 'user.logout', 'user', req.user!.userId);
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT id, email, name, role, department, avatar_url, status, last_login, created_at
     FROM users WHERE id = $1`,
    [req.user!.userId]
  );
  if (result.rows.length === 0) throw new AppError(404, 'User not found');
  res.json({ user: result.rows[0] });
});

export default router;