import { callOpenRouterStructured } from './ai/openrouter.service.js';

/**
 * Generate game content using AI, with a clean generic fallback.
 * 
 * Primary path: calls the AI model via OpenRouter to generate topic-specific content.
 * Fallback path: returns a structurally valid challenge using the world's actual topic/concepts.
 * 
 * The fallback does NOT contain hardcoded domain-specific question banks.
 * It generates structurally correct content using the world metadata (topic name,
 * concepts, unit name) so any subject works — not just web technologies.
 */
export async function generateGameContentAI(world, gameType, difficulty = 1, misconception = null) {
  const topicName = world?.name || 'Topic Concept';
  const unitName = world?.unitName || '';
  const concepts = world?.concepts || [topicName];
  const gameModel = process.env.AI_MODEL_GAME || process.env.AI_MODEL_PRIMARY || 'google/gemini-2.0-flash-001';

  if (world) {
    try {
      const prompt = `Generate a high-quality educational game challenge strictly about "${topicName}" (${unitName}).
Key Concepts: ${concepts.join(', ')}
Game Type: ${gameType}
Difficulty Level: D${difficulty}
${misconception ? `Address Misconception: ${misconception}` : ''}

INSTRUCTIONS:
1. The question and content MUST be 100% specific to "${topicName}". Do NOT generate generic questions.
2. Return ONLY a valid JSON object matching the expected structure for game type "${gameType}":

For "quiz" or "scenario":
{
  "type": "${gameType}",
  "prompt": "Specific challenge question about ${topicName}...",
  "options": ["Option A (Correct)", "Option B", "Option C", "Option D"],
  "answer": "Option A (Correct)",
  "hint": "Specific hint pointing to ${topicName} concept.",
  "explain": "Clear explanation of why this answer is correct."
}

For "flashcards":
{
  "type": "flashcards",
  "front": "Specific question about ${topicName}?",
  "back": "Detailed answer explaining the concept."
}

For "puzzle" or "sequence":
{
  "type": "${gameType}",
  "prompt": "Arrange the execution steps for ${topicName}:",
  "pieces": ["Step 1", "Step 2", "Step 3"],
  "answer": ["Step 1", "Step 2", "Step 3"]
}

For "match":
{
  "type": "match",
  "pairs": [
    ["Term 1", "Meaning 1"],
    ["Term 2", "Meaning 2"],
    ["Term 3", "Meaning 3"],
    ["Term 4", "Meaning 4"]
  ]
}

For "explore":
{
  "type": "explore",
  "clues": ["Clue 1 about ${topicName}", "Clue 2 about ${topicName}", "Clue 3 about ${topicName}"],
  "answer": "${topicName}"
}

For "speed":
{
  "type": "speed",
  "questions": ["Q1 about ${topicName}?", "Q2 about ${topicName}?", "Q3 about ${topicName}?"],
  "answers": ["A1", "A2", "A3"]
}`;

      const parsed = await callOpenRouterStructured({
        systemPrompt: 'You are an expert subject-matter content generator for interactive learning games.',
        userPrompt: prompt,
        model: gameModel
      });

      if (parsed?.type && (parsed.prompt || parsed.front || parsed.pairs || parsed.questions)) {
        return parsed;
      }
    } catch (err) {
      console.warn(`[AI Game Generator] AI generation failed for ${topicName}/${gameType}, using structural fallback:`, err.message);
    }
  }

  return generateStructuralFallback(world, gameType, difficulty);
}

/**
 * Generic structural fallback — works for any subject.
 * Uses the world's actual topic name, unit name, and concepts
 * to produce a structurally valid challenge without hardcoded domain content.
 * 
 * This is intentionally generic. The AI path should handle specifics.
 * This fallback exists only to prevent a broken UI when AI is unavailable.
 */
function generateStructuralFallback(world, gameType, difficulty = 1) {
  const name = world?.name || 'Concept';
  const unit = world?.unitName || 'this subject area';
  const concepts = world?.concepts?.length ? world.concepts : [name];
  const c1 = concepts[0] || name;
  const c2 = concepts[1] || `${name} fundamentals`;
  const c3 = concepts[2] || `${name} applications`;

  switch (gameType) {
    case 'quiz':
      return {
        type: 'quiz',
        prompt: `Which of the following best describes the core concept of ${name} within ${unit}?`,
        options: [
          `It defines the standard approach to ${c1}`,
          `It is an unrelated legacy technique`,
          `It only applies to hardware configuration`,
          `It was deprecated and replaced`
        ],
        answer: `It defines the standard approach to ${c1}`,
        hint: `Consider how ${name} relates to ${c1} in the context of ${unit}.`,
        explain: `${name} establishes the foundational approach to ${c1} within ${unit}.`
      };

    case 'scenario':
      return {
        type: 'scenario',
        prompt: `You are working on a project that requires ${name}. Which approach correctly applies the core principles of ${c1}?`,
        options: [
          `Apply ${c1} according to its specification in ${unit}`,
          `Skip ${name} entirely and use an ad-hoc workaround`,
          `Use an unrelated technology instead`,
          `Ignore the requirements and hardcode values`
        ],
        answer: `Apply ${c1} according to its specification in ${unit}`,
        hint: `Focus on the established methodology for ${name}.`,
        explain: `Correctly applying ${c1} according to ${name}'s specification ensures reliability and maintainability.`
      };

    case 'flashcards':
      return {
        type: 'flashcards',
        front: `What is the primary purpose of ${name} in the context of ${unit}?`,
        back: `${name} provides the standard framework for implementing ${c1}. It establishes the rules and patterns used when working with ${c2} in ${unit}.`
      };

    case 'puzzle':
    case 'sequence':
      return {
        type: gameType,
        prompt: `Arrange these steps in the correct order when working with ${name}:`,
        pieces: [
          `Understand the ${c1} requirements`,
          `Implement the ${name} solution`,
          `Verify the output meets the ${unit} specification`
        ],
        answer: [
          `Understand the ${c1} requirements`,
          `Implement the ${name} solution`,
          `Verify the output meets the ${unit} specification`
        ]
      };

    case 'match':
      return {
        type: 'match',
        pairs: [
          [name, `Primary concept in ${unit}`],
          [c1, `Core component of ${name}`],
          [c2, `Supporting principle`],
          [c3, `Practical use case`]
        ]
      };

    case 'explore':
      return {
        type: 'explore',
        clues: [
          `This concept is a key part of ${unit}`,
          `It directly relates to ${c1}`,
          `It is essential for understanding ${c2}`
        ],
        answer: name.toLowerCase()
      };

    case 'speed':
      return {
        type: 'speed',
        questions: [
          `Is ${name} part of ${unit}?`,
          `Does ${c1} relate to ${name}?`,
          `Is ${c2} a concept within ${name}?`
        ],
        answers: ['yes', 'yes', 'yes']
      };

    default:
      return {
        type: 'quiz',
        prompt: `What is the key objective of ${name}?`,
        options: [
          `Understanding and applying ${c1}`,
          `Ignoring input parameters`,
          `Avoiding the topic entirely`,
          `Using an unrelated approach`
        ],
        answer: `Understanding and applying ${c1}`,
        hint: `Think about the core purpose of ${name}.`,
        explain: `The key objective of ${name} is understanding and correctly applying ${c1} within ${unit}.`
      };
  }
}
