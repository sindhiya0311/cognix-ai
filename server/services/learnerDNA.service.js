import { calculateStruggleRisk } from './struggle.service.js';
import { detectMisconception } from './misconception.service.js';

export function calculateLearnerDNA(worlds) {
  const allAttempts = (worlds || []).flatMap(w => w.history || []);
  const attempts = allAttempts.length;
  const errors = allAttempts.filter(x => !x.correct).length;
  const accuracy = attempts ? (attempts - errors) / attempts : 0;
  const mastery = worlds && worlds.length ? worlds.reduce((a, x) => a + (x.mastery || 0), 0) / worlds.length : 0;
  const avgTime = attempts ? allAttempts.reduce((a, x) => a + (x.seconds || 0), 0) / attempts : 0;

  // Preferred game computation
  const counts = {};
  allAttempts.forEach(x => {
    if (x.game) counts[x.game] = (counts[x.game] || 0) + 1;
  });
  const preferredGame = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'quiz';

  // Struggle risk and misconceptions across worlds
  let highestRisk = 'LOW';
  const misconceptions = [];

  (worlds || []).forEach(w => {
    const risk = calculateStruggleRisk(w.history);
    if (risk.level === 'HIGH') highestRisk = 'HIGH';
    else if (risk.level === 'MEDIUM' && highestRisk !== 'HIGH') highestRisk = 'MEDIUM';

    const mis = detectMisconception(w.history);
    if (mis && !misconceptions.includes(mis)) {
      misconceptions.push(mis);
    }
  });

  return {
    mastery,
    accuracy,
    avgTime,
    attempts,
    errors,
    preferredGame,
    struggleRisk: highestRisk,
    misconceptions
  };
}
