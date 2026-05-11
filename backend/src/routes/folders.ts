import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logAudit } from '../utils/audit';

const router = Router();

const createFolderSchema = z.object({
  name: z.string().min(1),
  parent_id: z.string().uuid().optional().nullable(),
  department: z.string().optional().nullable(),
});

const updateFolderSchema = z.object({
  name: z.string().min(1).optional(),
  parent_id: z.string().uuid().optional().nullable(),
  department: z.string().optional().nullable(),
});

// GET /api/folders
router.get('/', authenticate, async (req: Request, res: Response) => {
  const { parent_id } = req.query;
  let query = `SELECT f.*, u.name AS owner_name,
                      (SELECT COUNT(*)::int FROM documents d WHERE d.folder_id = f.id) AS document_count,
                      (SELECT COUNT(*)::int FROM folders c WHERE c.parent_id = f.id) AS subfolder_count
               FROM folders f
               LEFT JOIN users u ON f.owner_id = u.id`;
  const params: any[] = [];

  if (parent_id === 'null' || parent_id === '') {
    query += ' WHERE f.parent_id IS NULL';
  } else if (parent_id) {
    query += ' WHERE f.parent_id = $1';
    params.push(parent_id);
  }
  query += ' ORDER BY f.name ASC';

  const result = await pool.query(query, params);
  res.json({ folders: result.rows });
});

// GET /api/folders/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT f.*, u.name AS owner_name FROM folders f
     LEFT JOIN users u ON f.owner_id = u.id WHERE f.id = $1`,
    [req.params.id]
  );
  if (result.rows.length === 0) throw new AppError(404, 'Folder not found');
  res.json({ folder: result.rows[0] });
});

// POST /api/folders
router.post('/', authenticate, async (req: Request, res: Response) => {
  const body = createFolderSchema.parse(req.body);
  const result = await pool.query(
    `INSERT INTO folders (name, parent_id, owner_id, department)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [body.name, body.parent_id || null, req.user!.userId, body.department || null]
  );
  await logAudit(req, 'folder.create', 'folder', result.rows[0].id, { name: body.name });
  res.status(201).json({ folder: result.rows[0] });
});

// PATCH /api/folders/:id
router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  const body = updateFolderSchema.parse(req.body);
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
    `UPDATE folders SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  );
  if (result.rows.length === 0) throw new AppError(404, 'Folder not found');

  await logAudit(req, 'folder.update', 'folder', req.params.id, body);
  res.json({ folder: result.rows[0] });
});

// DELETE /api/folders/:id
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query('DELETE FROM folders WHERE id = $1 RETURNING id', [req.params.id]);
  if (result.rows.length === 0) throw new AppError(404, 'Folder not found');

  await logAudit(req, 'folder.delete', 'folder', req.params.id);
  res.json({ success: true });
});

export default router;