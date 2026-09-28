export function detectMisconception(worldHistory) {
  const bad = (worldHistory || []).filter(x => !x.correct);
  if (bad.length >= 2) {
    const last = bad[bad.length - 1];
    const game = last?.game;
    if (game === 'sequence') return 'Sequence/order misconception';
    if (game === 'match') return 'Concept relationship misconception';
    return 'Concept application misconception';
  }
  return null;
}
