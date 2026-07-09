import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { normalizeQuestion, normalizeEvaluation } from "../src/utils/normalize.js";

describe("normalizeQuestion", () => {
  test("handles null or undefined input", () => {
    const result = normalizeQuestion(null);
    assert.deepEqual(result, {
      question: "",
      category: "General",
      difficulty: "medium",
      expectedTopics: []
    });
  });

  test("handles valid objects and maps fields correctly", () => {
    const raw = {
      Question: "What is an event loop?",
      category: "Node.js",
      difficulty: "hard",
      expected_topics: ["libuv", "call stack"]
    };
    const result = normalizeQuestion(raw);
    assert.deepEqual(result, {
      question: "What is an event loop?",
      category: "Node.js",
      difficulty: "hard",
      expectedTopics: ["libuv", "call stack"]
    });
  });

  test("maps alternative field names", () => {
    const raw = {
      text: "Explain closures",
      Category: "JS",
      Difficulty: "EASY",
      topics: ["lexical scope"]
    };
    const result = normalizeQuestion(raw);
    assert.deepEqual(result, {
      question: "Explain closures",
      category: "JS",
      difficulty: "easy",
      expectedTopics: ["lexical scope"]
    });
  });

  test("normalizes invalid difficulty to medium", () => {
    const raw = { difficulty: "very hard" };
    const result = normalizeQuestion(raw);
    assert.equal(result.difficulty, "medium");
  });
});

describe("normalizeEvaluation", () => {
  test("handles null or undefined input", () => {
    const result = normalizeEvaluation(undefined);
    assert.deepEqual(result, {
      score: 50,
      verdict: "partial",
      feedback: "Failed to evaluate answer properly.",
      strengths: [],
      missingPoints: [],
      idealAnswer: ""
    });
  });

  test("clamps scores between 0 and 100", () => {
    assert.equal(normalizeEvaluation({ score: 150 }).score, 100);
    assert.equal(normalizeEvaluation({ score: -20 }).score, 0);
    assert.equal(normalizeEvaluation({ score: "not a number" }).score, 50);
  });

  test("derives verdict from score if missing or invalid", () => {
    assert.equal(normalizeEvaluation({ score: 80, verdict: "invalid" }).verdict, "correct");
    assert.equal(normalizeEvaluation({ score: 60, verdict: "invalid" }).verdict, "partial");
    assert.equal(normalizeEvaluation({ score: 30, verdict: "invalid" }).verdict, "incorrect");
  });

  test("preserves valid verdict even if it differs from score bounds", () => {
    assert.equal(normalizeEvaluation({ score: 90, verdict: "partial" }).verdict, "partial");
    assert.equal(normalizeEvaluation({ score: 40, verdict: "correct" }).verdict, "correct");
  });

  test("maps alternative property names and processes arrays correctly", () => {
    const raw = {
      Score: 85,
      Verdict: "correct",
      Feedback: "Good job",
      Strengths: ["clear explanation"],
      Improvements: ["mention V8 memory management"],
      idealAnswerGuide: "A closure is..."
    };
    const result = normalizeEvaluation(raw);
    assert.deepEqual(result, {
      score: 85,
      verdict: "correct",
      feedback: "Good job",
      strengths: ["clear explanation"],
      missingPoints: ["mention V8 memory management"],
      idealAnswer: "A closure is..."
    });
  });
});
