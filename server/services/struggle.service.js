export function calculateStruggleRisk(worldHistory) {
  const history = worldHistory || [];
  if (history.length === 0) return { level: 'LOW', factors: [] };

  const recent = history.slice(-4);
  const errors = history.filter(x => !x.correct).length;
  const consecutiveErrors = recent.slice().reverse().findIndex(x => x.correct !== false);
  const actualConsecutiveErrors = consecutiveErrors === -1 ? recent.length : consecutiveErrors;

  const factors = [];
  let score = 0;

  if (errors >= 2) {
    score += 2;
    factors.push('multiple total errors');
  }
  if (actualConsecutiveErrors >= 2) {
    score += 2;
    factors.push('repeated recent errors');
  } else if (actualConsecutiveErrors === 1) {
    score += 1;
    factors.push('recent miss');
  }

  const avgTime = history.length
    ? history.reduce((a, b) => a + (b.seconds || 0), 0) / history.length
    : 0;

  if (avgTime > 20) {
    score += 1;
    factors.push('high response time');
  }

  const level = score >= 4 ? 'HIGH' : score >= 2 ? 'MEDIUM' : 'LOW';
  return { level, score, factors };
}
