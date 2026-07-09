import chalk from "chalk";
import { input, select, confirm } from "@inquirer/prompts";
import { loadConfig, saveConfig } from "../utils/config.js";
import { renderLogo } from "../utils/renderLogo.js";
import { getMacVoices } from "../utils/speech.js";

export async function configureCommand() {
  console.clear();
  renderLogo();
  console.log(chalk.bold.cyan("\n=== Interview Coach Global Configuration ===\n"));
  console.log(chalk.gray("This tool configures your global AI provider, model settings, and speech preferences."));
  console.log(chalk.gray("These settings will be used across all your interview sessions.\n"));

  const currentConfig = await loadConfig();

  const provider = await select({
    message: "Select AI Provider:",
    choices: [
      { name: "Groq (Cloud)", value: "groq" },
      { name: "OpenAI (Cloud)", value: "openai" },
      { name: "Anthropic (Cloud)", value: "anthropic" },
      { name: "Ollama (Offline/Local)", value: "ollama" },
      { name: "Custom OpenAI-Compatible API", value: "custom" },
    ],
    default: currentConfig.provider || "groq",
  });

  let model = "";
  let apiKey = "";
  let baseUrl = "";

  if (provider === "groq") {
    model = await input({
      message: "Model Name:",
      default: currentConfig.provider === "groq" ? currentConfig.model : "llama-3.3-70b-versatile",
    });
    apiKey = await input({
      message: "Groq API Key (leave empty to use GROQ_API_KEY env var):",
      default: currentConfig.provider === "groq" ? currentConfig.apiKey : "",
    });
  } else if (provider === "openai") {
    model = await input({
      message: "Model Name:",
      default: currentConfig.provider === "openai" ? currentConfig.model : "gpt-4o-mini",
    });
    apiKey = await input({
      message: "OpenAI API Key (leave empty to use OPENAI_API_KEY env var):",
      default: currentConfig.provider === "openai" ? currentConfig.apiKey : "",
    });
    baseUrl = await input({
      message: "Base URL (optional, e.g. custom proxy):",
      default: currentConfig.provider === "openai" ? currentConfig.baseUrl : "",
    });
  } else if (provider === "anthropic") {
    model = await input({
      message: "Model Name:",
      default: currentConfig.provider === "anthropic" ? currentConfig.model : "claude-3-5-sonnet-20241022",
    });
    apiKey = await input({
      message: "Anthropic API Key (leave empty to use ANTHROPIC_API_KEY env var):",
      default: currentConfig.provider === "anthropic" ? currentConfig.apiKey : "",
    });
  } else if (provider === "ollama") {
    baseUrl = await input({
      message: "Ollama Base URL:",
      default: currentConfig.provider === "ollama" && currentConfig.baseUrl ? currentConfig.baseUrl : "http://localhost:11434/v1",
    });
    model = await input({
      message: "Model Name (make sure you run `ollama pull <model>` first):",
      default: currentConfig.provider === "ollama" ? currentConfig.model : "llama3.2",
    });
  } else if (provider === "custom") {
    baseUrl = await input({
      message: "Base URL (e.g. http://localhost:8080/v1):",
      default: currentConfig.baseUrl || "",
    });
    model = await input({
      message: "Model Name:",
      default: currentConfig.model || "",
    });
    apiKey = await input({
      message: "API Key (optional):",
      default: currentConfig.apiKey || "",
    });
  }

  const speechEnabled = await confirm({
    message: "Enable Speech Mode (TTS/STT) for interviews?",
    default: currentConfig.speechEnabled || false,
  });

  let ttsEnabled = false;
  let sttEnabled = false;
  let ttsVoice = "Default";

  if (speechEnabled) {
    ttsEnabled = await confirm({
      message: "Enable Text-to-Speech (AI reads questions aloud)?",
      default: currentConfig.ttsEnabled !== undefined ? currentConfig.ttsEnabled : true,
    });

    if (ttsEnabled) {
      if (process.platform === "darwin") {
        const macVoices = getMacVoices();
        if (macVoices.length > 0) {
          ttsVoice = await select({
            message: "Select macOS Text-to-Speech voice:",
            choices: [
              { name: "Default System Voice", value: "Default" },
              ...macVoices
            ],
            default: currentConfig.ttsVoice || "Default",
          });
        }
      } else {
        ttsVoice = await input({
          message: "Enter TTS Voice name (leave as 'Default' for system default):",
          default: currentConfig.ttsVoice || "Default",
        });
      }
    }

    sttEnabled = await confirm({
      message: "Enable Speech-to-Text (Answer questions with your voice)?",
      default: currentConfig.sttEnabled !== undefined ? currentConfig.sttEnabled : true,
    });
  }

  await saveConfig({
    provider,
    model,
    apiKey,
    baseUrl,
    speechEnabled,
    ttsEnabled,
    sttEnabled,
    ttsVoice,
  });

  console.log(chalk.bold.green("\n=== Configuration Saved Successfully! ===\n"));
  
  if (speechEnabled) {
    console.log(chalk.yellow("[Speech Requirements]"));
    if (sttEnabled) {
      console.log(chalk.gray("To use Speech-to-Text, you MUST have FFmpeg installed on your system:"));
      console.log(chalk.gray("  • macOS:   brew install ffmpeg"));
      console.log(chalk.gray("  • Linux:   sudo apt-get install ffmpeg"));
      console.log(chalk.gray("  • Windows: winget install FFmpeg.FFmpeg"));
    }
    if (ttsEnabled && process.platform === "linux") {
      console.log(chalk.gray("To use Text-to-Speech on Linux, you MUST have speech-dispatcher installed:"));
      console.log(chalk.gray("  • Linux:   sudo apt-get install speech-dispatcher"));
    }
    console.log(); // blank line
  }

  console.log(chalk.cyan("You are all set! To begin an interview, run:"));
  console.log(chalk.white("  interview-coach start\n"));
}
