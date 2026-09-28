export async function callOpenRouter({ systemPrompt, userPrompt, model, temperature = 0.7 }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

  const primaryModel = model || process.env.AI_MODEL_PRIMARY || 'google/gemini-2.0-flash-001';
  const fallbackModel = process.env.AI_MODEL_FALLBACK || 'openai/gpt-4o-mini';

  if (apiKey) {
    try {
      const response = await fetchOpenRouterAPI(baseUrl, apiKey, primaryModel, systemPrompt, userPrompt, temperature);
      if (response) return response;
    } catch (err) {
      console.warn(`[OpenRouter Warning] Primary model ${primaryModel} failed: ${err.message}. Retrying with fallback model ${fallbackModel}...`);
    }

    try {
      const fallbackResponse = await fetchOpenRouterAPI(baseUrl, apiKey, fallbackModel, systemPrompt, userPrompt, temperature);
      if (fallbackResponse) return fallbackResponse;
    } catch (err) {
      console.warn(`[OpenRouter Warning] Fallback model ${fallbackModel} failed: ${err.message}.`);
    }
  }

  // Fallback to legacy Gemini API key if available
  const legacyGeminiKey = process.env.GEMINI_API_KEY;
  if (legacyGeminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${legacyGeminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
        })
      });
      const data = await res.json();
      const output = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (output) return output;
    } catch (err) {
      console.warn('[AI Gateway Warning] Legacy Gemini API call failed:', err.message);
    }
  }

  return null;
}

async function fetchOpenRouterAPI(baseUrl, apiKey, model, systemPrompt, userPrompt, temperature) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://gamelearn.ai',
        'X-Title': 'GameLearn AI',
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: userPrompt }
        ]
      })
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`OpenRouter HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function callOpenRouterStructured({ systemPrompt, userPrompt, model }) {
  const jsonSystemPrompt = `${systemPrompt || ''}\nIMPORTANT: Respond with valid JSON ONLY. Do not include markdown formatting or extra explanatory text outside the JSON.`;
  const rawText = await callOpenRouter({ systemPrompt: jsonSystemPrompt, userPrompt, model, temperature: 0.3 });
  
  if (!rawText) return null;

  try {
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('[OpenRouter Structured Error] Failed to parse JSON response:', err.message, 'Raw text:', rawText.slice(0, 150));
    return null;
  }
}
