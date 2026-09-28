import { callOpenRouter } from './ai/openrouter.service.js';

export async function askNovaMentor(context, query) {
  const novaModel = process.env.AI_MODEL_NOVA || process.env.AI_MODEL_PRIMARY || 'google/gemini-2.0-flash-001';
  const spaceName = context?.learningSpace?.name || 'Learning Space';
  const worldName = context?.world?.name || context?.world?.title || 'Current World';
  const currentTask = context?.currentTask;
  const learner = context?.learner;

  if (query) {
    try {
      const systemPrompt = `You are Nova, the contextual AI learning mentor inside GameLearn AI (Cognix).
CURRENT ACTIVE TASK CONTEXT:
- Learning Space: ${spaceName} (${context?.subject || 'General Subject'})
- Unit / Topic: ${worldName}
- Active Game Type: ${context?.game?.type || 'Activity'} (Difficulty D${context?.game?.difficulty || 1})
- Current Question/Task Prompt: "${currentTask?.prompt || 'N/A'}"
- Available Options: ${currentTask?.options ? JSON.stringify(currentTask.options) : 'N/A'}
- Expected Answer: "${currentTask?.expectedAnswer || 'N/A'}"
- Learner's Selected Answer: "${currentTask?.learnerAnswer || 'None selected yet'}"
- Learner Mastery: ${Math.round((learner?.mastery || 0) * 100)}%
- Learner Accuracy: ${Math.round((learner?.accuracy || 0) * 100)}%
- Struggle Risk: ${learner?.struggleRisk || 'LOW'}
- Detected Misconceptions: ${learner?.misconceptions?.length ? learner.misconceptions.join(', ') : 'None'}

INSTRUCTIONS:
1. Respond concisely (under 70 words).
2. DIRECTLY REFERENCE THE CURRENT ACTIVE QUESTION OR TASK when answering hints, mistakes, or explanations.
3. If the learner asks for a hint, give a constructive clue about the topic concept WITHOUT explicitly spoiling the exact answer.
4. If the learner moves to a new question or world (e.g. JDBC, React, Servlets), immediately reference the NEW active question and topic context.
5. Be encouraging, game-focused, and supportive.`;

      const response = await callOpenRouter({
        systemPrompt,
        userPrompt: query,
        model: novaModel
      });

      if (response) return response.trim();
    } catch (err) {
      console.warn('[Nova AI Service] OpenRouter call failed, using contextual fallback:', err.message);
    }
  }

  // Grounded Contextual Fallback Engine
  const q = (query || '').toLowerCase();

  if ((q.includes('wrong') || q.includes('mistake') || q.includes('why')) && currentTask?.learnerAnswer) {
    return `For "${currentTask.prompt}", you selected "${currentTask.learnerAnswer}". In ${worldName}, "${currentTask.expectedAnswer}" is correct because it directly satisfies the core requirement.`;
  }

  if (q.includes('hint') && currentTask?.prompt) {
    return `Hint for "${currentTask.prompt}": Focus on the core objective of ${worldName} (${spaceName}) rather than secondary options.`;
  }

  if (q.includes('doing') || q.includes('progress') || q.includes('struggling')) {
    return `You are at ${Math.round((learner?.mastery || 0) * 100)}% mastery in ${spaceName} with a ${learner?.struggleRisk || 'LOW'} struggle risk level. Keep building consistency!`;
  }

  if (q.includes('next') || q.includes('why this')) {
    return `For ${worldName}, the adaptive engine selected ${context?.game?.type || 'this activity'} to reinforce your concept recall and accuracy.`;
  }

  return `I'm tracking your learning state in ${worldName} (${spaceName}). ${currentTask?.prompt ? `Current task: "${currentTask.prompt}"` : 'Choose an activity and let\'s level up!'}`;
}
