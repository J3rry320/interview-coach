import "dotenv/config";
import Groq from "groq-sdk";
import { Agent, setGlobalDispatcher } from "undici";
import { loadConfig } from "../utils/config.js";

// Set default global fetch timeouts to 5 minutes
setGlobalDispatcher(new Agent({
  headersTimeout: 5 * 60 * 1000, // 5 minutes
  bodyTimeout: 5 * 60 * 1000,    // 5 minutes
}));

// Helper to clean markdown JSON wrapper (useful for Anthropic and small local models)
function cleanJsonString(rawText) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();

  // If there is conversational text before/after JSON, extract the JSON object
  if (!cleaned.startsWith("{")) {
    const startIndex = cleaned.indexOf("{");
    const endIndex = cleaned.lastIndexOf("}");
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      cleaned = cleaned.substring(startIndex, endIndex + 1);
    }
  }
  return cleaned;
}

// Call Anthropic Messages API
async function callAnthropic({ system, user, apiKey, model, temperature, timeoutMs }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    dispatcher: new Agent({
      headersTimeout: timeoutMs,
      bodyTimeout: timeoutMs,
    }),
    body: JSON.stringify({
      model: model || "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature,
      system,
      messages: [
        {
          role: "user",
          content: user + "\n\nReturn ONLY a valid JSON object. Do not wrap in markdown code blocks. Do not add any conversational text before or after the JSON.",
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  const textContent = result.content?.[0]?.text || "{}";
  return cleanJsonString(textContent);
}

// Call OpenAI-Compatible API (OpenAI, Ollama, Custom)
async function callOpenAICompatible({
  baseUrl,
  apiKey,
  model,
  system,
  user,
  temperature,
  useJsonMode = true,
  timeoutMs,
}) {
  const headers = {
    "content-type": "application/json",
  };
  if (apiKey) {
    headers["authorization"] = `Bearer ${apiKey}`;
  }

  const body = {
    model,
    temperature,
    messages: [
      { role: "system", content: system },
      { role: "user", content: roleWrapper(user, useJsonMode) },
    ],
  };

  if (useJsonMode) {
    body.response_format = { type: "json_object" };
  }

  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
  const response = await fetch(`${cleanBaseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    dispatcher: new Agent({
      headersTimeout: timeoutMs,
      bodyTimeout: timeoutMs,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content || "{}";
  return cleanJsonString(content);
}

// Helper to inject JSON enforcement instructions if not using native JSON mode or as fallback
function roleWrapper(userPrompt, useJsonMode) {
  if (useJsonMode) return userPrompt;
  return userPrompt + "\n\nReturn ONLY a valid JSON object. Do not wrap in markdown code blocks. Do not add any conversational text before or after the JSON.";
}

export async function generateStructuredOutput({
  system,
  user,
  temperature = 0.7,
}) {
  const config = await loadConfig();

  let provider = config?.provider || "groq";

  // Auto-detect provider if default is groq but no Groq key exists, while other keys are set
  if (provider === "groq" && !config?.apiKey && !process.env.GROQ_API_KEY) {
    if (process.env.OPENAI_API_KEY) {
      provider = "openai";
    } else if (process.env.ANTHROPIC_API_KEY) {
      provider = "anthropic";
    }
  }

  const model = config?.model || (
    provider === "groq" ? "llama-3.3-70b-versatile" :
    provider === "openai" ? "gpt-4o-mini" :
    provider === "anthropic" ? "claude-3-5-sonnet-20241022" :
    provider === "ollama" ? "llama3.2" :
    ""
  );

  const apiKey = config?.apiKey || (
    provider === "groq" ? process.env.GROQ_API_KEY :
    provider === "openai" ? process.env.OPENAI_API_KEY :
    provider === "anthropic" ? process.env.ANTHROPIC_API_KEY :
    ""
  );

  const baseUrl = config?.baseUrl || (
    provider === "openai" ? (process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE || "") :
    provider === "ollama" ? (process.env.OLLAMA_BASE_URL || process.env.OLLAMA_HOST || "") :
    provider === "groq" ? (process.env.GROQ_BASE_URL || "") :
    provider === "anthropic" ? (process.env.ANTHROPIC_BASE_URL || "") :
    provider === "custom" ? (process.env.CUSTOM_BASE_URL || "") :
    ""
  );

  const requestTimeout = config?.requestTimeout || 5;
  const timeoutMs = requestTimeout * 60 * 1000;

  if (provider === "groq") {
    const key = apiKey || process.env.GROQ_API_KEY;
    if (!key) {
      throw new Error("Missing Groq API Key. Set GROQ_API_KEY env variable or run 'interview-coach configure'.");
    }
    const client = new Groq({ apiKey: key, timeout: timeoutMs });
    const completion = await client.chat.completions.create({
      model: model || "llama-3.3-70b-versatile",
      temperature,
      response_format: {
        type: "json_object",
      },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    return JSON.parse(cleanJsonString(completion.choices[0]?.message?.content || "{}"));
  }

  if (provider === "openai") {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error("Missing OpenAI API Key. Set OPENAI_API_KEY env variable or run 'interview-coach configure'.");
    }
    const url = baseUrl || "https://api.openai.com/v1";
    const responseText = await callOpenAICompatible({
      baseUrl: url,
      apiKey: key,
      model: model || "gpt-4o-mini",
      system,
      user,
      temperature,
      useJsonMode: config.useJsonMode !== false,
      timeoutMs,
    });
    return JSON.parse(responseText);
  }

  if (provider === "anthropic") {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error("Missing Anthropic API Key. Set ANTHROPIC_API_KEY env variable or run 'interview-coach configure'.");
    }
    const responseText = await callAnthropic({
      system,
      user,
      apiKey: key,
      model: model || "claude-3-5-sonnet-20241022",
      temperature,
      timeoutMs,
    });
    return JSON.parse(responseText);
  }

  if (provider === "ollama") {
    const url = baseUrl || "http://localhost:11434/v1";
    const responseText = await callOpenAICompatible({
      baseUrl: url,
      apiKey: "",
      model: model || "llama3.2",
      system,
      user,
      temperature,
      useJsonMode: config.useJsonMode !== false,
      timeoutMs,
    });
    return JSON.parse(responseText);
  }

  if (provider === "custom") {
    if (!baseUrl) {
      throw new Error("Missing Custom Base URL. Run 'interview-coach configure'.");
    }
    const responseText = await callOpenAICompatible({
      baseUrl,
      apiKey,
      model,
      system,
      user,
      temperature,
      useJsonMode: config.useJsonMode !== false,
      timeoutMs,
    });
    return JSON.parse(responseText);
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
