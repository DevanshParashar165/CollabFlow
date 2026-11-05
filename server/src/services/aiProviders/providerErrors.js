const MODEL_UNAVAILABLE_PATTERN =
  /model.{0,60}(not found|not available|unavailable|does not exist|not supported|decommissioned)/i;

const MODEL_NOT_FOUND_CODES = new Set([
  "model_not_found",
  "model_unavailable",
  "model_decommissioned",
]);

export class ProviderFailure extends Error {
  constructor(
    provider,
    reasonCode,
    { statusCode, fallbackEligible = false, code } = {}
  ) {
    super(`${provider} provider request failed (${reasonCode})`);
    this.name = "ProviderFailure";
    this.provider = provider;
    this.reasonCode = reasonCode;
    this.statusCode = statusCode;
    this.fallbackEligible = fallbackEligible;
    this.code = code;
  }
}

export const isProviderFailure = (error) =>
  error instanceof ProviderFailure;

export const classifyProviderFailure = (
  provider,
  { statusCode, message = "", code = "", model = "", cause } = {}
) => {
  const normalizedMessage = `${code} ${message}`.toLowerCase();
  const normalizedStatus =
    Number.parseInt(String(statusCode || ""), 10) || 0;
  const normalizedCode = String(code).trim().toLowerCase();
  const configuredModel = String(model).trim().toLowerCase();

  if (
    normalizedStatus === 401 ||
    normalizedStatus === 403 ||
    /invalid[_ ]api[_ ]key|authentication|unauthorized|permission denied/.test(
      normalizedMessage
    )
  ) {
    return new ProviderFailure(provider, "invalid_credentials", {
      statusCode: normalizedStatus || undefined,
    });
  }

  if (
    normalizedStatus === 402 ||
    /insufficient credits|payment required|quota exhausted/.test(
      normalizedMessage
    )
  ) {
    return new ProviderFailure(provider, "quota_exhausted", {
      statusCode: normalizedStatus || undefined,
    });
  }

  if (
    normalizedStatus === 429 ||
    /resource_exhausted|rate.?limit|quota.?exceeded|too many requests/.test(
      normalizedMessage
    )
  ) {
    return new ProviderFailure(provider, "rate_limited", {
      statusCode: normalizedStatus || 429,
      fallbackEligible: true,
    });
  }

  if (
    normalizedStatus >= 500 &&
    normalizedStatus <= 599
  ) {
    return new ProviderFailure(provider, "upstream_server_error", {
      statusCode: normalizedStatus,
      fallbackEligible: true,
    });
  }

  const explicitModelUnavailable =
    MODEL_NOT_FOUND_CODES.has(normalizedCode);

  const configuredModelUnavailable =
    configuredModel &&
    normalizedMessage.includes(configuredModel) &&
    MODEL_UNAVAILABLE_PATTERN.test(normalizedMessage);

  if (
    (normalizedStatus === 404 || normalizedStatus === 400) &&
    configuredModel &&
    (explicitModelUnavailable || configuredModelUnavailable)
  ) {
    return new ProviderFailure(provider, "model_unavailable", {
      statusCode: normalizedStatus,
      fallbackEligible: true,
      code: "MODEL_UNAVAILABLE",
    });
  }

  if (normalizedStatus === 404) {
    return new ProviderFailure(provider, "resource_not_found", {
      statusCode: normalizedStatus,
    });
  }

  if (
    cause?.name === "AbortError" ||
    cause?.name === "TimeoutError" ||
    cause?.name === "APIConnectionTimeoutError" ||
    /timed? ?out|deadline exceeded/.test(normalizedMessage)
  ) {
    return new ProviderFailure(provider, "timeout", {
      fallbackEligible: true,
    });
  }

  if (
    cause instanceof TypeError ||
    /fetch failed|network|econnreset|econnrefused|enotfound/.test(
      normalizedMessage
    )
  ) {
    return new ProviderFailure(provider, "network_error", {
      fallbackEligible: true,
    });
  }

  return new ProviderFailure(
    provider,
    normalizedStatus >= 400
      ? "provider_request_rejected"
      : "provider_error",
    { statusCode: normalizedStatus || undefined }
  );
};
