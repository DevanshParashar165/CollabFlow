
import OpenAI from "openai";
import { classifyProviderFailure } from "./providerErrors.js";

export const createGroqProvider = ({
    apiKey,
    model,
    clientFactory = (options) => new OpenAI(options),
}) => {
    const client = apiKey?.trim()
        ? clientFactory({
            apiKey: apiKey.trim(),
            baseURL: "https://api.groq.com/openai/v1",
            maxRetries: 0,
        })
        : null;

    return {
        generateTaskSuggestions: async ({ prompt, timeoutMs }) => {
            if (!client) {
                throw new Error("Groq client is not configured");
            }

            try {
                const response = await client.chat.completions.create(
                    {
                        model,
                        messages: [
                            {
                                role: "system",
                                content: [
                                    "You are CollabFlow's project management assistant.",
                                    "Generate actionable, realistic project tasks.",
                                    "Return valid JSON only.",
                                    "The response must contain a tasks array.",
                                    "Every task must have title, description and priority.",
                                    "Priority must be LOW, MEDIUM, HIGH or URGENT.",
                                    "Do not include Markdown or additional text.",
                                ].join(" "),
                            },
                            {
                                role: "user",
                                content: prompt,
                            },
                        ],
                        temperature: 0.3,
                        max_completion_tokens: 2500,
                        response_format: {
                            type: "json_object",
                        },
                    },
                    {
                        timeout: timeoutMs || 30000,
                        maxRetries: 0,
                    }
                );

                const rawText =
                    response.choices?.[0]?.message?.content?.trim() || "";

                return {
                    text: rawText,
                    model: response.model || model,
                };
            } catch (error) {
                throw classifyProviderFailure("groq", {
                    statusCode: error?.status,
                    code: error?.code,
                    message: error?.message || "",
                    model,
                    cause: error,
                });
            }
        },
    };
};
