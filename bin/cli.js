#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";

import { hasActiveSession } from "../src/utils/session.js";

const program = new Command();

process.on("SIGINT", () => {
  console.log(chalk.yellow("\n\nInterview interrupted."));

  process.exit(0);
});

process.on("unhandledRejection", (error) => {
  console.error(chalk.red("\nUnhandled Error:"));

  console.error(error);

  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error(chalk.red("\nUnexpected Crash:"));

  console.error(error);

  process.exit(1);
});

program
  .name("interview-coach")
  .description("Practice AI-powered interviews from your terminal.")
  .version("1.0.0");

program
  .command("start")
  .description("Start a new interview session")
  .option("-k, --api-key <key>", "Groq API key")
  .action(async (options) => {
    try {
      const apiKey = options.apiKey || process.env.GROQ_API_KEY;

      if (!apiKey) {
        console.error(chalk.red("Missing GROQ_API_KEY environment variable."));

        process.exit(1);
      }

      process.env.GROQ_API_KEY = apiKey;
      const { startCommand } = await import("../src/commands/start.js");

      await startCommand();
    } catch (error) {
      console.error(chalk.red("\nFailed to start interview:"));

      console.error(error);
      process.exit(1);
    }
  });

program
  .command("report")
  .description("View the latest interview report")
  .action(async () => {
    try {
      const session = await hasActiveSession();
      if (!session) {
        console.error(
          chalk.red("Missing Session Data. Make sure to give an interview"),
        );

        process.exit(1);
      }
      const { showFinalReport } = await import("../src/utils/showReport.js");
      await showFinalReport();
    } catch (error) {
      console.error(
        chalk.red(
          "\nFailed to show last report. Make sure to give a complete interview",
        ),
      );

      console.error(error);
      process.exit(1);
    }
  });

program.addHelpText(
  "after",
  `
Examples:

$ interview-coach start
$ interview-coach start --api-key "YOUR Key"
$ interview-coach start -k "Your Key"
$ interview-coach report

Environment:

GROQ_API_KEY=your_api_key

Website:
https://codemedialabs.in
`,
);

program.parse();
