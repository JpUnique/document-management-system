import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
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
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: env.UPLOAD.maxFileSizeMB * 1024 * 1024 } });

// GET /api/documents/:id/versions
router.get('/:id/versions', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT v.*, u.name AS uploaded_by_name FROM document_versions v
     LEFT JOIN users u ON v.uploaded_by = u.id
     WHERE v.document_id = $1 ORDER BY v.version DESC`,
    [req.params.id]
  );
  res.json({ versions: result.rows });
});

// POST /api/documents/:id/versions - upload a new version
router.post('/:id/versions', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) throw new AppError(400, 'File required');

  const doc = await pool.query('SELECT version FROM documents WHERE id = $1', [req.params.id]);
  if (!doc.rows.length) throw new AppError(404, 'Document not found');

  const newVersion = (doc.rows[0].version || 1) + 1;
  const version = await pool.query(
    `INSERT INTO document_versions (document_id, version, file_path, file_size, uploaded_by, change_note)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [req.params.id, newVersion, req.file.filename, req.file.size, req.user!.userId, req.body.change_note || null]
  );

  await pool.query(
    `UPDATE documents SET version = $1, file_path = $2, file_size = $3, file_name = $4, file_type = $5, updated_at = NOW()
     WHERE id = $6`,
    [newVersion, req.file.filename, req.file.size, req.file.originalname, req.file.mimetype, req.params.id]
  );

  await logAudit(req, 'document.version_upload', 'document', req.params.id, { version: newVersion });
  res.status(201).json({ version: version.rows[0] });
});

// GET /api/documents/:id/versions/:versionId/download
router.get('/:id/versions/:versionId/download', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT v.file_path, d.file_name FROM document_versions v
     JOIN documents d ON v.document_id = d.id
     WHERE v.id = $1 AND v.document_id = $2`,
    [req.params.versionId, req.params.id]
  );
  if (!result.rows.length) throw new AppError(404, 'Version not found');

  const filePath = path.join(uploadDir, result.rows[0].file_path);
  if (!fs.existsSync(filePath)) throw new AppError(404, 'File not found on disk');
  await logAudit(req, 'document.version_download', 'document', req.params.id);
  res.download(filePath, result.rows[0].file_name);
});

export default router;