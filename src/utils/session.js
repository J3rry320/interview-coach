import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

import SessionSchema from "../schemas/sessionSchema.js";

import {
  ensureStorage,
  fileExists,
  SESSIONS_DIR,
  ACTIVE_SESSION_ID_FILE,
  MIGRATED_SESSION_FILE,
} from "./storage.js";

// Active Session Pointer Helpers
export async function saveActiveSessionId(id) {
  await ensureStorage();
  await fs.writeFile(
    ACTIVE_SESSION_ID_FILE,
    JSON.stringify({ id }, null, 2),
    "utf8"
  );
}

export async function getActiveSessionId() {
  await ensureStorage();
  const exists = await fileExists(ACTIVE_SESSION_ID_FILE);
  if (!exists) return null;
  try {
    const raw = await fs.readFile(ACTIVE_SESSION_ID_FILE, "utf8");
    const data = JSON.parse(raw);
    return data.id || null;
  } catch {
    return null;
  }
}

export async function clearActiveSessionId() {
  const exists = await fileExists(ACTIVE_SESSION_ID_FILE);
  if (exists) {
    await fs.unlink(ACTIVE_SESSION_ID_FILE);
  }
}

// Migrate old session file to the new multi-session directory structure
export async function migrateOldSession() {
  await ensureStorage();
  const exists = await fileExists(MIGRATED_SESSION_FILE);
  if (!exists) return;

  try {
    const raw = await fs.readFile(MIGRATED_SESSION_FILE, "utf8");
    const session = JSON.parse(raw);
    
    // Ensure it's valid
    if (session && session.id) {
      // If it has no status or old status, default appropriately
      if (!session.status) {
        session.status = "completed";
      }
      
      const validated = SessionSchema.parse(session);
      const newFile = path.join(SESSIONS_DIR, `session-${validated.id}.json`);
      
      // Save it in the new directory
      await fs.writeFile(newFile, JSON.stringify(validated, null, 2));
      
      // If it was active, set it as the active session
      if (validated.status === "active") {
        await saveActiveSessionId(validated.id);
      }
    }
  } catch (error) {
    // Ignore migration parsing errors
  }

  // Delete the old file after migrating or if it was invalid/corrupt
  try {
    await fs.unlink(MIGRATED_SESSION_FILE);
  } catch {
    // ignore
  }
}

export async function createSession({ role, level, totalQuestions, focusAreas }) {
  await migrateOldSession(); // Auto-migrate if exists

  const session = {
    id: crypto.randomUUID(),
    role,
    level,
    focusAreas,
    totalQuestions,
    completedQuestions: 0,
    createdAt: new Date().toISOString(),
    status: "active",
    currentQuestion: 0,
    totalScore: 0,
    questions: [],
  };

  await saveSession(session);
  await saveActiveSessionId(session.id);

  return session;
}

export async function saveSession(session) {
  await ensureStorage();

  const validated = SessionSchema.parse(session);
  const file = path.join(SESSIONS_DIR, `session-${validated.id}.json`);

  await fs.writeFile(file, JSON.stringify(validated, null, 2));

  return validated;
}

export async function loadSession(id) {
  await migrateOldSession(); // Auto-migrate if exists

  let targetId = id;
  if (!targetId) {
    targetId = await getActiveSessionId();
  }

  if (!targetId) {
    return null;
  }

  const file = path.join(SESSIONS_DIR, `session-${targetId}.json`);
  const exists = await fileExists(file);

  if (!exists) {
    return null;
  }

  const raw = await fs.readFile(file, "utf8");
  const data = JSON.parse(raw);

  return SessionSchema.parse(data);
}

export async function deleteSession(id) {
  const targetId = id || (await getActiveSessionId());
  if (!targetId) {
    return false;
  }

  const file = path.join(SESSIONS_DIR, `session-${targetId}.json`);
  const exists = await fileExists(file);

  if (exists) {
    await fs.unlink(file);
  }

  const activeId = await getActiveSessionId();
  if (activeId === targetId) {
    await clearActiveSessionId();
  }

  return true;
}

export async function hasActiveSession() {
  const session = await loadSession();
  return !!session;
}

export async function saveEvaluation({ questionId, answer, evaluation, durationSeconds }) {
  const session = await loadSession();
  if (!session) {
    throw new Error("No active session");
  }

  const question = session.questions[questionId];

  if (!question) {
    throw new Error("Question not found");
  }

  question.answer = answer;
  question.evaluation = evaluation;
  if (durationSeconds !== undefined) {
    question.durationSeconds = durationSeconds;
  }

  session.totalScore += evaluation.score;
  session.completedQuestions = session.questions.filter((q) => q.answer).length;

  if (session.completedQuestions >= session.totalQuestions) {
    session.status = "completed";
  }

  await saveSession(session);

  if (session.status === "completed") {
    await clearActiveSessionId();
  }

  return session;
}

export async function addQuestion(question) {
  const session = await loadSession();

  if (!session) {
    throw new Error("No active session");
  }

  session.questions.push(question);
  session.currentQuestion = session.questions.length;

  await saveSession(session);

  return session;
}

export async function listAllSessions() {
  await migrateOldSession(); // Auto-migrate if exists
  await ensureStorage();

  try {
    const files = await fs.readdir(SESSIONS_DIR);
    const sessions = [];

    for (const file of files) {
      if (file.startsWith("session-") && file.endsWith(".json")) {
        const raw = await fs.readFile(path.join(SESSIONS_DIR, file), "utf8");
        try {
          const session = SessionSchema.parse(JSON.parse(raw));
          sessions.push(session);
        } catch {
          // ignore invalid/corrupt session files
        }
      }
    }

    // Sort: newest first
    return sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch {
    return [];
  }
}
