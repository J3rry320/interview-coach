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

function formatDuration(seconds) {
  if (seconds === undefined || seconds === null) return "N/A";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export async function showFinalReport(sessionOrId) {
  let session;
  if (sessionOrId && typeof sessionOrId === "object") {
    session = sessionOrId;
  } else {
    session = await loadSession(sessionOrId);
  }

  if (!session) {
    console.log(chalk.red("No session data found to display."));
    return;
  }

  const gradedQuestions = session.questions.filter((q) => q.evaluation);
  const average =
    gradedQuestions.length > 0
      ? Math.round(
          gradedQuestions.reduce((sum, q) => sum + q.evaluation.score, 0) /
            gradedQuestions.length,
        )
      : 0;

  // calculate pacing
  const answeredQuestions = session.questions.filter(
    (q) => q.durationSeconds !== undefined,
  );
  const totalDuration = answeredQuestions.reduce(
    (acc, q) => acc + q.durationSeconds,
    0,
  );
  const avgDuration =
    answeredQuestions.length > 0
      ? Math.round(totalDuration / answeredQuestions.length)
      : 0;

  const headerLines = [
    `${figures.star} Interview ${session.status === "completed" ? "Complete" : "Report"}`,
    "",
    `Role: ${chalk.cyan(session.role)}`,
    `Level: ${chalk.cyan(session.level)}`,
  ];
  if (session.focusAreas) {
    headerLines.push(`Focus Areas: ${chalk.magenta(session.focusAreas)}`);
  }
  headerLines.push(`Questions: ${chalk.white(session.questions.length)}`);
  headerLines.push(`Average Score: ${getScoreColor(average)}`);
  if (avgDuration > 0) {
    headerLines.push(
      `Average Pacing: ${chalk.yellow(formatDuration(avgDuration))}`,
    );
  }

  console.log("\n");
  console.log(
    boxen(headerLines.join("\n"), {
      padding: 1,
      borderColor: "cyan",
      title: "Final Report",
      titleAlignment: "center",
    }),
  );

  const table = new Table({
    head: [
      chalk.cyan("#"),
      chalk.cyan("Score"),
      chalk.cyan("Verdict"),
      chalk.cyan("Pacing"),
    ],
  });

  session.questions.forEach((q, index) => {
    table.push([
      index + 1,
      q.evaluation ? getScoreColor(q.evaluation.score) : "N/A",
      q.evaluation ? getVerdictColor(q.evaluation.verdict) : "N/A",
      formatDuration(q.durationSeconds),
    ]);
  });

  console.log();
  console.log(table.toString());

  // Group questions by category and calculate averages
  const categories = {};
  session.questions.forEach((q) => {
    const category = q.category || "General";
    if (!categories[category]) {
      categories[category] = { totalScore: 0, count: 0 };
    }
    if (q.evaluation) {
      categories[category].totalScore += q.evaluation.score;
      categories[category].count += 1;
    }
  });

  const categoryEntries = Object.entries(categories).map(([name, data]) => {
    const avg = data.count > 0 ? Math.round(data.totalScore / data.count) : 0;
    return { name, avg };
  });

  if (categoryEntries.length > 0) {
    console.log(chalk.bold.cyan("\nSkills Analysis by Category:"));
    categoryEntries.forEach(({ name, avg }) => {
      const barLength = 10;
      const filledLength = Math.round((avg / 100) * barLength);
      const bar =
        "█".repeat(filledLength) + "░".repeat(barLength - filledLength);

      let colorFn = chalk.red;
      if (avg >= 75) colorFn = chalk.green;
      else if (avg >= 50) colorFn = chalk.yellow;

      console.log(`- ${name.padEnd(20)}: [${colorFn(bar)}] ${avg}%`);
    });
  }

  console.log();

  session.questions.forEach((q, index) => {
    const lines = [
      chalk.bold(`Question ${index + 1}`),
      "",
      chalk.cyan(q.question),
      "",
      chalk.bold("Your Answer:"),
      q.answer || "No answer provided",
    ];

    if (q.evaluation) {
      lines.push(
        "",
        chalk.bold("Feedback:"),
        q.evaluation.feedback,
        "",
        `Score: ${getScoreColor(q.evaluation.score)}/100${
          q.durationSeconds !== undefined
            ? ` | Time Taken: ${chalk.yellow(formatDuration(q.durationSeconds))}`
            : ""
        }`,
      );
    } else {
      lines.push("", chalk.red("Not evaluated."));
    }

    console.log(
      boxen(lines.join("\n"), {
        padding: 1,
        borderColor: "blue",
      }),
    );

    if (q.evaluation) {
      if (q.evaluation.idealAnswer) {
        console.log(
          boxen(chalk.gray(q.evaluation.idealAnswer), {
            padding: 1,
            borderColor: "gray",
            title: "Ideal Answer Guide",
            titleAlignment: "left",
          }),
        );
      }

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
