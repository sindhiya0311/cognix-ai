// Regression suite for the shared adaptive engine (port of the verified
// Phase 0.5 verification script — 19 checks, same file client and server import).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  signalsForWorld,
  decideNextActivity,
  applyGameResult,
  misconception
} from '../src/shared/domain/adaptive.js';

test('signals: accuracy from history', () => {
  const sig = signalsForWorld({ history: [
    { correct: true, seconds: 5 }, { correct: false, seconds: 9 }, { correct: false, seconds: 12 }
  ]});
  assert.equal(sig.attempts, 3);
  assert.ok(Math.abs(sig.accuracy - 1 / 3) < 1e-9, `accuracy=${sig.accuracy}`);
});

test('recovery: low accuracy + repeated errors -> recovery mode, lower difficulty, new modality', () => {
  const weakWorld = { id: 'w1', name: 'Servlets', difficulty: 3, games: ['quiz', 'flashcards'], history: [
    { correct: false, seconds: 15, game: 'quiz' }, { correct: false, seconds: 18, game: 'quiz' }, { correct: false, seconds: 20, game: 'quiz' }
  ]};
  const d = decideNextActivity({}, weakWorld);
  assert.equal(d.mode, 'recovery');
  assert.equal(d.difficulty, 2, 'difficulty must be lowered from 3');
  assert.notEqual(d.game, 'quiz', 'modality must rotate away from quiz');
  assert.ok(typeof d.reason === 'string' && d.reason.length > 10);
});

test('challenge: high accuracy + fast responses -> challenge mode, higher difficulty', () => {
  const strongWorld = { id: 'w2', name: 'Sessions', difficulty: 2, games: ['quiz'], history: [
    { correct: true, seconds: 5, game: 'quiz' }, { correct: true, seconds: 6, game: 'quiz' }, { correct: true, seconds: 4, game: 'quiz' }
  ]};
  const d = decideNextActivity({}, strongWorld);
  assert.equal(d.mode, 'challenge');
  assert.equal(d.difficulty, 3, 'difficulty must be raised from 2');
  assert.ok(d.game === 'speed' || d.game === 'puzzle', `game=${d.game}`);
});

test('guided: single recent miss -> guided mode with rotated modality', () => {
  const missWorld = { id: 'w3', name: 'JDBC', difficulty: 2, games: ['quiz'], history: [
    { correct: true, seconds: 6, game: 'quiz' }, { correct: true, seconds: 5, game: 'quiz' }, { correct: false, seconds: 7, game: 'quiz' }
  ]};
  const d = decideNextActivity({}, missWorld);
  assert.equal(d.mode, 'guided');
  assert.notEqual(d.game, 'quiz');
});

test('baseline: no attempts -> first game in normal mode', () => {
  const freshWorld = { id: 'w4', name: 'XML', difficulty: 1, games: ['quiz', 'puzzle'] };
  const d = decideNextActivity({}, freshWorld);
  assert.equal(d.mode, 'normal');
  assert.equal(d.game, 'quiz');
});

test('boss readiness follows mastery/accuracy/attempts thresholds', () => {
  const bossWorld = { id: 'w5', name: 'React', difficulty: 4, games: ['quiz'], mastery: 0.9, history: [
    ...Array.from({ length: 6 }, () => ({ correct: true, seconds: 5, game: 'quiz' }))
  ]};
  assert.equal(decideNextActivity({}, bossWorld).bossReady, true);
  assert.equal(decideNextActivity({}, { ...bossWorld, mastery: 0.4 }).bossReady, false);
});

test('applyGameResult: correct raises mastery, wrong lowers it', () => {
  const w = { id: 'w6', name: 'Ajax', difficulty: 1, mastery: 0.5, history: [] };
  const before = w.mastery;
  applyGameResult(w, { correct: true, confidence: 0.9, seconds: 5, difficulty: 1, game: 'quiz' });
  assert.ok(w.mastery > before, `${before} -> ${w.mastery}`);
  const mid = w.mastery;
  applyGameResult(w, { correct: false, confidence: 0.4, seconds: 20, difficulty: 1, game: 'quiz' });
  assert.ok(w.mastery < mid, `${mid} -> ${w.mastery}`);
});

test('applyGameResult: history capped at 30 entries', () => {
  const w = { history: [] };
  for (let i = 0; i < 50; i++) {
    applyGameResult(w, { correct: true, confidence: 0.9, seconds: 3, difficulty: 1, game: 'quiz' });
  }
  assert.equal(w.history.length, 30);
});

test('misconception: repeated errors detected, clean world returns null', () => {
  const misWorld = { history: [{ correct: false, game: 'quiz' }, { correct: false, game: 'quiz' }] };
  const found = misconception(misWorld);
  assert.equal(typeof found, 'string');
  assert.ok(found.length > 0);
  assert.equal(misconception({ history: [{ correct: true, game: 'quiz' }] }), null);
});

test('determinism: identical inputs produce identical decisions', () => {
  const weakWorld = { id: 'w1', name: 'Servlets', difficulty: 3, games: ['quiz', 'flashcards'], history: [
    { correct: false, seconds: 15, game: 'quiz' }, { correct: false, seconds: 18, game: 'quiz' }, { correct: false, seconds: 20, game: 'quiz' }
  ]};
  const a = JSON.stringify(decideNextActivity({}, weakWorld));
  const b = JSON.stringify(decideNextActivity({}, weakWorld));
  assert.equal(a, b);
});
