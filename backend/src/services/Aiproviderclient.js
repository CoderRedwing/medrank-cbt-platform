/**
 * AI Provider Client
 *
 * Responsibilities:
 * 1. Route requests to the correct provider
 * 2. Verify provider API keys
 *
 * No provider-specific implementation lives here.
 */

const {
  callGemini,
  streamGemini,
  verifyGeminiKey,
  DEFAULT_MODEL: GEMINI_MODEL,
} = require("./providers/gemini");

const {
  callOpenAI,
  streamOpenAI,
  verifyOpenAIKey,
  DEFAULT_MODEL: OPENAI_MODEL,
} = require("./providers/openai");

const {
  callAnthropic,
  streamAnthropic,
  verifyAnthropicKey,
  DEFAULT_MODEL: ANTHROPIC_MODEL,
} = require("./providers/anthropic");

const PROVIDER_LABELS = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  gemini: "Gemini",
};

const DEFAULT_MODELS = {
  anthropic: ANTHROPIC_MODEL,
  openai: OPENAI_MODEL,
  gemini: GEMINI_MODEL,
};

const CALLERS = {
  anthropic: callAnthropic,
  openai: callOpenAI,
  gemini: callGemini,
};

const STREAMERS = {
  anthropic: streamAnthropic,
  openai: streamOpenAI,
  gemini: streamGemini,
};

const VERIFYERS = {
  anthropic: verifyAnthropicKey,
  openai: verifyOpenAIKey,
  gemini: verifyGeminiKey,
};

// Normalizes whatever a provider throws (a structured {provider,status,message}
// object, or a plain Error) into one shape the SSE layer can rely on.
const normalizeProviderError = (err, provider) => {
  if (err && typeof err === 'object' && 'message' in err) {
    return {
      message: err.message,
      status: err.status || 500,
      isQuotaError: !!err.isQuotaError || err.status === 429,
      provider: err.provider || provider,
    };
  }
  return { message: 'AI request failed.', status: 500, isQuotaError: false, provider };
};

/**
 * Send AI request.
 */
const callAI = async ({
  provider,
  apiKey,
  system,
  messages,
  max_tokens = 1000,
}) => {
  if (!provider) {
    throw new Error("AI provider is required.");
  }

  if (!apiKey) {
    throw new Error(
      `No ${PROVIDER_LABELS[provider] || provider} API key configured.`
    );
  }

  const caller = CALLERS[provider];

  if (!caller) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  return caller({
    apiKey,
    system,
    messages,
    max_tokens,
  });
};

/**
 * Verify API key before saving.
 */
const verifyApiKey = async ({ provider, apiKey }) => {
  if (!provider) {
    throw new Error("Provider is required.");
  }

  if (!apiKey) {
    throw new Error("API key is required.");
  }

  const verifier = VERIFYERS[provider];

  if (!verifier) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  return verifier(apiKey);
};

/**
 * Stream an AI request. Calls onDelta(textChunk) as chunks arrive and
 * resolves with the full concatenated text once the stream ends. Throws a
 * normalized {message,status,isQuotaError,provider} object on failure so
 * callers (SSE handlers) don't need to know each provider's error shape.
 */
const streamAI = async ({ provider, apiKey, system, messages, max_tokens = 1000 }, onDelta) => {
  if (!provider) throw normalizeProviderError(new Error('AI provider is required.'), provider);
  if (!apiKey) throw normalizeProviderError(new Error(`No ${PROVIDER_LABELS[provider] || provider} API key configured.`), provider);

  const streamer = STREAMERS[provider];
  if (!streamer) throw normalizeProviderError(new Error(`Unsupported AI provider: ${provider}`), provider);

  try {
    return await streamer({ apiKey, system, messages, max_tokens }, onDelta);
  } catch (err) {
    throw normalizeProviderError(err, provider);
  }
};

module.exports = {
  callAI,
  streamAI,
  verifyApiKey,
  normalizeProviderError,
  PROVIDER_LABELS,
  DEFAULT_MODELS,
};