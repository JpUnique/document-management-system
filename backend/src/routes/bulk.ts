import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { pool } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { logAudit } from '../utils/audit';

const router = Router();

const bulkIdsSchema = z.object({ ids: z.array(z.string().uuid()).min(1) });
const bulkMoveSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  folder_id: z.string().uuid().nullable(),
});
const bulkUpdateSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  department: z.string().optional().nullable(),
});

// POST /api/bulk/documents/delete
router.post('/documents/delete', authenticate, async (req: Request, res: Response) => {
  const { ids } = bulkIdsSchema.parse(req.body);
  const result = await pool.query(
    `DELETE FROM documents WHERE id = ANY($1::uuid[]) RETURNING file_path`,
    [ids]
  );
  const uploadDir = path.resolve(env.UPLOAD.dir);
  for (const row of result.rows) {
    const fp = path.join(uploadDir, row.file_path);
    if (fs.existsSync(fp)) { try { fs.unlinkSync(fp); } catch { /* ignore */ } }
  }
  await logAudit(req, 'document.bulk_delete', 'document', null, { count: result.rowCount, ids });
  res.json({ success: true, deleted: result.rowCount });
});

// POST /api/bulk/documents/archive
router.post('/documents/archive', authenticate, async (req: Request, res: Response) => {
  const { ids } = bulkIdsSchema.parse(req.body);
  const result = await pool.query(
    `UPDATE documents SET status = 'archived' WHERE id = ANY($1::uuid[])`,
    [ids]
  );
  await logAudit(req, 'document.bulk_archive', 'document', null, { count: result.rowCount });
  res.json({ success: true, archived: result.rowCount });
});

// POST /api/bulk/documents/move
router.post('/documents/move', authenticate, async (req: Request, res: Response) => {
  const { ids, folder_id } = bulkMoveSchema.parse(req.body);
  const result = await pool.query(
    `UPDATE documents SET folder_id = $1 WHERE id = ANY($2::uuid[])`,
    [folder_id, ids]
  );
  await logAudit(req, 'document.bulk_move', 'document', null, { count: result.rowCount, folder_id });
  res.json({ success: true, moved: result.rowCount });
});

// POST /api/bulk/documents/update
router.post('/documents/update', authenticate, async (req: Request, res: Response) => {
  const body = bulkUpdateSchema.parse(req.body);
  const fields: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (body.status !== undefined) { fields.push(`status = $${idx++}`); params.push(body.status); }
  if (body.department !== undefined) { fields.push(`department = $${idx++}`); params.push(body.department); }
  if (!fields.length) throw new AppError(400, 'No fields to update');
  params.push(body.ids);
  const result = await pool.query(
    `UPDATE documents SET ${fields.join(', ')} WHERE id = ANY($${idx}::uuid[])`,
    params
  );
  await logAudit(req, 'document.bulk_update', 'document', null, { count: result.rowCount, ...body });
  res.json({ success: true, updated: result.rowCount });
});

export default router;