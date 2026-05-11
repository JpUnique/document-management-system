import fs from 'fs';
import path from 'path';
import { pool } from './pool';

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  console.log('[Migrate] Running schema migration...');
  try {
    await pool.query(sql);
    console.log('[Migrate] ✅ Schema migration completed successfully');
  } catch (err) {
    console.error('[Migrate] ❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();