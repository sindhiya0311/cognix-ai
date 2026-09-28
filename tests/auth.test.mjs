// AUTH security contracts: startup secret policy, 401/403 boundaries,
// brute-force rate limiting, registration validation, anti-enumeration.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  startServer,
  stopServer,
  runServerToExit,
  api,
  registerUser,
  createSpace
} from './helpers/server.mjs';

const PORT = 5101;
let server;

before(async () => {
  server = await startServer(PORT);
});

after(async () => {
  await stopServer(server?.proc);
});

test('startup fails when JWT_SECRET is missing entirely', async () => {
  const { code, output } = await runServerToExit({});
  assert.notEqual(code, 0, `expected non-zero exit, got ${code}\n${output}`);
  assert.match(output, /JWT_SECRET/);
});

test('startup fails when JWT_SECRET is empty/whitespace', async () => {
  const { code, output } = await runServerToExit({ JWT_SECRET: '   ' });
  assert.notEqual(code, 0, `expected non-zero exit, got ${code}\n${output}`);
  assert.match(output, /JWT_SECRET/);
});

test('startup fails with the documented default secret', async () => {
  const { code, output } = await runServerToExit({ JWT_SECRET: 'gamelearn_secret_key_mvp_2026' });
  assert.notEqual(code, 0, `expected non-zero exit, got ${code}\n${output}`);
  assert.match(output, /JWT_SECRET/);
  assert.match(output, /default/i);
});

test('server with a valid strong JWT secret boots (health 200)', async () => {
  const res = await api(server.base, '/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
});

test('unauthenticated protected request -> 401', async () => {
  const res = await api(server.base, '/api/spaces');
  assert.equal(res.status, 401);
  assert.equal(res.data.success, false);
});

test('cross-user resource access -> 403 (GET)', async () => {
  const alice = await registerUser(server.base, 'auth.alice');
  const bob = await registerUser(server.base, 'auth.bob');
  const space = await createSpace(server.base, alice.token, 'AuthAliceSpace');

  const res = await api(server.base, `/api/spaces/${space._id}`, { token: bob.token });
  assert.equal(res.status, 403);
  assert.equal(res.data.success, false);
});

test('cross-user resource access -> 403 (DELETE)', async () => {
  const alice = await registerUser(server.base, 'auth.del.a');
  const bob = await registerUser(server.base, 'auth.del.b');
  const space = await createSpace(server.base, alice.token, 'AuthDelSpace');

  const res = await api(server.base, `/api/spaces/${space._id}`, { method: 'DELETE', token: bob.token });
  assert.equal(res.status, 403);
});

test('repeated failed logins for one account -> 429 with Retry-After', async () => {
  const target = `auth.brute.${Date.now().toString(36)}@phase1.test`;
  let saw429 = null;
  for (let attempt = 1; attempt <= 12; attempt++) {
    const res = await api(server.base, '/api/auth/login', {
      method: 'POST',
      body: { email: target, password: 'WrongPassword!123' }
    });
    if (res.status === 429) {
      saw429 = { attempt, res };
      break;
    }
    assert.equal(res.status, 401, `attempt ${attempt} should be 401, got ${res.status}`);
  }
  assert.ok(saw429, 'expected a 429 within 12 attempts');
  assert.ok(saw429.attempt <= 11, `429 arrived too late (attempt ${saw429.attempt})`);
  const retryAfter = saw429.res.headers.get('retry-after');
  assert.ok(retryAfter && Number(retryAfter) > 0, `Retry-After header missing: ${retryAfter}`);
  assert.equal(saw429.res.data.success, false);
  assert.ok(typeof saw429.res.data.message === 'string' && saw429.res.data.message.length > 0);
});

test('malformed registration is rejected with 400 (bad email / short password)', async () => {
  const badEmail = await api(server.base, '/api/auth/register', {
    method: 'POST',
    body: { name: 'X', email: 'not-an-email', password: 'LongEnoughPass1!' }
  });
  assert.equal(badEmail.status, 400);
  assert.equal(badEmail.data.success, false);

  const shortPassword = await api(server.base, '/api/auth/register', {
    method: 'POST',
    body: { name: 'X', email: `short.${Date.now().toString(36)}@phase1.test`, password: 'abc' }
  });
  assert.equal(shortPassword.status, 400);
  assert.equal(shortPassword.data.success, false);
});

test('login does not reveal whether an account exists', async () => {
  const known = await registerUser(server.base, 'auth.enum');

  const wrongPassword = await api(server.base, '/api/auth/login', {
    method: 'POST',
    body: { email: known.email, password: 'TotallyWrong!999' }
  });
  const unknownAccount = await api(server.base, '/api/auth/login', {
    method: 'POST',
    body: { email: 'nobody.here.ever@phase1.test', password: 'TotallyWrong!999' }
  });

  assert.equal(wrongPassword.status, 401);
  assert.equal(unknownAccount.status, 401);
  assert.equal(wrongPassword.data.message, unknownAccount.data.message,
    'existing and missing accounts must produce identical responses');
});
