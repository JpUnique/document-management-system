import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { pool } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { logAudit } from '../utils/audit';

const router = Router();

// Soft-delete approach via status='archived' is already supported.
// This route provides true trash using a deleted_at column (added via migration below).

// GET /api/trash - list soft-deleted documents
router.get('/', authenticate, async (_req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT d.*, u.name AS owner_name FROM documents d
     LEFT JOIN users u ON d.owner_id = u.id
     WHERE d.status = 'archived'
     ORDER BY d.updated_at DESC`
  );
  res.json({ documents: result.rows });
});

// POST /api/trash/:id/restore
router.post('/:id/restore', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    `UPDATE documents SET status = 'draft' WHERE id = $1 AND status = 'archived' RETURNING *`,
    [req.params.id]
  );
  if (!result.rows.length) throw new AppError(404, 'Archived document not found');
  await logAudit(req, 'document.restore', 'document', req.params.id);
  res.json({ document: result.rows[0] });
});

// DELETE /api/trash/:id - permanent delete
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    `DELETE FROM documents WHERE id = $1 AND status = 'archived' RETURNING file_path`,
    [req.params.id]
  );
  if (!result.rows.length) throw new AppError(404, 'Archived document not found');
  const filePath = path.join(path.resolve(env.UPLOAD.dir), result.rows[0].file_path);
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (e) { console.error('[Trash] File delete error:', e); }
  }
  await logAudit(req, 'document.purge', 'document', req.params.id);
  res.json({ success: true });
});

// DELETE /api/trash - empty trash
router.delete('/', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    `DELETE FROM documents WHERE status = 'archived' RETURNING file_path`
  );
  const uploadDir = path.resolve(env.UPLOAD.dir);
  for (const row of result.rows) {
    const fp = path.join(uploadDir, row.file_path);
    if (fs.existsSync(fp)) {
      try { fs.unlinkSync(fp); } catch { /* ignore */ }
    }
  }
  await logAudit(req, 'trash.empty', 'system', null, { count: result.rowCount });
  res.json({ success: true, purged: result.rowCount });
});

export default router;