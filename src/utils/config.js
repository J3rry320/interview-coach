import fs from "fs/promises";
import path from "path";
import { ensureStorage, fileExists } from "./storage.js";

const CONFIG_FILE = path.resolve(process.cwd(), "data", "config.json");

const DEFAULT_CONFIG = {
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  apiKey: "",
  baseUrl: "",
  speechEnabled: false,
  ttsEnabled: false,
  sttEnabled: false,
};

export async function loadConfig() {
  await ensureStorage();
  const exists = await fileExists(CONFIG_FILE);
  if (!exists) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = await fs.readFile(CONFIG_FILE, "utf8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveConfig(config) {
  await ensureStorage();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
}
