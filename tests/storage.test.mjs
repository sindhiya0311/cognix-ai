// LOCAL STORAGE isolation contracts: per-user cache keys, no cross-account
// inheritance, anonymous safety, legacy key removal, token namespace seeding.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  spacesKey,
  userIdFromToken,
  setActiveUser,
  activeSpacesKey,
  loadSpaces,
  saveSpaces,
  dropLegacyGlobalSpaces
} from '../src/services/v2storage.js';

// Minimal localStorage stand-in for the pure key/namespace logic.
const backing = new Map();
globalThis.localStorage = {
  getItem: key => (backing.has(key) ? backing.get(key) : null),
  setItem: (key, value) => backing.set(key, String(value)),
  removeItem: key => backing.delete(key),
  clear: () => backing.clear()
};

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
const fakeJwt = (payload) => `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}.signature`;

test('keys are namespaced per user and distinct across users', () => {
  const keyA = spacesKey('userA');
  const keyB = spacesKey('userB');
  assert.equal(keyA, 'cognix_v2:userA');
  assert.notEqual(keyA, keyB);
  assert.ok(keyA.startsWith('cognix_v2:'));
});

test('missing/blank user ids resolve to the anonymous namespace', () => {
  assert.equal(spacesKey(null), 'cognix_v2:anon');
  assert.equal(spacesKey(undefined), 'cognix_v2:anon');
  assert.equal(spacesKey(''), 'cognix_v2:anon');
  assert.equal(spacesKey('   '), 'cognix_v2:anon');
  assert.equal(spacesKey(null), spacesKey(undefined));
});

test('user A never sees user B cached state, and anonymous inherits nothing', () => {
  backing.clear();

  setActiveUser('userA');
  saveSpaces([{ id: 'space-of-A' }]);
  setActiveUser('userB');
  saveSpaces([{ id: 'space-of-B' }]);

  setActiveUser('userA');
  assert.deepEqual(loadSpaces(), [{ id: 'space-of-A' }], 'A must load only A data');

  setActiveUser('userB');
  assert.deepEqual(loadSpaces(), [{ id: 'space-of-B' }], 'B must load only B data');

  setActiveUser(null); // anonymous
  assert.equal(loadSpaces(), null, 'anonymous must not inherit any account cache');
  assert.equal(activeSpacesKey(), 'cognix_v2:anon');
});

test('logout-style detach leaves the signed-in user cache intact for them', () => {
  backing.clear();
  setActiveUser('keepUser');
  saveSpaces([{ id: 'keep-me' }]);

  setActiveUser(null); // detach
  saveSpaces([{ id: 'anon-seed' }]); // what the app saves after logout

  setActiveUser('keepUser');
  assert.deepEqual(loadSpaces(), [{ id: 'keep-me' }], 'cache survives detach for the same user');

  setActiveUser(null);
  assert.deepEqual(loadSpaces(), [{ id: 'anon-seed' }], 'anon state stays in anon namespace');
});

test('userIdFromToken decodes our own JWT payload (namespace hint only)', () => {
  assert.equal(userIdFromToken(fakeJwt({ id: 'abc123' })), 'abc123');
  assert.equal(userIdFromToken(fakeJwt({ id: 'user-42', exp: 1 })), 'user-42');
  assert.equal(userIdFromToken(fakeJwt({ noId: true })), null);
  assert.equal(userIdFromToken('garbage'), null);
  assert.equal(userIdFromToken(''), null);
  assert.equal(userIdFromToken(null), null);
  assert.equal(userIdFromToken('a.%%%,sig'), null, 'invalid base64 must not throw');
});

test('legacy global key is dropped and never migrated', () => {
  backing.clear();
  backing.set('cognix_v2', JSON.stringify([{ id: 'legacy-possibly-someone-elses' }]));
  saveSpaces([{ id: 'mine' }]);
  setActiveUser('newUser');
  saveSpaces([{ id: 'newUsers-own' }]);

  dropLegacyGlobalSpaces();

  assert.equal(backing.has('cognix_v2'), false, 'legacy key must be removed');
  assert.deepEqual(loadSpaces(), [{ id: 'newUsers-own' }], 'only namespaced data loads');
});

test('corrupt cache entries never throw and read as null', () => {
  backing.clear();
  backing.set(spacesKey('broken'), '{not json');
  setActiveUser('broken');
  assert.equal(loadSpaces(), null);
});
