import { Request } from 'express';
import { pool } from '../db/pool';

export async function logAudit(
  req: Request,
  action: string,
  resourceType: string,
  resourceId?: string | null,
  details?: Record<string, any>
): Promise<void> {
  try {
    const userId = (req as any).user?.userId || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, resourceType, resourceId || null, details ? JSON.stringify(details) : null, ipAddress, userAgent]
    );
  } catch (err) {
    console.error('[Audit] Failed to log:', err);
  }
}