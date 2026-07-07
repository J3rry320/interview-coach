#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";
import { select } from "@inquirer/prompts";
import Table from "cli-table3";

import { startCommand } from "../src/commands/start.js";
import { configureCommand } from "../src/commands/configure.js";
import { loadConfig } from "../src/utils/config.js";
import {
  hasActiveSession,
  loadSession,
  listAllSessions,
  deleteSession,
  migrateOldSession,
} from "../src/utils/session.js";
import { showFinalReport } from "../src/utils/showReport.js";

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

// Auto-run migration at entry point
try {
  await migrateOldSession();
} catch {
  // ignore
}

program
  .name("interview-coach")
  .description("Practice AI-powered interviews from your terminal.")
  .version("1.0.1");

program
  .command("start")
  .description("Start a new interview session or resume an active one")
  .option("-k, --api-key <key>", "API key for the selected provider")
  .action(async (options) => {
    try {
      const config = await loadConfig();
      const provider = config.provider || "groq";
      const apiKey = options.apiKey || config.apiKey || (
        provider === "groq" ? process.env.GROQ_API_KEY :
        provider === "openai" ? process.env.OPENAI_API_KEY :
        provider === "anthropic" ? process.env.ANTHROPIC_API_KEY :
        ""
      );

      // Validation only for key-based cloud providers
      if (provider !== "ollama" && provider !== "custom" && !apiKey) {
        console.error(
          chalk.red(
            `Missing API Key for provider "${provider}". Run 'interview-coach configure' or set the appropriate environment variable.`
          )
        );
        process.exit(1);
      }

      // Map API key back to environment variable for third-party SDKs or utilities if needed
      if (apiKey) {
        if (provider === "groq") process.env.GROQ_API_KEY = apiKey;
        else if (provider === "openai") process.env.OPENAI_API_KEY = apiKey;
        else if (provider === "anthropic") process.env.ANTHROPIC_API_KEY = apiKey;
      }

      await startCommand();
    } catch (error) {
      console.error(chalk.red("\nFailed to start interview:"));

      console.error(error);
      process.exit(1);
    }
  });

program
  .command("configure")
  .description("Configure the AI provider and model parameters")
  .action(async () => {
    try {
      await configureCommand();
    } catch (error) {
      console.error(chalk.red("\nFailed to configure LLM provider:"));
      console.error(error);
      process.exit(1);
    }
  });

program
  .command("report")
  .description("View an interview report")
  .argument("[id]", "Session ID to show report for")
  .action(async (id) => {
    try {
      let targetId = id;
      if (!targetId) {
        const activeSession = await loadSession();
        if (activeSession) {
          targetId = activeSession.id;
        } else {
          const sessions = await listAllSessions();
          if (sessions.length === 0) {
            console.log(
              chalk.yellow(
                "No past interviews found. Start one with `interview-coach start`."
              )
            );
            return;
          }

          const choices = sessions.map((s) => {
            const graded = s.questions.filter((q) => q.evaluation);
            const score =
              graded.length > 0
                ? Math.round(
                    graded.reduce((sum, q) => sum + q.evaluation.score, 0) /
                      graded.length
                  ) + "%"
                : "N/A";
            const date = new Date(s.createdAt).toLocaleDateString();
            return {
              name: `${date} - ${s.role} (${s.level}) - Score: ${score} - Status: ${s.status} [${s.id.slice(0, 8)}]`,
              value: s.id,
            };
          });

          targetId = await select({
            message: "Select an interview report to view:",
            choices,
          });
        }
      }

      await showFinalReport(targetId);
    } catch (error) {
      console.error(chalk.red("\nFailed to show report:"));

      console.error(error);
      process.exit(1);
    }
  });

program
  .command("history")
  .description("View your past interview history")
  .action(async () => {
    try {
      const sessions = await listAllSessions();
      if (sessions.length === 0) {
        console.log(
          chalk.yellow(
            "No past interviews found. Start one with `interview-coach start`."
          )
        );
        return;
      }

      console.log(chalk.bold.cyan("\n=== Interview History ===\n"));

      const table = new Table({
        head: [
          chalk.cyan("ID"),
          chalk.cyan("Date"),
          chalk.cyan("Role"),
          chalk.cyan("Level"),
          chalk.cyan("Score"),
          chalk.cyan("Progress"),
          chalk.cyan("Status"),
        ],
      });

      sessions.forEach((s) => {
        const date = new Date(s.createdAt).toLocaleDateString();
        const graded = s.questions.filter((q) => q.evaluation);
        const avgScore =
          graded.length > 0
            ? Math.round(
                graded.reduce((sum, q) => sum + q.evaluation.score, 0) /
                  graded.length
              ) + "%"
            : "N/A";

        let statusColor = chalk.white;
        if (s.status === "completed") statusColor = chalk.green;
        else if (s.status === "active") statusColor = chalk.yellow;
        else if (s.status === "interrupted") statusColor = chalk.red;

        table.push([
          s.id.slice(0, 8),
          date,
          s.role,
          s.level,
          avgScore,
          `${s.completedQuestions}/${s.totalQuestions}`,
          statusColor(s.status),
        ]);
      });

      console.log(table.toString());
      console.log();
    } catch (error) {
      console.error(chalk.red("\nFailed to load history:"));
      console.error(error);
      process.exit(1);
    }
  });

program
  .command("delete")
  .description("Delete a past interview session")
  .argument("[id]", "Session ID to delete")
  .action(async (id) => {
    try {
      let targetId = id;
      if (!targetId) {
        const sessions = await listAllSessions();
        if (sessions.length === 0) {
          console.log(chalk.yellow("No past interviews found to delete."));
          return;
        }

        const choices = sessions.map((s) => {
          const date = new Date(s.createdAt).toLocaleDateString();
          return {
            name: `${date} - ${s.role} (${s.level}) - [${s.id.slice(0, 8)}]`,
            value: s.id,
          };
        });

        targetId = await select({
          message: "Select an interview session to delete:",
          choices,
        });
      }

      const success = await deleteSession(targetId);
      if (success) {
        console.log(chalk.green(`Session ${targetId} successfully deleted.`));
      } else {
        console.log(
          chalk.red(`Failed to delete session ${targetId}. Session not found.`)
        );
      }
    } catch (error) {
      console.error(chalk.red("\nFailed to delete session:"));
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
$ interview-coach configure
$ interview-coach report
$ interview-coach report [id]
$ interview-coach history
$ interview-coach delete [id]

Environment:

GROQ_API_KEY=your_api_key
OPENAI_API_KEY=your_api_key
ANTHROPIC_API_KEY=your_api_key

Website:
https://codemedialabs.in
`,
);

program.parse();
