import { input } from "@inquirer/prompts";
import boxen from "boxen";
import chalk from "chalk";
import figures from "figures";
import ora from "ora";

import { addQuestion, loadSession, saveEvaluation } from "../utils/session.js";

import { generateQuestion } from "./questionGenerator.js";

import { evaluateAnswer } from "./answerEvaluator.js";
import { showFinalReport } from "./showReport.js";

export async function runInterview(session) {
  const startIdx =
    session.questions.length > 0 &&
    !session.questions[session.questions.length - 1].answer
      ? session.questions.length - 1
      : session.questions.length;

  if (startIdx > 0) {
    console.log(
      chalk.yellow(`\nResuming interview from question ${startIdx + 1}...\n`)
    );
  }

  for (let i = startIdx; i < session.totalQuestions; i++) {
    let question;
    let startTime;

    if (i < session.questions.length) {
      question = session.questions[i];
      startTime = Date.now(); // reset timer for resumption
    } else {
      const questionSpinner = ora("Generating question...").start();
      question = await generateQuestion(session);
      questionSpinner.succeed();
      
      question.startTime = new Date().toISOString();
      await addQuestion(question);
      startTime = Date.now();
    }

    const topics = question.expectedTopics ?? [];

    console.log(
      boxen(
        [
          `${figures.star} Question ${i + 1}/${session.totalQuestions}`,
          "",
          `${chalk.bold("Category:")} ${chalk.cyan(question.category ?? "General")}`,
          `${chalk.bold("Difficulty:")} ${chalk.yellow(question.difficulty ?? "N/A")}`,
          "",
          chalk.whiteBright(question.question),
          "",
          chalk.gray("Expected Areas:"),
          ...topics.map((topic) => `${chalk.gray(figures.bullet)} ${topic}`),
        ].join("\n"),
        {
          padding: 1,
          borderColor: "blue",
          title: "Interview Question",
          titleAlignment: "center",
        },
      ),
    );

    const answer = await input({
      message: "Your Answer:",
    });

    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

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
      durationSeconds,
    });

    console.log(`Score: ${evaluation.score}`);

    console.log(evaluation.feedback);

    session = await loadSession();
  }

  await showFinalReport(session);
}
