/**
 * Centralized environment configuration.
 * Validates and exposes environment variables with safe development defaults.
 */
const environment = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/collabflow',
  jwtSecret: process.env.JWT_SECRET || 'collabflow-default-development-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
  geminiEnabled: process.env.GEMINI_ENABLED !== 'false',
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
  groqEnabled: process.env.GROQ_ENABLED !== "false",
  aiProviderTimeoutMs: Math.min(60000, Math.max(1000, Number.parseInt(process.env.AI_PROVIDER_TIMEOUT_MS, 10) || 20000)),
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

export { environment };
export default environment;
