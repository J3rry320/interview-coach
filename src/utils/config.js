import fs from "fs/promises";
import path from "path";
import { DATA_DIR, ensureStorage, fileExists } from "./storage.js";

const CONFIG_FILE = path.join(DATA_DIR, "config.json");

const DEFAULT_CONFIG = {
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  apiKey: "",
  baseUrl: "",
  requestTimeout: 5
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
