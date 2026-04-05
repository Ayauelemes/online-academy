// Simple smoke test for the API. Run with: node smoke_test.js
// It will:
// 1) GET /api/students
// 2) POST /api/register with a timestamped email
// 3) POST /api/login with the same credentials

const port = process.env.PORT || '5000';
const base = `http://localhost:${port}`;

async function run() {
  try {
    console.log('1) GET /api/students');
    let res = await fetch(`${base}/api/students`);
    console.log('status:', res.status);
    let json = await res.json();
    console.log('students count:', Array.isArray(json) ? json.length : 'unexpected', '\n');

    const ts = Date.now();
    const testEmail = `smoke_${ts}@example.com`;
    const password = 'smokePass123';

    console.log('2) POST /api/register', testEmail);
    res = await fetch(`${base}/api/register`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email: testEmail, password })
    });
    console.log('status:', res.status);
  json = await res.json().catch(() => ({}));
  console.log('response:', json, '\n');

    console.log('3) POST /api/login', testEmail);
    res = await fetch(`${base}/api/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email: testEmail, password })
    });
    console.log('status:', res.status);
  json = await res.json().catch(() => ({}));
  console.log('response:', json);

  if (res.ok && json.token) console.log('\nSmoke test: SUCCESS — token received');
  else console.log('\nSmoke test: FAILED — no token');
  } catch (err) {
    console.error('Smoke test error:', err);
  }
}

run();
