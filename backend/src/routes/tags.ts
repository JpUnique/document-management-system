import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const tagSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#3B82F6'),
});

router.get('/', authenticate, async (_req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM tags ORDER BY name ASC');
  res.json({ tags: result.rows });
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  const body = tagSchema.parse(req.body);
  try {
    const result = await pool.query(
      'INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING *',
      [body.name, body.color]
    );
    res.status(201).json({ tag: result.rows[0] });
  } catch (err: any) {
    if (err.code === '23505') throw new AppError(409, 'Tag name already exists');
    throw err;
  }
});

router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  const body = tagSchema.partial().parse(req.body);
  const fields: string[] = [];
  const params: any[] = [];
  let idx = 1;
  for (const [k, v] of Object.entries(body)) {
    if (v !== undefined) { fields.push(`${k} = $${idx++}`); params.push(v); }
  }
  if (!fields.length) throw new AppError(400, 'No fields');
  params.push(req.params.id);
  const result = await pool.query(
    `UPDATE tags SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  );
  if (!result.rows.length) throw new AppError(404, 'Tag not found');
  res.json({ tag: result.rows[0] });
});

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query('DELETE FROM tags WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows.length) throw new AppError(404, 'Tag not found');
  res.json({ success: true });
});

// Attach/detach tag to/from document
router.post('/documents/:docId/:tagId', authenticate, async (req: Request, res: Response) => {
  await pool.query(
    'INSERT INTO document_tags (document_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [req.params.docId, req.params.tagId]
  );
  res.json({ success: true });
});

router.delete('/documents/:docId/:tagId', authenticate, async (req: Request, res: Response) => {
  await pool.query(
    'DELETE FROM document_tags WHERE document_id = $1 AND tag_id = $2',
    [req.params.docId, req.params.tagId]
  );
  res.json({ success: true });
});

router.get('/documents/:docId', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT t.* FROM tags t
     JOIN document_tags dt ON dt.tag_id = t.id
     WHERE dt.document_id = $1 ORDER BY t.name`,
    [req.params.docId]
  );
  res.json({ tags: result.rows });
});

export default router;