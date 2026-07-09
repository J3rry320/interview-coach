import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const testName = path.basename(__filename, ".test.js");
process.env.DATA_DIR = path.resolve(path.dirname(__filename), "tmp-" + testName);

import "./helpers.js";
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import { loadConfig, saveConfig } from "../src/utils/config.js";
import { setupTmpDir, cleanupTmpDir, TEST_DATA_DIR } from "./helpers.js";

describe("config module", () => {
  beforeEach(async () => {
    await setupTmpDir();
  });

  afterEach(async () => {
    await cleanupTmpDir();
  });

  test("loads default config when file does not exist", async () => {
    const config = await loadConfig();
    assert.deepEqual(config, {
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      apiKey: "",
      baseUrl: ""
    });
  });

  test("saves and loads configuration successfully", async () => {
    const newConfig = {
      provider: "openai",
      model: "gpt-4o",
      apiKey: "sk-test123",
      baseUrl: "https://api.openai.com/v1"
    };

    await saveConfig(newConfig);
    const config = await loadConfig();
    assert.deepEqual(config, newConfig);
  });

  test("handles corrupted config file gracefully by returning defaults", async () => {
    const configFile = path.join(TEST_DATA_DIR, "config.json");
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
    await fs.writeFile(configFile, "{ invalid json }", "utf8");

    const config = await loadConfig();
    assert.equal(config.provider, "groq");
    assert.equal(config.model, "llama-3.3-70b-versatile");
    assert.equal(config.apiKey, "");
  });
});
