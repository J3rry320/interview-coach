import boxen from "boxen";
import chalk from "chalk";
import gradient from "gradient-string";

import { input, select } from "@inquirer/prompts";

import { runInterview } from "../utils/engine.js";
import { renderLogo } from "../utils/renderLogo.js";
import { createSession } from "../utils/session.js";

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

  const totalQuestions = Number(
    await input({
      message: "Number of questions:",
      default: "5",
    }),
  );

  const session = await createSession({
    role,
    level: difficulty,
    totalQuestions,
  });

  await runInterview(session);

  console.log("\n");

  console.log(chalk.gray("────────────────────────────────────────────"));

  console.log(gradient.cristal("Developed with ♥ by Code Media Labs"));

  console.log(chalk.cyan.underline("https://codemedialabs.in"));

  console.log(chalk.gray("────────────────────────────────────────────"));

  console.log("\n");
}
