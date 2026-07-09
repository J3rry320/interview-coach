import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const testName = path.basename(__filename, ".test.js");
process.env.DATA_DIR = path.resolve(path.dirname(__filename), "tmp-" + testName);

import "./helpers.js";
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import { setupTmpDir, cleanupTmpDir, TEST_DATA_DIR } from "./helpers.js";

describe("helpers module", () => {
  test("setupTmpDir creates the directory", async () => {
    await setupTmpDir();
    const exists = await fs.access(TEST_DATA_DIR).then(() => true).catch(() => false);
    assert.equal(exists, true);
  });

  test("cleanupTmpDir deletes the directory", async () => {
    await setupTmpDir();
    await cleanupTmpDir();
    const exists = await fs.access(TEST_DATA_DIR).then(() => true).catch(() => false);
    assert.equal(exists, false);
  });

  test("cleanupTmpDir handles deletion errors gracefully", async () => {
    const originalRm = fs.rm;
    fs.rm = async () => {
      throw new Error("Mocked rm error");
    };

    try {
      await cleanupTmpDir();
    } finally {
      fs.rm = originalRm;
    }
  });
});
