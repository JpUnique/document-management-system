/**
 * Smoke test: verifies backend is responsive and core endpoints work.
 * Run: npx ts-node src/scripts/smoke-test.ts
 */
import { env } from '../config/env';

const BASE = `http://localhost:${env.PORT}`;
const API = `${BASE}${env.API_PREFIX}`;

async function main() {
  let passed = 0;
  let failed = 0;
  const fail = (msg: string) => { console.error(`❌ ${msg}`); failed++; };
  const ok = (msg: string) => { console.log(`✅ ${msg}`); passed++; };

  // 1. Health check
  try {
    const r = await fetch(`${BASE}/health`);
    if (r.ok) ok('Health endpoint responding'); else fail(`Health returned ${r.status}`);
  } catch (e) { fail(`Health endpoint unreachable: ${(e as Error).message}`); }

  // 2. Login with seeded admin
  let accessToken = '';
  try {
    const r = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: env.ADMIN.email, password: env.ADMIN.password }),
    });
    if (r.ok) {
      const data = (await r.json()) as { accessToken: string };
      accessToken = data.accessToken;
      ok(`Admin login (token=${accessToken.slice(0, 20)}...)`);
    } else {
      fail(`Admin login failed: ${r.status}`);
    }
  } catch (e) { fail(`Login error: ${(e as Error).message}`); }

  if (!accessToken) {
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  }

  const auth = { Authorization: `Bearer ${accessToken}` };

  // 3. Me
  try {
    const r = await fetch(`${API}/auth/me`, { headers: auth });
    if (r.ok) ok('GET /auth/me'); else fail(`me returned ${r.status}`);
  } catch (e) { fail(`/me error: ${(e as Error).message}`); }

  // 4. Users list
  try {
    const r = await fetch(`${API}/users`, { headers: auth });
    if (r.ok) ok('GET /users'); else fail(`users returned ${r.status}`);
  } catch (e) { fail(`/users error: ${(e as Error).message}`); }

  // 5. Dashboard stats
  try {
    const r = await fetch(`${API}/stats/dashboard`, { headers: auth });
    if (r.ok) ok('GET /stats/dashboard'); else fail(`stats returned ${r.status}`);
  } catch (e) { fail(`/stats error: ${(e as Error).message}`); }

  // 6. Folders list
  try {
    const r = await fetch(`${API}/folders`, { headers: auth });
    if (r.ok) ok('GET /folders'); else fail(`folders returned ${r.status}`);
  } catch (e) { fail(`/folders error: ${(e as Error).message}`); }

  // 7. Tags list
  try {
    const r = await fetch(`${API}/tags`, { headers: auth });
    if (r.ok) ok('GET /tags'); else fail(`tags returned ${r.status}`);
  } catch (e) { fail(`/tags error: ${(e as Error).message}`); }

  // 8. Audit logs
  try {
    const r = await fetch(`${API}/audit`, { headers: auth });
    if (r.ok) ok('GET /audit'); else fail(`audit returned ${r.status}`);
  } catch (e) { fail(`/audit error: ${(e as Error).message}`); }

  console.log(`\n🧪 Smoke test: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();