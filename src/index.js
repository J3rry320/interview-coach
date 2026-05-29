import crypto from "crypto";

import {
  addQuestion,
  createSession,
  hasActiveSession,
} from "./utils/session.js";

import { generateQuestion } from "./utils/questionGenerator.js";

async function startInterview() {
  let session = await hasActiveSession();

  if (!session) {
    session = await createSession({
      role: "Node.js Developer",
      level: "mid",
    });
  }

  const generatedQuestion = await generateQuestion(session);

  const question = {
    id: crypto.randomUUID(),

    question: generatedQuestion.question,

    category: generatedQuestion.category,

    difficulty: generatedQuestion.difficulty,

    expectedTopics: generatedQuestion.expectedTopics,
  };

  await addQuestion(question);

  console.log("\n");
  console.log(`Question ${session.questions.length + 1}`);
  console.log(question.question);
}

startInterview();
