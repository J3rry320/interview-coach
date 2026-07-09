import chalk from "chalk";
import { startServer } from "../server.js";

export async function startWebDashboard() {
  try {
    await startServer();
  } catch (error) {
    console.error(chalk.red("Failed to start web dashboard:"), error);
  }
}
