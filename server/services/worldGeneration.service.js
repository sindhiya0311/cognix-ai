const GAME_ORDER = ['quiz', 'flashcards', 'puzzle', 'scenario', 'match', 'sequence', 'explore', 'speed'];

export function generateWorldsFromSyllabus(structuredSyllabus, learningSpaceId) {
  const units = structuredSyllabus?.units || [];
  const worlds = [];
  let globalOrder = 0;

  units.forEach((unit, unitIdx) => {
    (unit.topics || []).forEach((topic, topicIdx) => {
      const topicId = topic.id || topic.name.toLowerCase().replace(/\W+/g, '-');
      const isFirst = unitIdx === 0 && topicIdx === 0;

      worlds.push({
        learningSpaceId,
        unitId: unit.id || `u${unitIdx + 1}`,
        unitName: unit.name || `Unit ${unitIdx + 1}`,
        topicId,
        name: topic.name,
        objective: topic.objective || `Build mastery of ${topic.name}.`,
        skills: topic.skills || [topic.name],
        concepts: topic.concepts || [topic.name],
        order: globalOrder++,
        status: isFirst ? 'OPEN' : 'LOCKED',
        mastery: 0,
        requiredMastery: 0.72,
        difficulty: 1,
        unlocked: isFirst,
        completed: false,
        games: GAME_ORDER,
        completedGames: [],
        history: [],
        bossComplete: false
      });
    });
  });

  return worlds;
}
