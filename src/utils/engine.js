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
  for (let i = 0; i < session.totalQuestions; i++) {
    const questionSpinner = ora("Generating question...").start();

    const question = await generateQuestion(session);

    questionSpinner.succeed();
    await addQuestion(question);
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
