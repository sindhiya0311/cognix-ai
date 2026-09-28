export function checkProgression(worlds) {
  if (!worlds || !worlds.length) return worlds;

  let previousMastered = true; // First world is always unlocked
  return worlds.map((world, index) => {
    const isUnlocked = index === 0 || previousMastered;
    const isMastered = (world.mastery || 0) >= 0.72;
    previousMastered = (world.mastery || 0) >= 0.70;

    let status = 'LOCKED';
    if (isMastered) status = 'MASTERED';
    else if (isUnlocked) status = 'OPEN';

    return {
      ...world,
      unlocked: isUnlocked,
      completed: isMastered,
      status
    };
  });
}
