import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const testName = path.basename(__filename, ".test.js");
process.env.DATA_DIR = path.resolve(path.dirname(__filename), "tmp-" + testName);

import "./helpers.js";
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import {
  createSession,
  loadSession,
  saveSession,
  deleteSession,
  hasActiveSession,
  saveEvaluation,
  addQuestion,
  listAllSessions,
  migrateOldSession,
  getActiveSessionId
} from "../src/utils/session.js";
import { setupTmpDir, cleanupTmpDir, TEST_DATA_DIR } from "./helpers.js";

describe("session module", () => {
  beforeEach(async () => {
    await setupTmpDir();
  });

  afterEach(async () => {
    await cleanupTmpDir();
  });

  test("creates a new session and sets it as active", async () => {
    const session = await createSession({
      role: "Frontend Engineer",
      level: "mid",
      totalQuestions: 3,
      focusAreas: "React, CSS"
    });

    assert.ok(session.id);
    assert.equal(session.role, "Frontend Engineer");
    assert.equal(session.status, "active");
    assert.equal(session.currentQuestion, 0);

    const activeSession = await loadSession();
    assert.equal(activeSession.id, session.id);
    assert.ok(await hasActiveSession());
  });

  test("adds a question to an active session", async () => {
    const session = await createSession({
      role: "Backend Engineer",
      level: "senior",
      totalQuestions: 2
    });

    const question = {
      question: "Explain node process clustering.",
      category: "Node.js",
      difficulty: "hard",
      expectedTopics: ["cluster module", "IPC"]
    };

    const updated = await addQuestion(question, session.id);
    assert.equal(updated.questions.length, 1);
    assert.equal(updated.currentQuestion, 1);
    assert.deepEqual(updated.questions[0], question);
  });

  test("saves answer evaluation and handles session completion", async () => {
    const session = await createSession({
      role: "Backend Engineer",
      level: "senior",
      totalQuestions: 1
    });

    const question = {
      question: "What is event loop?",
      category: "Node.js",
      difficulty: "medium",
      expectedTopics: ["macro", "micro"]
    };
    await addQuestion(question, session.id);

    const evalResult = {
      score: 85,
      verdict: "correct",
      feedback: "Good explanation.",
      strengths: ["clear"],
      missingPoints: [],
      idealAnswer: "The event loop..."
    };

    const updated = await saveEvaluation({
      questionId: 0,
      answer: "The event loop processes callbacks...",
      evaluation: evalResult,
      durationSeconds: 15
    }, session.id);

    assert.equal(updated.completedQuestions, 1);
    assert.equal(updated.totalScore, 85);
    assert.equal(updated.status, "completed");

    const activeSession = await loadSession();
    assert.equal(activeSession, null);
  });

  test("lists all sessions sorted by date descending", async () => {
    const session1 = await createSession({ role: "A", level: "junior", totalQuestions: 1 });
    session1.createdAt = new Date(Date.now() - 10000).toISOString();
    await saveSession(session1);

    const session2 = await createSession({ role: "B", level: "mid", totalQuestions: 1 });
    session2.createdAt = new Date().toISOString();
    await saveSession(session2);

    const list = await listAllSessions();
    assert.equal(list.length, 2);
    // Should sort newest first (session2 first)
    assert.equal(list[0].role, "B");
    assert.equal(list[1].role, "A");
  });

  test("deletes session files and active pointers", async () => {
    const session = await createSession({ role: "A", level: "senior", totalQuestions: 1 });
    assert.ok(await loadSession(session.id));

    const deleted = await deleteSession(session.id);
    assert.ok(deleted);

    const loaded = await loadSession(session.id);
    assert.equal(loaded, null);
  });

  test("migrates old session file structure", async () => {
    const oldSession = {
      id: "old-uuid-123",
      role: "Fullstack Engineer",
      level: "mid",
      totalQuestions: 3,
      completedQuestions: 0,
      createdAt: new Date().toISOString(),
      status: "active",
      currentQuestion: 0,
      totalScore: 0,
      questions: []
    };

    const oldFilePath = path.join(TEST_DATA_DIR, "session.json");
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
    await fs.writeFile(oldFilePath, JSON.stringify(oldSession, null, 2), "utf8");

    await migrateOldSession();

    // Check that it was migrated and old file deleted
    const oldExists = await fs.access(oldFilePath).then(() => true).catch(() => false);
    assert.equal(oldExists, false);

    const loaded = await loadSession("old-uuid-123");
    assert.equal(loaded.status, "active");
  });

  test("handles deleteSession when no session is active", async () => {
    const deleted = await deleteSession(null);
    assert.equal(deleted, false);
  });

  test("returns false when deleteSession is called on non-existent session ID", async () => {
    const deleted = await deleteSession("non-existent-session-id-123");
    assert.equal(deleted, false);
  });

  test("throws error if saveEvaluation/addQuestion is called on missing session", async () => {
    await assert.rejects(
      saveEvaluation({ questionId: 0, answer: "a", evaluation: {} }, "missing-id"),
      /No active session/
    );
    await assert.rejects(
      addQuestion({ question: "q" }, "missing-id"),
      /No active session/
    );
  });

  test("throws error if saveEvaluation is called with invalid question ID", async () => {
    const session = await createSession({ role: "A", level: "senior", totalQuestions: 1 });
    await assert.rejects(
      saveEvaluation({ questionId: 99, answer: "a", evaluation: { score: 50, verdict: "partial", feedback: "a", strengths: [], missingPoints: [], idealAnswer: "" } }, session.id),
      /Question not found/
    );
  });

  test("handles corrupted active session file and listAllSessions failures gracefully", async () => {
    const activeFile = path.join(TEST_DATA_DIR, "active_session_id.json");
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
    await fs.writeFile(activeFile, "{ invalid json }", "utf8");

    const activeId = await getActiveSessionId();
    assert.equal(activeId, null);

    const originalReaddir = fs.readdir;
    fs.readdir = async () => {
      throw new Error("Mocked readdir error");
    };

    try {
      const list = await listAllSessions();
      assert.deepEqual(list, []);
    } finally {
      fs.readdir = originalReaddir;
    }
  });

  test("handles corrupted migrated session file gracefully", async () => {
    const oldFilePath = path.join(TEST_DATA_DIR, "session.json");
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
    await fs.writeFile(oldFilePath, "{ corrupted }", "utf8");

    await migrateOldSession();
    const oldExists = await fs.access(oldFilePath).then(() => true).catch(() => false);
    assert.equal(oldExists, false);
  });

  test("handles old session file migration with unlink failure gracefully", async () => {
    const oldSession = {
      id: "old-uuid-unlink-fail",
      role: "Backend Engineer",
      level: "mid",
      totalQuestions: 1,
      completedQuestions: 0,
      createdAt: new Date().toISOString(),
      status: "active",
      currentQuestion: 0,
      totalScore: 0,
      questions: []
    };

    const oldFilePath = path.join(TEST_DATA_DIR, "session.json");
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
    await fs.writeFile(oldFilePath, JSON.stringify(oldSession, null, 2), "utf8");

    const originalUnlink = fs.unlink;
    fs.unlink = async (file) => {
      if (file.endsWith("session.json")) {
        throw new Error("Mocked unlink error");
      }
      return originalUnlink(file);
    };

    try {
      await migrateOldSession();
      const migratedSession = await loadSession("old-uuid-unlink-fail");
      assert.equal(migratedSession.role, "Backend Engineer");
    } finally {
      fs.unlink = originalUnlink;
    }
  });

  test("listAllSessions skips corrupted session files gracefully", async () => {
    const validSession = await createSession({ role: "Frontend Developer", level: "junior", totalQuestions: 1 });
    
    const sessionsDir = path.join(TEST_DATA_DIR, "sessions");
    const corruptFile = path.join(sessionsDir, "session-corrupted-uuid.json");
    await fs.writeFile(corruptFile, "{ invalid json structure }", "utf8");

    const list = await listAllSessions();
    assert.equal(list.length, 1);
    assert.equal(list[0].role, "Frontend Developer");
  });
});
