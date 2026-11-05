
import assert from "node:assert";
import {
  createTaskGenerationRequestSchema,
  taskSuggestionListSchema,
  buildTaskGenerationPrompt,
  sanitizeGeneratedTasks,
} from "../src/validators/aiValidators.js";
import { classifyProviderFailure } from "../src/services/aiProviders/providerErrors.js";

const tests = [];

const test = async (name, fn) => {
  try {
    await fn();
    tests.push([name, true]);
  } catch (error) {
    tests.push([name, false, error]);
  }
};

const validInput = {
  workspaceId: "507f1f77bcf86cd799439011",
  projectId: "507f1f77bcf86cd799439012",
  goal: "Build an authentication system with OAuth and MFA.",
  taskCount: 2,
};

const mockProject = {
  _id: validInput.projectId,
  workspaceId: validInput.workspaceId,
};

const mockConfig = {
  groqApiKey: "test-key",
  groqModel: "openai/gpt-oss-20b",
  groqEnabled: true,
  aiProviderTimeoutMs: 20000,
};

const mockProvider = {
  generateTaskSuggestions: async () => ({
    text: JSON.stringify({
      tasks: [
        {
          title: "Implement OAuth authentication",
          description: "Configure OAuth login and callback handling.",
          priority: "HIGH",
        },
        {
          title: "Build MFA verification",
          description: "Implement OTP-based second-factor verification.",
          priority: "MEDIUM",
        },
      ],
    }),
    model: "openai/gpt-oss-20b",
  }),
};

const mockLogger = {
  info: () => { },
  error: () => { },
  warn: () => { },
};

// Existing validator tests

await test("AI validator rejects missing required fields", () => {
  const result = createTaskGenerationRequestSchema.safeParse({
    workspaceId: validInput.workspaceId,
    projectId: validInput.projectId,
  });

  assert.strictEqual(result.success, false);
});

await test("AI validator accepts valid task generation input", () => {
  const result =
    createTaskGenerationRequestSchema.safeParse(validInput);

  assert.strictEqual(result.success, true);
});

await test("AI validator enforces task counts and goal length", () => {
  const shortGoal = createTaskGenerationRequestSchema.safeParse({
    ...validInput,
    goal: "",
  });

  const outOfRange = createTaskGenerationRequestSchema.safeParse({
    ...validInput,
    goal: "A".repeat(4500),
    taskCount: 11,
  });

  assert.strictEqual(shortGoal.success, false);
  assert.strictEqual(outOfRange.success, false);
});

await test("AI schema validates generated output shape", () => {
  const valid = taskSuggestionListSchema.safeParse({
    tasks: [
      {
        title: "Design authentication flow",
        description: "Create login and protected routes.",
        priority: "HIGH",
      },
      {
        title: "Build appointment scheduling API",
        description: "Add booking endpoints.",
        priority: "MEDIUM",
      },
    ],
  });

  const invalid = taskSuggestionListSchema.safeParse({
    tasks: [
      {
        title: "",
        description: "bad",
        priority: "INVALID",
      },
    ],
  });

  assert.strictEqual(valid.success, true);
  assert.strictEqual(invalid.success, false);
});

await test("AI prompt builder includes goal and task count", () => {
  const prompt = buildTaskGenerationPrompt({
    goal: "Build clinic booking system",
    taskCount: 3,
  });

  assert.match(prompt, /Build clinic booking system/i);
  assert.match(prompt, /3/i);
  assert.match(prompt, /JSON/i);
});

await test("Generated task suggestions are sanitized safely", () => {
  const sanitized = sanitizeGeneratedTasks({
    tasks: [
      {
        title: " Create Auth APIs ",
        description: " add login and signup ",
        priority: "HIGH",
        extra: "should disappear",
      },
      {
        title: "  ",
        description: "duplicate",
        priority: "LOW",
      },
    ],
  });

  assert.strictEqual(sanitized.tasks[0].title, "Create Auth APIs");
  assert.strictEqual(
    sanitized.tasks[0].description,
    "add login and signup"
  );
  assert.strictEqual("extra" in sanitized.tasks[0], false);
  assert.ok(sanitized.tasks.length <= 10);
});

// Groq provider configuration tests

