import bcrypt from 'bcryptjs';
import { pool } from './pool';
import { env } from '../config/env';

async function seed() {
  console.log('[Seed] Starting database seed...');
  try {
    // Seed admin user
    const passwordHash = await bcrypt.hash(env.ADMIN.password, 10);

    await pool.query(
      `INSERT INTO users (email, password_hash, name, role, department, status)
       VALUES ($1, $2, $3, 'admin', 'IT', 'active')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [env.ADMIN.email, passwordHash, env.ADMIN.name]
    );
    console.log(`[Seed] ✅ Admin user created: ${env.ADMIN.email}`);

    // Seed default tags
    const defaultTags = [
      { name: 'Important', color: '#EF4444' },
      { name: 'Urgent', color: '#F59E0B' },
      { name: 'Confidential', color: '#8B5CF6' },
      { name: 'Draft', color: '#6B7280' },
      { name: 'Approved', color: '#10B981' },
    ];

    for (const tag of defaultTags) {
      await pool.query(
        `INSERT INTO tags (name, color) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
        [tag.name, tag.color]
      );
    }
    console.log(`[Seed] ✅ Default tags created`);

    // Seed root folder
    const admin = await pool.query(`SELECT id FROM users WHERE email = $1`, [env.ADMIN.email]);
    if (admin.rows.length > 0) {
      await pool.query(
        `INSERT INTO folders (name, parent_id, owner_id, department)
         VALUES ('Root', NULL, $1, 'IT')
         ON CONFLICT DO NOTHING`,
        [admin.rows[0].id]
      );
      console.log(`[Seed] ✅ Root folder created`);
    }

    console.log('[Seed] ✅ Seed completed successfully');
  } catch (err) {
    console.error('[Seed] ❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();