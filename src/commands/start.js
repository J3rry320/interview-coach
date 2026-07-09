import boxen from "boxen";
import chalk from "chalk";
import gradient from "gradient-string";
import { input, select } from "@inquirer/prompts";

import { runInterview } from "../utils/engine.js";
import { renderLogo } from "../utils/renderLogo.js";
import {
  createSession,
  getActiveSessionId,
  loadSession,
  saveSession,
  clearActiveSessionId,
} from "../utils/session.js";
import { startWebDashboard } from "./web.js";

export async function startCommand() {
  console.clear();

  renderLogo();
  console.log(
    boxen("AI-powered technical interview simulator", {
      padding: 1,
      borderColor: "cyan",
      align: "center",
    }),
  );

  const mode = await select({
    message: "How would you like to run the interview coach?",
    choices: [
      { name: "Browser (Web Dashboard with Voice & Text)", value: "web" },
      { name: "CLI (Text-only Terminal)", value: "cli" },
    ],
  });

  if (mode === "web") {
    console.log(chalk.green("\nStarting Web Dashboard...\n"));
    await startWebDashboard();
    return;
  }

  // Resumption Check
  const activeId = await getActiveSessionId();
  if (activeId) {
    const activeSession = await loadSession(activeId);
    if (activeSession && activeSession.status === "active") {
      console.log(
        boxen(
          [
            chalk.yellow.bold("Incomplete Interview Session Found!"),
            "",
            `Role: ${chalk.cyan(activeSession.role)} (${activeSession.level})`,
            `Started: ${new Date(activeSession.createdAt).toLocaleString()}`,
            `Progress: ${activeSession.completedQuestions} of ${activeSession.totalQuestions} questions`,
          ].join("\n"),
          { padding: 1, borderColor: "yellow" }
        )
      );

      const action = await select({
        message: "What would you like to do?",
        choices: [
          { name: "Resume this interview", value: "resume" },
          { name: "Start a new interview (archives current one)", value: "new" },
        ],
      });

      if (action === "resume") {
        await runInterview(activeSession);
        printFooter();
        return;
      } else {
        // Archive as interrupted
        activeSession.status = "interrupted";
        await saveSession(activeSession);
        await clearActiveSessionId();
        console.log(chalk.gray("Previous session archived as 'interrupted'.\n"));
      }
    }
  }

  const role = await input({
    message: "Role:",
  });

  const difficulty = await select({
    message: "Difficulty:",
    choices: [
      { name: "Junior", value: "junior" },
      { name: "Mid", value: "mid" },
      { name: "Senior", value: "senior" },
    ],
  });

  const focusAreas = await input({
    message: "Focus Areas (optional, e.g. React, system design):",
  });

  const totalQuestions = Number(
    await input({
      message: "Number of questions:",
      default: "5",
    }),
  );

  const session = await createSession({
    role,
    level: difficulty,
    focusAreas,
    totalQuestions,
  });

  await runInterview(session);
  printFooter();
}

function printFooter() {
  console.log("\n");
  console.log(chalk.gray("────────────────────────────────────────────"));
  console.log(gradient.cristal("Developed with ♥ by Code Media Labs"));
  console.log(chalk.cyan.underline("https://codemedialabs.in"));
  console.log(chalk.gray("────────────────────────────────────────────"));
  console.log("\n");
}
