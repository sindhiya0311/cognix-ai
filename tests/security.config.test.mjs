// Unit tests for the Phase 1 security policy module (no server needed).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findJwtSecretDefect,
  JWT_SECRET_MIN_LENGTH,
  JWT_SECRET_FORBIDDEN,
  RATE_LIMITS,
  SPACE_MUTABLE_FIELDS,
  ATTEMPT_ALLOWED_FIELDS,
  GAME_TYPES,
  ATTEMPT_BOUNDS
} from '../server/config/security.config.js';

test('JWT secret: missing/empty/whitespace are rejected', () => {
  assert.ok(findJwtSecretDefect(undefined));
  assert.ok(findJwtSecretDefect(null));
  assert.ok(findJwtSecretDefect(''));
  assert.ok(findJwtSecretDefect('    '));
});

test('JWT secret: documented default is rejected', () => {
  for (const forbidden of JWT_SECRET_FORBIDDEN) {
    assert.ok(findJwtSecretDefect(forbidden), `must reject ${forbidden}`);
    assert.ok(findJwtSecretDefect(forbidden.toUpperCase()), `must reject ${forbidden} (case-insensitive)`);
  }
});

test('JWT secret: short secrets are rejected', () => {
  assert.ok(findJwtSecretDefect('a'.repeat(JWT_SECRET_MIN_LENGTH - 1)));
});

test('JWT secret: placeholders are rejected even when long enough', () => {
  assert.ok(findJwtSecretDefect('changeme-0123456789-0123456789-012345'));
  assert.ok(findJwtSecretDefect('your-secret-value-0123456789abcdefghij'));
});

test('JWT secret: a strong random secret is accepted', () => {
  assert.equal(findJwtSecretDefect('xK9ZmvT2pQ7zL4wR8nB1yJ6cH3sD5fG0aE2uI4oP7'), null);
  assert.equal(findJwtSecretDefect('a'.repeat(JWT_SECRET_MIN_LENGTH)), null);
});

test('rate limits: auth limits are finite and centralized', () => {
  assert.ok(RATE_LIMITS.loginPerAccount.max >= 3 && RATE_LIMITS.loginPerAccount.max <= 20);
  assert.ok(RATE_LIMITS.loginPerIp.max > RATE_LIMITS.loginPerAccount.max);
  assert.ok(RATE_LIMITS.registerPerIp.max >= 5);
  assert.ok(RATE_LIMITS.nova.max > 0);
});

test('space allowlist excludes ownership/progression/privileged fields', () => {
  for (const forbidden of ['userId', 'owner', 'ownerId', 'xp', 'level', 'streak', 'gamesCompleted', 'lastAction', '_id', 'createdAt']) {
    assert.ok(!SPACE_MUTABLE_FIELDS.includes(forbidden), `must not allow ${forbidden}`);
  }
});

test('attempt allowlist excludes privileged learner state', () => {
  for (const forbidden of ['mastery', 'xp', 'level', 'streak', 'gamesCompleted', 'userId', 'owner', 'bossReady', 'unlocked', 'learnerDNA', 'progression']) {
    assert.ok(!ATTEMPT_ALLOWED_FIELDS.includes(forbidden), `must not allow ${forbidden}`);
  }
});

test('attempt bounds cap XP/mastery influence', () => {
  assert.equal(ATTEMPT_BOUNDS.difficulty.min, 1);
  assert.ok(ATTEMPT_BOUNDS.difficulty.max <= 4);
  assert.deepEqual(ATTEMPT_BOUNDS.confidence, { min: 0, max: 1 });
  assert.ok(ATTEMPT_BOUNDS.seconds.max <= 3600);
});

test('game types cover the eight shipped modalities', () => {
  assert.deepEqual([...GAME_TYPES].sort(), ['explore', 'flashcards', 'match', 'puzzle', 'quiz', 'scenario', 'sequence', 'speed']);
});
