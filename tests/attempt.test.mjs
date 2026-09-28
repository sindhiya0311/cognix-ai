// LEARNING EVIDENCE contracts: privileged fields are rejected, bounded
// influence only, cross-user attempts are 403, valid attempts still record.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, stopServer, api, registerUser, createSpace } from './helpers/server.mjs';

const PORT = 5103;
let server;
let owner;
let other;
let space;
let worldId;

const attemptBody = (overrides = {}) => ({
  spaceId: String(space._id),
  worldId,
  game: 'quiz',
  correct: true,
  confidence: 0.9,
  seconds: 12,
  difficulty: 2,
  hintUsed: false,
  id: `t-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6)}`,
  timestamp: Date.now(),
  ...overrides
});

before(async () => {
  server = await startServer(PORT);
  owner = await registerUser(server.base, 'attempt.owner');
  other = await registerUser(server.base, 'attempt.other');
  space = await createSpace(server.base, owner.token, 'AttemptSpace');
  const detail = await api(server.base, `/api/spaces/${space._id}`, { token: owner.token });
  assert.equal(detail.status, 200);
  assert.ok(detail.data.data.worlds?.length > 0, 'space must have worlds');
  worldId = String(detail.data.data.worlds[0]._id);
});

after(async () => {
  await stopServer(server?.proc);
});

test('forged {correct, mastery, xp} payload is rejected with 400 and grants nothing', async () => {
  const before = await api(server.base, `/api/spaces/${space._id}`, { token: owner.token });
  const beforeXp = before.data.data.xp ?? 0;
  const beforeMastery = before.data.data.worlds[0].mastery ?? 0;

  const forged = await api(server.base, '/api/games/attempt', {
    method: 'POST',
    token: owner.token,
    body: attemptBody({ mastery: 1, xp: 999999 })
  });
  assert.equal(forged.status, 400, `expected 400, got ${forged.status}: ${JSON.stringify(forged.data)}`);
  assert.equal(forged.data.success, false);
  assert.match(forged.data.message, /not allowed/i);

  const after = await api(server.base, `/api/spaces/${space._id}`, { token: owner.token });
  assert.equal(after.data.data.xp ?? 0, beforeXp, 'XP must be unchanged');
  assert.equal(after.data.data.worlds[0].mastery ?? 0, beforeMastery, 'mastery must be unchanged');
});

test('privilege-shaped fields (level/streak/bossReady/identity) are rejected', async () => {
  for (const extra of [
    { level: 99 },
    { streak: 999 },
    { bossReady: true },
    { userId: other.user._id },
    { gamesCompleted: 9999 }
  ]) {
    const res = await api(server.base, '/api/games/attempt', {
      method: 'POST',
      token: owner.token,
      body: attemptBody(extra)
    });
    assert.equal(res.status, 400, `expected 400 for ${Object.keys(extra)[0]}, got ${res.status}`);
  }
});

test('out-of-range difficulty/confidence/seconds are rejected (XP inflation blocked)', async () => {
  for (const extra of [
    { difficulty: 999999 },
    { difficulty: 0 },
    { difficulty: 4.5 },
    { confidence: 99 },
    { seconds: 999999 }
  ]) {
    const res = await api(server.base, '/api/games/attempt', {
      method: 'POST',
      token: owner.token,
      body: attemptBody(extra)
    });
    assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(extra)}, got ${res.status}`);
  }
});

test('unknown game type and non-boolean correct are rejected', async () => {
  const badGame = await api(server.base, '/api/games/attempt', {
    method: 'POST',
    token: owner.token,
    body: attemptBody({ game: 'godmode' })
  });
  assert.equal(badGame.status, 400);

  const badCorrect = await api(server.base, '/api/games/attempt', {
    method: 'POST',
    token: owner.token,
    body: attemptBody({ correct: 'always-true' })
  });
  assert.equal(badCorrect.status, 400);
});

test('valid attempt records learning evidence with server-computed state', async () => {
  const res = await api(server.base, '/api/games/attempt', {
    method: 'POST',
    token: owner.token,
    body: attemptBody()
  });
  assert.equal(res.status, 200, `expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
  assert.equal(res.data.success, true);
  assert.ok(res.data.data.learnerDNA, 'server-derived learnerDNA must be returned');
  assert.ok(res.data.data.nextDecision, 'server-derived next decision must be returned');

  const detail = await api(server.base, `/api/spaces/${space._id}`, { token: owner.token });
  const world = detail.data.data.worlds.find(w => String(w._id) === worldId);
  assert.ok(world.history?.length >= 1, 'attempt history must be recorded');
  assert.ok((detail.data.data.xp ?? 0) > 0, 'XP must be granted for a correct attempt');
  assert.ok(world.mastery > 0, 'mastery must move');
  // Bounded influence: one difficulty-2 correct attempt ≤ 40 XP.
  assert.ok((detail.data.data.xp ?? 0) <= 80, 'XP per attempt must stay bounded');
});

test('cross-user attempt -> 403 and target state unchanged', async () => {
  const before = await api(server.base, `/api/spaces/${space._id}`, { token: owner.token });
  const beforeXp = before.data.data.xp ?? 0;

  const res = await api(server.base, '/api/games/attempt', {
    method: 'POST',
    token: other.token,
    body: attemptBody()
  });
  assert.equal(res.status, 403);

  const after = await api(server.base, `/api/spaces/${space._id}`, { token: owner.token });
  assert.equal(after.data.data.xp ?? 0, beforeXp);
});

test('unauthenticated attempt -> 401', async () => {
  const res = await api(server.base, '/api/games/attempt', {
    method: 'POST',
    body: attemptBody()
  });
  assert.equal(res.status, 401);
});
