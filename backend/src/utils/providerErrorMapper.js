/**
 * Normalize provider-specific errors into one common format.
 */

function mapProviderError(error) {
  const provider = error.provider || "unknown";
  const status = error.status || 500;
  const message = (error.message || "").toLowerCase();

  const raw = error.raw || {};
  const providerStatus = raw?.error?.status || "";

  // =====================================================
  // Invalid API Key
  // =====================================================
  if (
    status === 401 ||
    providerStatus === "UNAUTHENTICATED" ||
    message.includes("invalid api key") ||
    message.includes("incorrect api key") ||
    message.includes("authentication") ||
    message.includes("unauthorized") ||
    message.includes("api key not valid")
  ) {
    return {
      success: false,
      code: "INVALID_API_KEY",
      provider,
      status,
      message: "The API key you entered is invalid.",
    };
  }

  // =====================================================
  // Permission
  // =====================================================
  if (
    status === 403 ||
    providerStatus === "PERMISSION_DENIED" ||
    message.includes("permission") ||
    message.includes("forbidden")
  ) {
    return {
      success: false,
      code: "PERMISSION_DENIED",
      provider,
      status,
      message:
        "This API key doesn't have permission to access the requested model.",
    };
  }

  // =====================================================
  // Quota / Billing
  // =====================================================
  if (
    providerStatus === "RESOURCE_EXHAUSTED" ||
    message.includes("quota") ||
    message.includes("billing") ||
    message.includes("billing details") ||
    message.includes("credit") ||
    message.includes("free tier") ||
    message.includes("resource_exhausted") ||
    message.includes("exceeded your current quota") ||
    message.includes("insufficient balance") ||
    message.includes("daily limit")
  ) {
    return {
      success: false,
      code: "QUOTA_EXCEEDED",
      provider,
      status,
      message:
        "Your API quota has been exceeded. Please check your billing or upgrade your plan.",
    };
  }

  // =====================================================
  // Rate Limit
  // =====================================================
  if (
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("retry in")
  ) {
    return {
      success: false,
      code: "RATE_LIMIT",
      provider,
      status,
      message:
        "Rate limit exceeded. Please wait a few seconds and try again.",
    };
  }

  // =====================================================
  // Model Not Available
  // =====================================================
  if (
    providerStatus === "NOT_FOUND" ||
    (
      message.includes("model") &&
      (
        message.includes("not found") ||
        message.includes("unsupported") ||
        message.includes("does not exist") ||
        message.includes("not available")
      )
    )
  ) {
    return {
      success: false,
      code: "MODEL_NOT_AVAILABLE",
      provider,
      status,
      message:
        "The selected AI model is unavailable or unsupported.",
    };
  }

  // =====================================================
  // Network
  // =====================================================
  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("fetch failed") ||
    message.includes("timeout") ||
    message.includes("socket") ||
    message.includes("econnreset") ||
    message.includes("enotfound")
  ) {
    return {
      success: false,
      code: "NETWORK_ERROR",
      provider,
      status,
      message:
        "Unable to connect to the AI provider. Please try again later.",
    };
  }

  // =====================================================
  // Provider Internal Error
  // =====================================================
  if (status >= 500) {
    return {
      success: false,
      code: "PROVIDER_ERROR",
      provider,
      status,
      message:
        "The AI provider is temporarily unavailable. Please try again later.",
    };
  }

  // =====================================================
  // Unknown
  // =====================================================
  return {
    success: false,
    code: "UNKNOWN_ERROR",
    provider,
    status,
    message:
      error.message ||
      "An unexpected AI provider error occurred.",
  };
}

module.exports = {
  mapProviderError,
};