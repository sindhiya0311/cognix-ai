// NOVA trust-boundary contracts: 401 unauthenticated, 403 cross-user space,
// 400 malformed input, 429 rate limit, identity injected into context ignored.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, stopServer, api, registerUser, createSpace } from './helpers/server.mjs';

const PORT = 5104;
let server;
let owner;
let other;
let space;
let worldId;

before(async () => {
  server = await startServer(PORT);
  owner = await registerUser(server.base, 'nova.owner');
  other = await registerUser(server.base, 'nova.other');
  space = await createSpace(server.base, owner.token, 'NovaSpace');
  const detail = await api(server.base, `/api/spaces/${space._id}`, { token: owner.token });
  worldId = String(detail.data.data.worlds[0]._id);
});

after(async () => {
  await stopServer(server?.proc);
});

const ask = (token, body) => api(server.base, '/api/nova/ask', { method: 'POST', token, body });

test('unauthenticated NOVA request -> 401', async () => {
  const res = await ask(null, { query: 'hello' });
  assert.equal(res.status, 401);
});

test("cross-user learning space reference -> 403 (B cannot use A's space)", async () => {
  const res = await ask(other.token, {
    query: 'what is my mastery?',
    context: { learningSpace: { id: String(space._id), name: 'Stolen Space' } }
  });
  assert.equal(res.status, 403);
  assert.equal(res.data.success, false);
});

test("cross-user world reference -> 403 (B cannot use A's world)", async () => {
  const res = await ask(other.token, {
    query: 'what is this world about?',
    context: { world: { id: worldId, name: 'Stolen World' } }
  });
  assert.equal(res.status, 403);
});

test('unknown learning space reference -> 404', async () => {
  const res = await ask(owner.token, {
    query: 'hello',
    context: { learningSpace: { id: 'aaaaaaaaaaaaaaaaaaaaaaaa' } }
  });
  assert.equal(res.status, 404);
});

test('malformed NOVA requests -> 400', async () => {
  const missingQuery = await ask(owner.token, {});
  assert.equal(missingQuery.status, 400);

  const emptyQuery = await ask(owner.token, { query: '' });
  assert.equal(emptyQuery.status, 400);

  const nonStringQuery = await ask(owner.token, { query: 12345 });
  assert.equal(nonStringQuery.status, 400);

  const overlongQuery = await ask(owner.token, { query: 'x'.repeat(1001) });
  assert.equal(overlongQuery.status, 400);

  const badContext = await ask(owner.token, { query: 'hi', context: 'not-an-object' });
  assert.equal(badContext.status, 400);

  const hugeContext = await ask(owner.token, { query: 'hi', context: { blob: 'x'.repeat(21000) } });
  assert.equal(hugeContext.status, 400);
});

test('owner with own space context gets a normal reply (200)', async () => {
  const res = await ask(owner.token, {
    query: 'give me a hint about variables',
    context: { learningSpace: { id: String(space._id), name: 'NovaSpace' } }
  });
  assert.equal(res.status, 200, `expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
  assert.equal(res.data.success, true);
  assert.ok(typeof res.data.reply === 'string' && res.data.reply.length > 0);
});

test('client-injected identity fields cannot replace the authenticated user', async () => {
  // The server must derive identity from the JWT; the body's userId is ignored.
  const res = await ask(owner.token, {
    query: 'who am I?',
    userId: other.user._id,
    ownerId: other.user._id,
    context: {
      userId: other.user._id,
      learningSpace: { id: String(space._id), name: 'NovaSpace' }
    }
  });
  assert.equal(res.status, 200, `expected 200 for the legitimate owner, got ${res.status}`);
});

test('rate limit: repeated NOVA calls -> 429 with Retry-After', async () => {
  let saw429 = null;
  for (let attempt = 1; attempt <= 25; attempt++) {
    const res = await ask(owner.token, { query: `rate probe ${attempt}` });
    if (res.status === 429) {
      saw429 = { attempt, res };
      break;
    }
    assert.ok(res.status === 200 || res.status === 400 || res.status === 403 || res.status === 404,
      `unexpected status ${res.status} before rate limit`);
  }
  assert.ok(saw429, 'expected a 429 within 25 attempts');
  const retryAfter = saw429.res.headers.get('retry-after');
  assert.ok(retryAfter && Number(retryAfter) > 0, `Retry-After header missing: ${retryAfter}`);
  assert.equal(saw429.res.data.success, false);
});
