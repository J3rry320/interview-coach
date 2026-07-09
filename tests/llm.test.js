import "./helpers.js";
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import Groq from "groq-sdk";
import { generateStructuredOutput } from "../src/providers/llm.js";
import { saveConfig } from "../src/utils/config.js";
import { setupTmpDir, cleanupTmpDir } from "./helpers.js";

const originalMakeRequest = Groq.prototype.makeRequest;
let mockGroqRequest = null;

const makeMockResponse = (jsonVal) => {
  const response = {
    status: 200,
    headers: {
      get: (name) => {
        if (name.toLowerCase() === "content-type") {
          return "application/json";
        }
        return null;
      }
    },
    json: async () => jsonVal,
    text: async () => JSON.stringify(jsonVal),
    url: "https://api.groq.com/v1/chat/completions"
  };
  return {
    response,
    options: {},
    controller: new AbortController(),
    requestLogID: "log_mock",
    retryOfRequestLogID: undefined,
    startTime: Date.now()
  };
};

describe("llm module", () => {
  let originalFetch = globalThis.fetch;
  let fetchMock = null;

  beforeEach(async () => {
    await setupTmpDir();
    
    // Monkeypatch Groq makeRequest
    Groq.prototype.makeRequest = async function (optionsInput) {
      const options = await optionsInput;
      if (mockGroqRequest) {
        return mockGroqRequest(options);
      }
      return makeMockResponse({ status: "ok" });
    };
    
    // Monkeypatch fetch
    globalThis.fetch = async (url, options) => {
      if (fetchMock) return fetchMock(url, options);
      return { ok: false, statusText: "Unmocked fetch" };
    };
  });

  afterEach(async () => {
    await cleanupTmpDir();
    globalThis.fetch = originalFetch;
    Groq.prototype.makeRequest = originalMakeRequest;
    mockGroqRequest = null;
    fetchMock = null;
  });

  test("uses Groq provider by default and forwards key/params", async () => {
    let calledBody = null;
    mockGroqRequest = async (options) => {
      calledBody = options.body;
      return makeMockResponse({
        choices: [{ message: { content: '{"result": "groq-success"}' } }]
      });
    };

    await saveConfig({
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      apiKey: "gsk-mockkey123"
    });

    const res = await generateStructuredOutput({
      system: "system-p",
      user: "user-p",
      temperature: 0.5
    });

    assert.deepEqual(res, { result: "groq-success" });
    assert.equal(calledBody.model, "llama-3.3-70b-versatile");
    assert.equal(calledBody.temperature, 0.5);
    assert.deepEqual(calledBody.messages, [
      { role: "system", content: "system-p" },
      { role: "user", content: "user-p" }
    ]);
  });

  test("uses OpenAI provider and invokes fetch with authorization header", async () => {
    let fetchUrl = "";
    let fetchBody = null;
    fetchMock = async (url, options) => {
      fetchUrl = url;
      fetchBody = JSON.parse(options.body);
      assert.equal(options.headers["authorization"], "Bearer sk-openai-key");
      return {
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          choices: [{ message: { content: '{"result": "openai-success"}' } }]
        })
      };
    };

    await saveConfig({
      provider: "openai",
      model: "gpt-4o-mini",
      apiKey: "sk-openai-key",
      baseUrl: "https://api.openai.com/v1"
    });

    const res = await generateStructuredOutput({
      system: "system-op",
      user: "user-op",
      temperature: 0.2
    });

    assert.deepEqual(res, { result: "openai-success" });
    assert.equal(fetchUrl, "https://api.openai.com/v1/chat/completions");
    assert.equal(fetchBody.model, "gpt-4o-mini");
    assert.equal(fetchBody.temperature, 0.2);
    assert.deepEqual(fetchBody.response_format, { type: "json_object" });
  });

  test("uses Anthropic provider and maps message structure", async () => {
    let fetchUrl = "";
    let fetchBody = null;
    fetchMock = async (url, options) => {
      fetchUrl = url;
      fetchBody = JSON.parse(options.body);
      assert.equal(options.headers["x-api-key"], "anth-key");
      return {
        ok: true,
        json: async () => ({
          content: [{ text: '{"result": "anthropic-success"}' }]
        })
      };
    };

    await saveConfig({
      provider: "anthropic",
      model: "claude-3-5-sonnet",
      apiKey: "anth-key"
    });

    const res = await generateStructuredOutput({
      system: "system-anth",
      user: "user-anth",
      temperature: 0.1
    });

    assert.deepEqual(res, { result: "anthropic-success" });
    assert.equal(fetchUrl, "https://api.anthropic.com/v1/messages");
    assert.equal(fetchBody.model, "claude-3-5-sonnet");
    assert.equal(fetchBody.system, "system-anth");
    assert.equal(fetchBody.temperature, 0.1);
  });

  test("throws error if API key is missing", async () => {
    const originalGroqKey = process.env.GROQ_API_KEY;
    const originalOpenAIKey = process.env.OPENAI_API_KEY;
    const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    try {
      await saveConfig({ provider: "groq", apiKey: "" });
      await assert.rejects(generateStructuredOutput({ system: "s", user: "u" }), /Missing Groq API Key/);

      await saveConfig({ provider: "openai", apiKey: "" });
      await assert.rejects(generateStructuredOutput({ system: "s", user: "u" }), /Missing OpenAI API Key/);

      await saveConfig({ provider: "anthropic", apiKey: "" });
      await assert.rejects(generateStructuredOutput({ system: "s", user: "u" }), /Missing Anthropic API Key/);
    } finally {
      if (originalGroqKey) process.env.GROQ_API_KEY = originalGroqKey;
      if (originalOpenAIKey) process.env.OPENAI_API_KEY = originalOpenAIKey;
      if (originalAnthropicKey) process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
    }
  });

  test("throws error if API calls fail with bad status", async () => {
    fetchMock = async () => {
      return {
        ok: false,
        statusText: "Internal Server Error",
        text: async () => "Detailed backend crash"
      };
    };

    await saveConfig({ provider: "openai", apiKey: "key" });
    await assert.rejects(generateStructuredOutput({ system: "s", user: "u" }), /API error: Internal Server Error - Detailed backend crash/);

    await saveConfig({ provider: "anthropic", apiKey: "key" });
    await assert.rejects(generateStructuredOutput({ system: "s", user: "u" }), /Anthropic API error: Internal Server Error - Detailed backend crash/);
  });

  test("handles Ollama provider", async () => {
    let fetchUrl = "";
    fetchMock = async (url) => {
      fetchUrl = url;
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"result": "ollama-success"}' } }]
        })
      };
    };

    await saveConfig({ provider: "ollama" });
    const res = await generateStructuredOutput({ system: "s", user: "u" });
    assert.deepEqual(res, { result: "ollama-success" });
    assert.equal(fetchUrl, "http://localhost:11434/v1/chat/completions");
  });

  test("handles Custom provider and errors on missing base URL", async () => {
    let fetchUrl = "";
    fetchMock = async (url) => {
      fetchUrl = url;
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"result": "custom-success"}' } }]
        })
      };
    };

    await saveConfig({ provider: "custom", baseUrl: "" });
    await assert.rejects(generateStructuredOutput({ system: "s", user: "u" }), /Missing Custom Base URL/);

    await saveConfig({ provider: "custom", baseUrl: "https://custom.endpoint" });
    const res = await generateStructuredOutput({ system: "s", user: "u" });
    assert.deepEqual(res, { result: "custom-success" });
    assert.equal(fetchUrl, "https://custom.endpoint/chat/completions");
  });

  test("throws error for unsupported provider", async () => {
    await saveConfig({ provider: "unsupported" });
    await assert.rejects(generateStructuredOutput({ system: "s", user: "u" }), /Unsupported provider/);
  });

  test("cleanJsonString extracts JSON wrapped in conversational text and markdown blocks", async () => {
    fetchMock = async () => {
      return {
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: "```json\n{\n  \"nested\": \"value\"\n}\n```"
            }
          }]
        })
      };
    };
    await saveConfig({ provider: "custom", baseUrl: "https://custom.endpoint" });
    let res = await generateStructuredOutput({ system: "s", user: "u" });
    assert.deepEqual(res, { nested: "value" });

    fetchMock = async () => {
      return {
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: "```\n{\n  \"nested2\": \"value2\"\n}\n```"
            }
          }]
        })
      };
    };
    res = await generateStructuredOutput({ system: "s", user: "u" });
    assert.deepEqual(res, { nested2: "value2" });

    fetchMock = async () => {
      return {
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: "Intro text\n{\n  \"nested3\": \"value3\"\n}\nOutro text"
            }
          }]
        })
      };
    };
    res = await generateStructuredOutput({ system: "s", user: "u" });
    assert.deepEqual(res, { nested3: "value3" });
  });

  test("supports useJsonMode=false when config overrides it", async () => {
    let fetchBody = null;
    fetchMock = async (url, options) => {
      fetchBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '{"result": "non-json-success"}'
            }
          }]
        })
      };
    };

    await saveConfig({
      provider: "custom",
      baseUrl: "https://custom.endpoint",
      useJsonMode: false
    });

    const res = await generateStructuredOutput({ system: "s", user: "u" });
    assert.deepEqual(res, { result: "non-json-success" });
    assert.equal(fetchBody.response_format, undefined);
    assert.match(fetchBody.messages[1].content, /Return ONLY a valid JSON object/);
  });
});
