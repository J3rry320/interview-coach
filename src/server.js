import express from "express";
import cors from "cors";
import open from "open";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";

import { loadConfig, saveConfig } from "./utils/config.js";
import {
  createSession,
  listAllSessions,
  loadSession,
  addQuestion,
  saveEvaluation,
} from "./utils/session.js";
import { generateQuestion } from "./utils/questionGenerator.js";
import { evaluateAnswer } from "./utils/answerEvaluator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  // Serve static files
  app.use(express.static(path.join(__dirname, "public")));

  // --- API Routes ---

  // Config
  app.get("/api/config", async (req, res) => {
    try {
      const config = await loadConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/config", async (req, res) => {
    try {
      const currentConfig = await loadConfig();
      const newConfig = { ...currentConfig, ...req.body };
      await saveConfig(newConfig);
      res.json({ success: true, config: newConfig });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sessions
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await listAllSessions();
      // Sort by newest first
      sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const session = await loadSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const { role, level, focusAreas, totalQuestions } = req.body;
      const session = await createSession({
        role,
        level,
        focusAreas,
        totalQuestions: totalQuestions || 5,
      });
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Interview Flow
  app.post("/api/interview/generate", async (req, res) => {
    try {
      const { sessionId } = req.body;
      const session = await loadSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const question = await generateQuestion(session);
      question.startTime = new Date().toISOString();
      await addQuestion(question, sessionId); // Note: addQuestion needs to support passing sessionId or we set activeSession beforehand. Wait, addQuestion currently uses getActiveSessionId(). I need to patch session.js if needed.
      
      // Let's reload to send the updated session
      const updatedSession = await loadSession(sessionId);
      res.json({ question, session: updatedSession });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/interview/evaluate", async (req, res) => {
    try {
      const { sessionId, questionId, answer, durationSeconds } = req.body;
      const session = await loadSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const question = session.questions[questionId];
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }

      const evaluation = await evaluateAnswer({
        role: session.role,
        question: question.question,
        expectedTopics: question.expectedTopics,
        answer,
        session,
      });

      await saveEvaluation({
        questionId,
        answer,
        evaluation,
        durationSeconds,
      }, sessionId);

      const updatedSession = await loadSession(sessionId);
      res.json({ evaluation, session: updatedSession });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Start the server
  app.listen(PORT, async () => {
    const url = `http://localhost:${PORT}`;
    console.log(chalk.green(`\nDashboard running at: ${url}`));
    console.log(chalk.gray(`Press Ctrl+C to stop.`));
    
    try {
      await open(url);
    } catch (err) {
      console.log(chalk.yellow(`Could not open browser automatically. Please open ${url} manually.`));
    }
  });
}
