/**
 * Gemini Provider
 *
 * Responsibilities:
 * 1. Generate AI responses
 * 2. Verify Gemini API Key
 *
 * Nothing else.
 */

const DEFAULT_MODEL = 'gemini-flash-latest';

/**
 * Send chat request to Gemini.
 */
const callGemini = async ({
  apiKey,
  system,
  messages,
  max_tokens = 1000,
}) => {
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = {
    contents,
    ...(system
      ? {
          systemInstruction: {
            parts: [{ text: system }],
          },
        }
      : {}),
    generationConfig: {
      maxOutputTokens: max_tokens,
      thinkingConfig: { thinkingBudget: 0 }, // disable hidden reasoning so full budget goes to the visible answer
    },
  };

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw {
      provider: 'gemini',
      status: res.status,
      message: isQuotaError(res.status, data)
        ? 'Gemini quota exceeded for this key — wait a bit or switch provider in AI Tutor settings.'
        : (data?.error?.message || 'Gemini request failed.'),
      isQuotaError: isQuotaError(res.status, data),
      raw: data,
    };
  }

  const candidate = data?.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  const text = parts.map((p) => p.text || '').join('');

  // Gemini hit the token cap before finishing — surface this clearly instead
  // of silently returning truncated/empty text that fails JSON parsing upstream.
  if (candidate?.finishReason === 'MAX_TOKENS' && !text.trim()) {
    console.error('[Gemini] Response cut off with no visible text. Raw:', JSON.stringify(data, null, 2));
    throw {
      provider: 'gemini',
      status: 502,
      message: 'Gemini ran out of output tokens before responding — try a smaller question count or switch provider.',
      isQuotaError: false,
      raw: data,
    };
  }

  if (!text.trim()) {
    console.error('[Gemini] Empty response. Raw:', JSON.stringify(data, null, 2));
  }

  return text;
};

/**
 * Verify Gemini API Key.
 *
 * Uses the lightweight Models API.
 * No AI generation is performed.
 */
const verifyGeminiKey = async (apiKey) => {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );

  const data = await res.json();

  if (!res.ok) {
    throw {
      provider: 'gemini',
      status: res.status,
      message: data?.error?.message || 'Gemini API verification failed.',
      raw: data,
    };
  }

  return true;
};

// Gemini signals rate/quota limits as HTTP 429 with error.status
// 'RESOURCE_EXHAUSTED' (free-tier per-minute/per-day caps are common here).
const isQuotaError = (status, data) =>
  status === 429 || data?.error?.status === 'RESOURCE_EXHAUSTED';

/**
 * Stream a chat request to Gemini (SSE via streamGenerateContent). Calls
 * onDelta(text) for every text chunk as it arrives; resolves with the
 * full text once done.
 */
const streamGemini = async ({ apiKey, system, messages, max_tokens = 1000 }, onDelta) => {
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = {
    contents,
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    generationConfig: {
        maxOutputTokens: max_tokens,
        thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let data = {};
    try { data = await res.json(); } catch { /* body wasn't JSON */ }
    throw {
      provider: 'gemini',
      status: res.status,
      message: isQuotaError(res.status, data)
        ? 'Gemini quota exceeded for this key — wait a bit or switch provider in AI Tutor settings.'
        : (data?.error?.message || 'Gemini request failed.'),
      isQuotaError: isQuotaError(res.status, data),
      raw: data,
    };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload) continue;
      try {
        const json = JSON.parse(payload);
        // A quota/error can also arrive mid-stream as its own SSE event
        if (json.error) {
          throw {
            provider: 'gemini',
            status: json.error.code || 500,
            message: isQuotaError(json.error.code, { error: json.error })
              ? 'Gemini quota exceeded for this key — wait a bit or switch provider in AI Tutor settings.'
              : (json.error.message || 'Gemini request failed.'),
            isQuotaError: isQuotaError(json.error.code, { error: json.error }),
            raw: json,
          };
        }
        const parts = json?.candidates?.[0]?.content?.parts || [];
        const delta = parts.map((p) => p.text || '').join('');
        if (delta) {
          full += delta;
          onDelta(delta);
        }
      } catch (e) {
        if (e?.provider === 'gemini') throw e; // rethrow our own structured error
        // otherwise ignore malformed SSE fragment
      }
    }
  }

  return full;
};

module.exports = {
  DEFAULT_MODEL,
  callGemini,
  streamGemini,
  verifyGeminiKey,
  isQuotaError,
};