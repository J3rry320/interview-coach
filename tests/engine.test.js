import "./helpers.js";
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import Groq from "groq-sdk";
import { evaluateAnswer } from "../src/utils/answerEvaluator.js";
import { generateQuestion } from "../src/utils/questionGenerator.js";
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

describe("engine integration (generator and evaluator)", () => {
  beforeEach(async () => {
    await setupTmpDir();
    
    // Monkeypatch Groq makeRequest
    Groq.prototype.makeRequest = async function (optionsInput) {
      const options = await optionsInput;
      if (mockGroqRequest) {
        return mockGroqRequest(options);
      }
      return makeMockResponse({});
    };

    // Configure Groq as default provider
    await saveConfig({
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      apiKey: "gsk-test"
    });
  });

  afterEach(async () => {
    await cleanupTmpDir();
    Groq.prototype.makeRequest = originalMakeRequest;
    mockGroqRequest = null;
  });

  test("generateQuestion calls LLM, builds context, and normalizes output", async () => {
    const mockQuestion = {
      question: "Explain prototypical inheritance.",
      category: "JavaScript",
      difficulty: "medium",
      expectedTopics: ["prototype chain", "__proto__", "Object.create"]
    };

    let calledUserPrompt = "";
    mockGroqRequest = async (options) => {
      calledUserPrompt = options.body.messages[1].content;
      return makeMockResponse({
        choices: [{ message: { content: JSON.stringify(mockQuestion) } }]
      });
    };

    const session = {
      id: "session-123",
      role: "Frontend Engineer",
      level: "mid",
      questions: []
    };

    const result = await generateQuestion(session);
    assert.deepEqual(result, mockQuestion);
    assert.match(calledUserPrompt, /CANDIDATE CONTEXT & HISTORY:/);
    assert.match(calledUserPrompt, /Frontend Engineer/);
  });

  test("evaluateAnswer triggers validation and returns early if answer is invalid", async () => {
    const session = {
      id: "session-123",
      role: "Backend Engineer",
      questions: []
    };

    const result = await evaluateAnswer({
      role: "Backend Engineer",
      question: "What is Node?",
      expectedTopics: ["runtime"],
      answer: "no", // Too short!
      session
    });

    assert.equal(result.score, 0);
    assert.equal(result.verdict, "incorrect");
    assert.match(result.feedback, /Validation Flagged/);
  });

  test("evaluateAnswer calls LLM and normalizes output for valid answer", async () => {
    const mockEval = {
      score: 90,
      verdict: "correct",
      feedback: "Perfect description of Node runtime.",
      strengths: ["clear", "accurate"],
      missingPoints: [],
      idealAnswer: "Node.js is a Chrome V8 JavaScript runtime..."
    };

    mockGroqRequest = async () => {
      return makeMockResponse({
        choices: [{ message: { content: JSON.stringify(mockEval) } }]
      });
    };

    const session = {
      id: "session-123",
      role: "Backend Engineer",
      questions: []
    };

    const result = await evaluateAnswer({
      role: "Backend Engineer",
      question: "What is Node?",
      expectedTopics: ["runtime"],
      answer: "Node.js is a javascript runtime environment built on V8.",
      session
    });

    assert.deepEqual(result, mockEval);
  });
});
