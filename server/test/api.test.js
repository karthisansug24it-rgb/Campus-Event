import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5000/api';

test('E2E API Test Suite', async (t) => {
  let studentToken = '';
  let adminToken = '';
  let events = [];

  await t.test('1. Student Login', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'karthisans.ug.24.it@francisxavier.ac.in',
        password: 'Student@123',
        role: 'student'
      })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.user.role, 'student');
    assert.ok(data.data.token);
    studentToken = data.data.token;
  });

  await t.test('2. Admin Login', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@francisxavier.ac.in',
        password: 'Admin@123',
        role: 'admin'
      })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.user.role, 'admin');
    assert.ok(data.data.token);
    adminToken = data.data.token;
  });

  await t.test('3. Fetch Active Campus Events with Posters', async () => {
    const res = await fetch(`${BASE_URL}/events`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data));
    assert.ok(data.data.length > 0);
    events = data.data;

    // Verify posterUrl and fields
    const first = events[0];
    assert.ok(first.title);
    assert.ok(first.poster_url);
    assert.ok(first.reward_points !== undefined);
    assert.ok(first.max_seats > 0);
  });

  await t.test('4. Parse Email API with verification derivation', async () => {
    const res = await fetch(`${BASE_URL}/auth/parse-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rajakumar.ug.23.cse@francisxavier.ac.in'
      })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.valid, true);
    assert.strictEqual(data.data.departmentCode, 'cse');
    assert.strictEqual(data.data.admissionYear, 2023);
  });

  await t.test('5. Admin Stats Telemetry API', async () => {
    const res = await fetch(`${BASE_URL}/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.totalEvents >= 5);
  });

  await t.test('6. Student Requests List (GET /api/my/requests)', async () => {
    const res = await fetch(`${BASE_URL}/my/requests`, {
      headers: {
        'Authorization': `Bearer ${studentToken}`
      }
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data));
  });

  await t.test('7. Student Deadline & Action Alerts (GET /api/my/alerts)', async () => {
    const res = await fetch(`${BASE_URL}/my/alerts`, {
      headers: {
        'Authorization': `Bearer ${studentToken}`
      }
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.missingScreenshots !== undefined);
    assert.ok(data.data.pendingCertificates !== undefined);
    assert.ok(data.data.recentAwards !== undefined);
  });

  await t.test('8. Admin Alerts & Deadlines (GET /api/admin/alerts)', async () => {
    const res = await fetch(`${BASE_URL}/admin/alerts`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(typeof data.data.pendingScreenshots, 'number');
    assert.strictEqual(typeof data.data.pendingCertificates, 'number');
    assert.ok(Array.isArray(data.data.closingSoon));
  });

  await t.test('9. Admin Requests Stage Filtering (GET /api/admin/requests?status=registered)', async () => {
    const res = await fetch(`${BASE_URL}/admin/requests?status=registered`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data));
  });
});
