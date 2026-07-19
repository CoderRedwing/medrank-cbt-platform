/**
 * Anthropic Provider
 *
 * Responsibilities:
 * 1. Generate AI responses
 * 2. Verify Anthropic API Key
 */

const Anthropic = require("@anthropic-ai/sdk");

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

/**
 * Send chat request to Anthropic.
 */
const callAnthropic = async ({
  apiKey,
  system,
  messages,
  max_tokens = 1000,
}) => {
  const client = new Anthropic({
    apiKey,
  });

  try {
    const response = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens,
      ...(system ? { system } : {}),
      messages,
    });

    return response.content[0]?.text || "";
  } catch (err) {
    throw {
      provider: "anthropic",
      status: err.status || err.statusCode || 500,
      message: err.message || "Anthropic request failed.",
      raw: err,
    };
  }
};

/**
 * Verify Anthropic API Key.
 *
 * Anthropic doesn't expose a lightweight authentication endpoint,
 * so we perform the smallest possible Messages API request.
 */
const verifyAnthropicKey = async (apiKey) => {
  const client = new Anthropic({
    apiKey,
  });

  try {
    await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1,
      messages: [
        {
          role: "user",
          content: "Hi",
        },
      ],
    });

    return true;
  } catch (err) {
    throw {
      provider: "anthropic",
      status: err.status || err.statusCode || 500,
      message: err.message || "Anthropic API verification failed.",
      raw: err,
    };
  }
};

/**
 * Stream a chat request to Anthropic. Calls onDelta(text) for every text
 * chunk as it arrives; resolves with the full text once the stream ends.
 */
const streamAnthropic = async ({ apiKey, system, messages, max_tokens = 1000 }, onDelta) => {
  const client = new Anthropic({ apiKey });

  try {
    const stream = client.messages.stream({
      model: DEFAULT_MODEL,
      max_tokens,
      ...(system ? { system } : {}),
      messages,
    });

    stream.on('text', (delta) => onDelta(delta));

    const final = await stream.finalMessage();
    return final.content[0]?.text || '';
  } catch (err) {
    throw {
      provider: 'anthropic',
      status: err.status || err.statusCode || 500,
      message: err.message || 'Anthropic request failed.',
      raw: err,
    };
  }
};

module.exports = {
  DEFAULT_MODEL,
  callAnthropic,
  streamAnthropic,
  verifyAnthropicKey,
};