await test("Groq model allowlist accepts supported configured models", async () => {
  const {
    isAllowedGroqModel,
    ALLOWED_GROQ_MODELS,
  } = await import("../src/services/aiService.js");

  assert.ok(ALLOWED_GROQ_MODELS.length > 0);

  assert.strictEqual(
    isAllowedGroqModel("openai/gpt-oss-20b"),
    true
  );

  assert.strictEqual(
    isAllowedGroqModel("openai/gpt-oss-120b"),
    true
  );

  assert.strictEqual(
    isAllowedGroqModel("qwen/qwen3.8-27b"),
    true
  );
});

await test("Groq model allowlist rejects unsupported models", async () => {
  const { isAllowedGroqModel } =
    await import("../src/services/aiService.js");

  assert.strictEqual(
    isAllowedGroqModel("gemini-2.5-flash"),
    false
  );

  assert.strictEqual(
    isAllowedGroqModel("gpt-4o"),
    false
  );

  assert.strictEqual(
    isAllowedGroqModel("claude-3-sonnet"),
    false
  );

  assert.strictEqual(isAllowedGroqModel(""), false);
  assert.strictEqual(isAllowedGroqModel(null), false);
  assert.strictEqual(isAllowedGroqModel(123), false);
});

await test("AI service rejects unsupported Groq models", async () => {
  const { createAiService } =
    await import("../src/services/aiService.js");

  const service = createAiService({
    provider: mockProvider,
    config: {
      ...mockConfig,
      groqModel: "unsupported-model",
    },
    projectLookup: async () => mockProject,
    log: mockLogger,
  });

  await assert.rejects(
    () => service.generateTaskSuggestions(validInput),
    (error) => {
      assert.strictEqual(error.statusCode, 503);
      assert.match(error.message, /Groq model configuration is invalid/i);
      return true;
    }
  );
});

await test("AI service successfully processes suggestions using Groq mock", async () => {
  const { createAiService } =
    await import("../src/services/aiService.js");

  const service = createAiService({
    provider: mockProvider,
    config: mockConfig,
    projectLookup: async () => mockProject,
    log: mockLogger,
  });

  const tasks = await service.generateTaskSuggestions(validInput);

  assert.strictEqual(tasks.length, 2);
  assert.strictEqual(
    tasks[0].title,
    "Implement OAuth authentication"
  );
  assert.strictEqual(tasks[0].priority, "HIGH");
});

// Provider failure classification tests

await test("Groq rate limit is classified as fallback eligible", () => {
  const failure = classifyProviderFailure("groq", {
    statusCode: 429,
    message: "Rate limit exceeded",
  });

  assert.strictEqual(failure.provider, "groq");
  assert.strictEqual(failure.reasonCode, "rate_limited");
  assert.strictEqual(failure.fallbackEligible, true);
});

await test("Groq authentication errors are classified correctly", () => {
  const failure = classifyProviderFailure("groq", {
    statusCode: 401,
    message: "Invalid API key",
  });

  assert.strictEqual(failure.reasonCode, "invalid_credentials");
});

await test("Groq model deprecation is classified correctly", () => {
  const failure = classifyProviderFailure("groq", {
    statusCode: 400,
    code: "model_decommissioned",
    message: "The configured model is unavailable.",
    model: "openai/gpt-oss-20b",
  });

  assert.strictEqual(failure.reasonCode, "model_unavailable");
  assert.strictEqual(failure.fallbackEligible, true);
});

await test("Groq timeout is classified as fallback eligible", () => {
  const failure = classifyProviderFailure("groq", {
    message: "Request timed out",
    cause: { name: "TimeoutError" },
  });

  assert.strictEqual(failure.reasonCode, "timeout");
  assert.strictEqual(failure.fallbackEligible, true);
});

// Test summary

const failed = tests.filter(([, passed]) => !passed);

for (const [name, passed, error] of tests) {
  console.log(
    `  ${passed ? "PASS" : "FAIL"}: ${name}${error ? ` (${error.message})` : ""
    }`
  );
}

console.log(
  `\nAI SUMMARY: ${tests.length - failed.length} passed, ${failed.length} failed`
);

if (failed.length) {
  process.exitCode = 1;
}
