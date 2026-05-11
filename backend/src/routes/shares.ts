import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { pool } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { logAudit } from '../utils/audit';

const router = Router();

const createShareSchema = z.object({
  document_id: z.string().uuid(),
  permission: z.enum(['view', 'edit', 'download']).default('view'),
  password: z.string().optional(),
  expires_at: z.string().datetime().optional().nullable(),
});

// POST /api/shares - create a new share link
router.post('/', authenticate, async (req: Request, res: Response) => {
  const body = createShareSchema.parse(req.body);
  const shareToken = crypto.randomBytes(16).toString('hex');
  const passwordHash = body.password ? await bcrypt.hash(body.password, 10) : null;

  const result = await pool.query(
    `INSERT INTO document_shares (document_id, share_token, shared_by, permission, password_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [body.document_id, shareToken, req.user!.userId, body.permission, passwordHash, body.expires_at || null]
  );

  await logAudit(req, 'share.create', 'document', body.document_id, { share_token: shareToken });
  res.status(201).json({ share: result.rows[0] });
});

// GET /api/shares - list shares (for document or user)
router.get('/', authenticate, async (req: Request, res: Response) => {
  const { document_id } = req.query;
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;
  if (document_id) { conditions.push(`document_id = $${idx++}`); params.push(document_id); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await pool.query(
    `SELECT * FROM document_shares ${where} ORDER BY created_at DESC`,
    params
  );
  res.json({ shares: result.rows });
});

// DELETE /api/shares/:id
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query('DELETE FROM document_shares WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows.length) throw new AppError(404, 'Share not found');
  await logAudit(req, 'share.revoke', 'share', req.params.id);
  res.json({ success: true });
});

// GET /api/shares/public/:token - public access (no auth)
router.get('/public/:token', async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.query;

  const shareResult = await pool.query(
    `SELECT s.*, d.title, d.file_name, d.file_type, d.file_size, d.file_path
     FROM document_shares s
     JOIN documents d ON s.document_id = d.id
     WHERE s.share_token = $1`,
    [token]
  );
  if (!shareResult.rows.length) throw new AppError(404, 'Share link not found');

  const share = shareResult.rows[0];
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    throw new AppError(410, 'Share link has expired');
  }

  if (share.password_hash) {
    if (!password || typeof password !== 'string') {
      return res.status(401).json({ error: 'Password required', password_required: true });
    }
    const valid = await bcrypt.compare(password, share.password_hash);
    if (!valid) throw new AppError(401, 'Invalid password');
  }

  await pool.query(
    'UPDATE document_shares SET access_count = access_count + 1 WHERE id = $1',
    [share.id]
  );

  res.json({
    document: {
      title: share.title,
      file_name: share.file_name,
      file_type: share.file_type,
      file_size: share.file_size,
    },
    permission: share.permission,
    download_url: share.permission === 'download' || share.permission === 'edit'
      ? `/api/shares/public/${token}/download${password ? `?password=${encodeURIComponent(password as string)}` : ''}`
      : null,
  });
});

// GET /api/shares/public/:token/download
router.get('/public/:token/download', async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.query;

  const shareResult = await pool.query(
    `SELECT s.*, d.file_name, d.file_path
     FROM document_shares s JOIN documents d ON s.document_id = d.id
     WHERE s.share_token = $1`,
    [token]
  );
  if (!shareResult.rows.length) throw new AppError(404, 'Share link not found');

  const share = shareResult.rows[0];
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    throw new AppError(410, 'Share link has expired');
  }
  if (share.permission === 'view') throw new AppError(403, 'Download not permitted');
  if (share.password_hash) {
    if (!password || typeof password !== 'string') throw new AppError(401, 'Password required');
    const valid = await bcrypt.compare(password, share.password_hash);
    if (!valid) throw new AppError(401, 'Invalid password');
  }

  const filePath = path.join(path.resolve(env.UPLOAD.dir), share.file_path);
  if (!fs.existsSync(filePath)) throw new AppError(404, 'File not found');
  res.download(filePath, share.file_name);
});

export default router;