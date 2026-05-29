import crypto from "crypto";
import fs from "fs/promises";

import SessionSchema from "../schemas/sessionSchema.js";

import { ensureStorage, fileExists, SESSION_FILE } from "./storage.js";

export async function createSession({ role, level }) {
  const session = {
    id: crypto.randomUUID(),

    role,
    level,

    createdAt: new Date().toISOString(),

    status: "active",

    currentQuestion: 0,

    totalScore: 0,

    questions: [],
  };

  await saveSession(session);

  return session;
}

export async function saveSession(session) {
  await ensureStorage();

  const validated = SessionSchema.parse(session);

  await fs.writeFile(SESSION_FILE, JSON.stringify(validated, null, 2));

  return validated;
}

export async function loadSession() {
  await ensureStorage();

  const exists = await fileExists(SESSION_FILE);

  if (!exists) {
    return null;
  }

  const raw = await fs.readFile(SESSION_FILE, "utf8");

  const data = JSON.parse(raw);

  return SessionSchema.parse(data);
}

export async function deleteSession() {
  const exists = await fileExists(SESSION_FILE);

  if (!exists) {
    return;
  }

  await fs.unlink(SESSION_FILE);
}

export async function hasActiveSession() {
  const session = await loadSession();

  return !!session;
}

export async function saveEvaluation({ questionId, answer, evaluation }) {
  const session = await loadSession();

  const question = session.questions.find((q) => q.id === questionId);

  if (!question) {
    throw new Error("Question not found");
  }

  question.answer = answer;

  question.evaluation = evaluation;

  session.totalScore += evaluation.score;

  await saveSession(session);

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
