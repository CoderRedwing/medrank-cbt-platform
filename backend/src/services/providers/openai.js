/**
 * OpenAI Provider
 *
 * Responsibilities:
 * 1. Generate AI responses
 * 2. Verify OpenAI API Key
 */

const DEFAULT_MODEL = "gpt-4o-mini";

/**
 * Send chat request to OpenAI.
 */
const callOpenAI = async ({
  apiKey,
  system,
  messages,
  max_tokens = 1000,
}) => {
  const body = {
    model: DEFAULT_MODEL,
    max_tokens,
    messages: [
      ...(system
        ? [{ role: "system", content: system }]
        : []),
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ],
  };

  const res = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw {
      provider: "openai",
      status: res.status,
      message:
        data?.error?.message ||
        "OpenAI request failed.",
      raw: data,
    };
  }

  return (
    data?.choices?.[0]?.message?.content || ""
  );
};

/**
 * Verify OpenAI API Key.
 *
 * Uses Models endpoint.
 * No AI generation occurs.
 */
const verifyOpenAIKey = async (apiKey) => {
  const res = await fetch(
    "https://api.openai.com/v1/models",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw {
      provider: "openai",
      status: res.status,
      message:
        data?.error?.message ||
        "OpenAI API verification failed.",
      raw: data,
    };
  }

  return true;
};

/**
 * Stream a chat request to OpenAI (SSE). Calls onDelta(text) for every
 * text chunk as it arrives; resolves with the full text once done.
 */
const streamOpenAI = async ({ apiKey, system, messages, max_tokens = 1000 }, onDelta) => {
  const body = {
    model: DEFAULT_MODEL,
    max_tokens,
    stream: true,
    messages: [
      ...(system ? [{ role: "system", content: system }] : []),
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ],
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let data = {};
    try { data = await res.json(); } catch { /* body wasn't JSON */ }
    throw {
      provider: "openai",
      status: res.status,
      message: data?.error?.message || "OpenAI request failed.",
      raw: data,
    };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep the last (possibly incomplete) line for next read

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content || "";
        if (delta) {
          full += delta;
          onDelta(delta);
        }
      } catch {
        // ignore malformed SSE fragment (shouldn't normally happen)
      }
    }
  }

  return full;
};

module.exports = {
  DEFAULT_MODEL,
  callOpenAI,
  streamOpenAI,
  verifyOpenAIKey,
};