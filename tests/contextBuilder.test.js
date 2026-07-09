import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const testName = path.basename(__filename, ".test.js");
process.env.DATA_DIR = path.resolve(path.dirname(__filename), "tmp-" + testName);

import "./helpers.js";
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import { buildInterviewContext } from "../src/utils/contextBuilder.js";
import { createSession, saveSession } from "../src/utils/session.js";
import { setupTmpDir, cleanupTmpDir, TEST_DATA_DIR } from "./helpers.js";

const makeMockQuestion = (question, category, score, verdict = "partial") => ({
  question,
  category,
  difficulty: "medium",
  expectedTopics: ["General Topic"],
  evaluation: {
    score,
    verdict,
    feedback: "Mock feedback description",
    strengths: ["good communication"],
    missingPoints: ["deep details"],
    idealAnswer: "The ideal answer guide"
  }
});

describe("contextBuilder module", () => {
  beforeEach(async () => {
    await setupTmpDir();
  });

  afterEach(async () => {
    await cleanupTmpDir();
  });

  test("returns empty context when current session is new and no history exists", async () => {
    const currentSession = {
      id: "session-1",
      role: "Backend Engineer",
      questions: []
    };
    const context = await buildInterviewContext(currentSession);
    assert.equal(context, "");
  });

  test("compiles current session history (up to last 5 questions)", async () => {
    const currentSession = {
      id: "session-1",
      role: "Backend Engineer",
      questions: [
        makeMockQuestion("Q1", "General", 90, "correct"),
        makeMockQuestion("Q2", "General", 50, "partial"),
        { question: "Q3", category: "General", difficulty: "medium", expectedTopics: [] },
        makeMockQuestion("Q4", "General", 80, "correct"),
        makeMockQuestion("Q5", "General", 70, "partial"),
        makeMockQuestion("Q6", "General", 95, "correct")
      ]
    };

    const context = await buildInterviewContext(currentSession);

    // Should prioritize recent 5 (Q2 to Q6)
    assert.match(context, /CURRENT SESSION HISTORY:/);
    assert.doesNotMatch(context, /- Q: Q1/);
    assert.match(context, /- Q: Q2/);
    assert.match(context, /Score: 50\/100\. Feedback: Mock feedback/);
    assert.match(context, /Missed: deep details/);
    assert.match(context, /- Q: Q3/);
  });

  test("compiles past completed sessions for the same role", async () => {
    const pastSession1 = await createSession({ role: "Backend Engineer", level: "mid", totalQuestions: 2 });
    pastSession1.status = "completed";
    pastSession1.totalScore = 150; // average 75
    pastSession1.completedQuestions = 2;
    pastSession1.createdAt = new Date(Date.now() - 50000).toISOString();
    pastSession1.questions = [
      makeMockQuestion("Q1", "Databases", 60, "partial"),
      makeMockQuestion("Q2", "APIs", 90, "correct")
    ];
    await saveSession(pastSession1);

    const pastSession2 = await createSession({ role: "Backend Engineer", level: "senior", totalQuestions: 1 });
    pastSession2.status = "completed";
    pastSession2.totalScore = 80;
    pastSession2.completedQuestions = 1;
    pastSession2.createdAt = new Date().toISOString();
    pastSession2.questions = [
      makeMockQuestion("Q1", "Concurrency", 80, "correct")
    ];
    await saveSession(pastSession2);

    // Create a past session for a different role (should be ignored)
    const otherSession = await createSession({ role: "Frontend Engineer", level: "mid", totalQuestions: 1 });
    otherSession.status = "completed";
    otherSession.totalScore = 95;
    otherSession.completedQuestions = 1;
    otherSession.questions = [
      makeMockQuestion("Q1", "CSS", 95, "correct")
    ];
    await saveSession(otherSession);

    const currentSession = {
      id: "session-current",
      role: "Backend Engineer",
      questions: []
    };

    const context = await buildInterviewContext(currentSession);

    assert.match(context, /PAST SESSIONS PERFORMANCE \(Same Role\):/);
    assert.match(context, /Level: senior, Avg Score: 80\/100/);
    assert.match(context, /Level: mid, Avg Score: 75\/100/);
    assert.match(context, /Struggled with topics: Databases/);
    assert.doesNotMatch(context, /Frontend Engineer/);
  });

  test("handles error when listAllSessions fails", async () => {
    const originalMkdir = fs.mkdir;
    fs.mkdir = async () => {
      throw new Error("Mocked mkdir error");
    };

    try {
      const currentSession = {
        id: "session-current",
        role: "Backend Engineer",
        questions: [makeMockQuestion("Q1", "General", 80, "correct")]
      };

      const context = await buildInterviewContext(currentSession);
      assert.match(context, /CURRENT SESSION HISTORY:/);
      assert.match(context, /- Q: Q1/);
      assert.doesNotMatch(context, /PAST SESSIONS PERFORMANCE/);
    } finally {
      fs.mkdir = originalMkdir;
    }
  });
});
