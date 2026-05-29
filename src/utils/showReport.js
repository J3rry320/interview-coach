import boxen from "boxen";
import chalk from "chalk";
import Table from "cli-table3";
import figures from "figures";

import { loadSession } from "../utils/session.js";

function getScoreColor(score) {
  if (score >= 90) return chalk.green(score);
  if (score >= 75) return chalk.cyan(score);
  if (score >= 50) return chalk.yellow(score);

  return chalk.red(score);
}

function getVerdictColor(verdict) {
  switch (verdict) {
    case "correct":
      return chalk.green(verdict);

    case "partial":
      return chalk.yellow(verdict);

    default:
      return chalk.red(verdict);
  }
}

export async function showFinalReport() {
  const session = await loadSession();

  const average = Math.round(session.totalScore / session.questions.length);

  console.clear();

  console.log(
    boxen(
      [
        `${figures.star} Interview Complete`,
        "",
        `Role: ${chalk.cyan(session.role)}`,
        `Level: ${chalk.cyan(session.level)}`,
        `Questions: ${chalk.white(session.questions.length)}`,
        `Average Score: ${getScoreColor(average)}`,
      ].join("\n"),
      {
        padding: 1,
        borderColor: "cyan",
        title: "Final Report",
        titleAlignment: "center",
      },
    ),
  );

  const table = new Table({
    head: [chalk.cyan("#"), chalk.cyan("Score"), chalk.cyan("Verdict")],
  });

  session.questions.forEach((q, index) => {
    table.push([
      index + 1,
      getScoreColor(q.evaluation.score),
      getVerdictColor(q.evaluation.verdict),
    ]);
  });

  console.log();
  console.log(table.toString());

  console.log();

  session.questions.forEach((q, index) => {
    console.log(
      boxen(
        [
          chalk.bold(`Question ${index + 1}`),
          "",
          chalk.cyan(q.question),
          "",
          chalk.bold("Your Answer:"),
          q.answer || "No answer provided",
          "",
          chalk.bold("Feedback:"),
          q.evaluation.feedback,
          "",
          `Score: ${q.evaluation.score}/100`,
        ].join("\n"),
        {
          padding: 1,
          borderColor: "blue",
        },
      ),
    );

    if (q.evaluation.strengths?.length) {
      console.log(chalk.green.bold("\nStrengths"));

      q.evaluation.strengths.forEach((item) => {
        console.log(`${chalk.green(figures.tick)} ${item}`);
      });
    }

    const improvements =
      q.evaluation.improvements || q.evaluation.missingPoints || [];

    if (improvements.length) {
      console.log(chalk.yellow.bold("\nImprovements"));

      improvements.forEach((item) => {
        console.log(`${chalk.yellow(figures.pointer)} ${item}`);
      });
    }

    console.log();
  });

  console.log(
    boxen(
      average >= 75
        ? `${figures.tick} Great job! You're interview ready.`
        : `${figures.warning} Keep practicing and review the improvement areas above.`,
      {
        padding: 1,
        borderColor: average >= 75 ? "green" : "yellow",
      },
    ),
  );
}
