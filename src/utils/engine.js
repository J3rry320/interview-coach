import ora from "ora";

import { input } from "@inquirer/prompts";

import { addQuestion, loadSession, saveEvaluation } from "../utils/session.js";

import { generateQuestion } from "./questionGenerator.js";

import { evaluateAnswer } from "./answerEvaluator.js";
import { showFinalReport } from "./showReport.js";

export async function runInterview(session) {
  for (let i = 0; i < session.totalQuestions; i++) {
    const questionSpinner = ora("Generating question...").start();

    const question = await generateQuestion(session);

    questionSpinner.succeed();
    await addQuestion(question);

    console.log("\n");
    console.log(`Question ${i + 1}/${session.totalQuestions}`);
    console.log(question.question);
    console.log("");

    const answer = await input({
      message: "Your Answer:",
    });

    const evalSpinner = ora("Evaluating answer...").start();

    const evaluation = await evaluateAnswer({
      role: session.role,
      question: question.question,
      expectedTopics: question.expectedTopics,
      answer,
    });

    evalSpinner.succeed();

    await saveEvaluation({
      questionId: i,
      answer,
      evaluation,
    });

    console.log(`Score: ${evaluation.score}`);

    console.log(evaluation.feedback);

    session = await loadSession();
  }

  await showFinalReport();
}
