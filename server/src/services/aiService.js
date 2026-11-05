import Project from "../models/Project.js";
import ApiError from "../utils/ApiError.js";
import environment from "../config/environment.js";
import logger from "../utils/logger.js";
import {
  buildTaskGenerationPrompt,
  createTaskGenerationRequestSchema,
  sanitizeGeneratedTasks,
  taskSuggestionListSchema,
} from "../validators/aiValidators.js";
import { createGroqProvider } from "./aiProviders/groqProvider.js";
import {
  classifyProviderFailure,
  isProviderFailure,
} from "./aiProviders/providerErrors.js";



const defaultGroqProvider = createGroqProvider({
  apiKey: environment.groqApiKey,
  model: environment.groqModel,
});

export const ALLOWED_GROQ_MODELS = Object.freeze([
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
]);

export const isAllowedGroqModel = (model) =>
  typeof model === "string" &&
  ALLOWED_GROQ_MODELS.includes(model.trim());

export const logAiProviderConfiguration = ({
  config = environment,
  provider = defaultGroqProvider,
  log = logger,
} = {}) => {
  let reasonCode = "provider_ready";
  if (!provider) reasonCode = "provider_not_configured";
  else if (!config.groqEnabled) reasonCode = "provider_disabled";
  else if (!config.groqApiKey?.trim()) reasonCode = "missing_api_key";
  else if (!isAllowedGroqModel(config.groqModel))
    reasonCode = "model_not_allowlisted";

  log.info("AI provider configuration loaded", {
    provider: "groq",
    model: config.groqModel,
    reasonCode,
  });
};

export const createAiService = ({
  provider = defaultGroqProvider,
  config = environment,
  projectLookup = (workspaceId, projectId) =>
    Project.findOne({ _id: projectId, workspaceId }),
  log = logger,
} = {}) => ({
  generateTaskSuggestions: async ({
    workspaceId,
    projectId,
    goal,
    taskCount,
  }) => {
    const inputResult = createTaskGenerationRequestSchema.safeParse({
      workspaceId,
      projectId,
      goal,
      taskCount,
    });
    if (!inputResult.success) {
      throw new ApiError(
        400,
        inputResult.error.issues[0]?.message ||
        "Invalid AI task generation payload",
      );
    }

    const validatedInput = inputResult.data;
    const project = await projectLookup(
      validatedInput.workspaceId,
      validatedInput.projectId,
    );
    if (!project) throw new ApiError(404, "Project not found");

    if (
      !config.groqEnabled ||
      !config.groqApiKey?.trim() ||
      !provider
    ) {
      throw new ApiError(
        503,
        "AI generation is not configured. Add an enabled groq API key in the server environment.",
      );
    }
    if (!isAllowedGroqModel(config.groqModel)) {
      log.error("AI provider configuration rejected", {
        provider: "groq",
        reasonCode: "model_not_allowlisted",
      });
      throw new ApiError(
        503,
        "Groq model configuration is invalid. Only Groq models are supported.",
      );
    }

    const prompt = buildTaskGenerationPrompt({
      goal: validatedInput.goal,
      taskCount: validatedInput.taskCount,
    });

    try {
      log.info("AI provider attempt", {
        provider: "groq",
        reasonCode: "attempt_started",
      });
      const result = await provider.generateTaskSuggestions({
        prompt,
        timeoutMs: config.aiProviderTimeoutMs || 20000,
      });
      const rawText = typeof result?.text === "string" ? result.text.trim() : "";
      if (!rawText)
        throw new ApiError(502, "The AI model returned an empty response.");

      let payload;
      try {
        payload = JSON.parse(rawText);
      } catch {
        log.error("AI provider returned invalid JSON", {
          provider: "groq",
          reasonCode: "invalid_json_output",
        });
        throw new ApiError(
          502,
          "Task suggestions could not be generated because the AI response was invalid.",
        );
      }

      const normalized = sanitizeGeneratedTasks(payload);
      const parsedOutput = taskSuggestionListSchema.safeParse(normalized);
      if (!parsedOutput.success) {
        log.error("AI provider response failed schema validation", {
          provider: "groq",
          reasonCode: "invalid_schema_output",
        });
        throw new ApiError(
          502,
          "Task suggestions could not be generated because the AI response was invalid.",
        );
      }

      log.info("AI provider succeeded", {
        provider: "groq",
        reasonCode: "success",
      });
      return parsedOutput.data.tasks;
    } catch (error) {
      if (error instanceof ApiError) throw error;

      const failure = isProviderFailure(error)
        ? error
        : classifyProviderFailure("groq", {
          message: error?.message || "",
          cause: error,
        });
      log.error("AI provider request failed", {
        provider: "groq",
        reasonCode: failure.reasonCode,
      });

      if (failure.reasonCode === "invalid_credentials") {
        throw new ApiError(
          503,
          "Groq API credentials are invalid. Check the server configuration.",
        );
      }
      if (failure.reasonCode === "quota_exhausted") {
        throw new ApiError(
          503,
          "Groq API quota is unavailable. Check the server configuration.",
        );
      }
      if (failure.fallbackEligible) {
        throw new ApiError(
          503,
          "Groq is temporarily unavailable. Please try again later.",
        );
      }
      throw new ApiError(
        502,
        "Task suggestions could not be generated right now. Please try again.",
      );
    }
  },
});

const aiService = createAiService();
export const generateTaskSuggestions = aiService.generateTaskSuggestions;
export default aiService;
