// LEARNING SPACE contracts: owner updates of allowed fields work, ownership
// and privileged fields cannot be modified, cross-user writes are 403.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, stopServer, api, registerUser, createSpace } from './helpers/server.mjs';

const PORT = 5102;
let server;
let owner;
let intruder;
let space;

before(async () => {
  server = await startServer(PORT);
  owner = await registerUser(server.base, 'space.owner');
  intruder = await registerUser(server.base, 'space.intruder');
  space = await createSpace(server.base, owner.token, 'MassAssignSpace');
});

after(async () => {
  await stopServer(server?.proc);
});

test('owner can update allowed fields (name/subject/description)', async () => {
  const res = await api(server.base, `/api/spaces/${space._id}`, {
    method: 'PUT',
    token: owner.token,
    body: { name: 'Renamed Space', subject: 'Physics', description: 'updated' }
  });
  assert.equal(res.status, 200);
  assert.equal(res.data.data.name, 'Renamed Space');
  assert.equal(res.data.data.subject, 'Physics');
  assert.equal(res.data.data.description, 'updated');
});

test('owner cannot change owner/userId — rejected with 400 and value unchanged', async () => {
  const res = await api(server.base, `/api/spaces/${space._id}`, {
    method: 'PUT',
    token: owner.token,
    body: { name: 'Still Mine', userId: intruder.user._id }
  });
  assert.equal(res.status, 400);
  assert.equal(res.data.success, false);
  assert.match(res.data.message, /not allowed/i);

  const check = await api(server.base, `/api/spaces/${space._id}`, { token: owner.token });
  assert.equal(check.status, 200);
  assert.equal(String(check.data.data.userId), String(owner.user._id));
  assert.equal(check.data.data.name, 'Renamed Space', 'rejected update must not partially apply');
});

test('privileged fields (xp/level/streak/counters) are rejected, not applied', async () => {
  const before = await api(server.base, `/api/spaces/${space._id}`, { token: owner.token });
  const baselineXp = before.data.data.xp ?? 0;
  const baselineLevel = before.data.data.level ?? 1;

  const res = await api(server.base, `/api/spaces/${space._id}`, {
    method: 'PUT',
    token: owner.token,
    body: { xp: 999999, level: 99, streak: 999, gamesCompleted: 9999 }
  });
  assert.equal(res.status, 400);

  const after = await api(server.base, `/api/spaces/${space._id}`, { token: owner.token });
  assert.equal(after.data.data.xp ?? 0, baselineXp);
  assert.equal(after.data.data.level ?? 1, baselineLevel);
});

test('cross-user update -> 403 and nothing changes', async () => {
  const res = await api(server.base, `/api/spaces/${space._id}`, {
    method: 'PUT',
    token: intruder.token,
    body: { name: 'Hijacked' }
  });
  assert.equal(res.status, 403);

  const check = await api(server.base, `/api/spaces/${space._id}`, { token: owner.token });
  assert.notEqual(check.data.data.name, 'Hijacked');
});

test('anonymous update -> 401', async () => {
  const res = await api(server.base, `/api/spaces/${space._id}`, {
    method: 'PUT',
    body: { name: 'Anon Rename' }
  });
  assert.equal(res.status, 401);
});

test('oversized/malformed field values are rejected with 400', async () => {
  const notAString = await api(server.base, `/api/spaces/${space._id}`, {
    method: 'PUT',
    token: owner.token,
    body: { name: { $ne: null } }
  });
  assert.equal(notAString.status, 400);

  const tooLong = await api(server.base, `/api/spaces/${space._id}`, {
    method: 'PUT',
    token: owner.token,
    body: { name: 'x'.repeat(500) }
  });
  assert.equal(tooLong.status, 400);
});
