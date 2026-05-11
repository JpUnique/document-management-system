import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { logAudit } from '../utils/audit';

const router = Router();

const uploadDir = path.resolve(env.UPLOAD.dir);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: env.UPLOAD.maxFileSizeMB * 1024 * 1024 },
});

const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  folder_id: z.string().uuid().optional().nullable(),
  department: z.string().optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  is_starred: z.boolean().optional(),
});

// GET /api/documents
router.get('/', authenticate, async (req: Request, res: Response) => {
  const { folder_id, department, status, starred, search, owner_id } = req.query;
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (folder_id === 'null') conditions.push('d.folder_id IS NULL');
  else if (folder_id) { conditions.push(`d.folder_id = $${idx++}`); params.push(folder_id); }
  if (department) { conditions.push(`d.department = $${idx++}`); params.push(department); }
  if (status) { conditions.push(`d.status = $${idx++}`); params.push(status); }
  if (starred === 'true') conditions.push('d.is_starred = true');
  if (owner_id) { conditions.push(`d.owner_id = $${idx++}`); params.push(owner_id); }
  if (search) {
    conditions.push(`(d.title ILIKE $${idx} OR d.description ILIKE $${idx} OR d.file_name ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query(
    `SELECT d.*, u.name AS owner_name, f.name AS folder_name
     FROM documents d
     LEFT JOIN users u ON d.owner_id = u.id
     LEFT JOIN folders f ON d.folder_id = f.id
     ${where} ORDER BY d.updated_at DESC`,
    params
  );
  res.json({ documents: result.rows });
});

// GET /api/documents/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT d.*, u.name AS owner_name, f.name AS folder_name
     FROM documents d
     LEFT JOIN users u ON d.owner_id = u.id
     LEFT JOIN folders f ON d.folder_id = f.id
     WHERE d.id = $1`,
    [req.params.id]
  );
  if (result.rows.length === 0) throw new AppError(404, 'Document not found');

  await pool.query('UPDATE documents SET last_accessed = NOW() WHERE id = $1', [req.params.id]);
  res.json({ document: result.rows[0] });
});

// POST /api/documents (upload)
router.post('/', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) throw new AppError(400, 'File is required');

  const { title, description, folder_id, department, status } = req.body;
  const result = await pool.query(
    `INSERT INTO documents (title, description, file_name, file_type, file_size, file_path,
                            folder_id, owner_id, department, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      title || req.file.originalname,
      description || null,
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      req.file.filename,
      folder_id || null,
      req.user!.userId,
      department || null,
      status || 'draft',
    ]
  );

  await logAudit(req, 'document.upload', 'document', result.rows[0].id, {
    title: result.rows[0].title,
    size: req.file.size,
  });
  res.status(201).json({ document: result.rows[0] });
});

// GET /api/documents/:id/download
router.get('/:id/download', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    'SELECT file_name, file_path, file_type FROM documents WHERE id = $1',
    [req.params.id]
  );
  if (result.rows.length === 0) throw new AppError(404, 'Document not found');

  const doc = result.rows[0];
  const filePath = path.join(uploadDir, doc.file_path);
  if (!fs.existsSync(filePath)) throw new AppError(404, 'File not found on disk');

  await logAudit(req, 'document.download', 'document', req.params.id);
  res.download(filePath, doc.file_name);
});

// PATCH /api/documents/:id
router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  const body = updateDocumentSchema.parse(req.body);
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
    `UPDATE documents SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  );
  if (result.rows.length === 0) throw new AppError(404, 'Document not found');

  await logAudit(req, 'document.update', 'document', req.params.id, body);
  res.json({ document: result.rows[0] });
});

// DELETE /api/documents/:id
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    'DELETE FROM documents WHERE id = $1 RETURNING file_path',
    [req.params.id]
  );
  if (result.rows.length === 0) throw new AppError(404, 'Document not found');

  const filePath = path.join(uploadDir, result.rows[0].file_path);
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (e) { console.error('[Documents] Failed to delete file:', e); }
  }

  await logAudit(req, 'document.delete', 'document', req.params.id);
  res.json({ success: true });
});

// POST /api/documents/:id/star
router.post('/:id/star', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    'UPDATE documents SET is_starred = NOT is_starred WHERE id = $1 RETURNING is_starred',
    [req.params.id]
  );
  if (result.rows.length === 0) throw new AppError(404, 'Document not found');
  res.json({ is_starred: result.rows[0].is_starred });
});

export default router;