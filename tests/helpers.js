import fs from "fs/promises";
import path from "path";

// Detect current test file from argv to automatically isolate parallel test runs
const testFile = process.argv.find(arg => arg.endsWith(".test.js") || arg.includes("tests/"));
const suffix = testFile ? "tmp-" + path.basename(testFile, ".test.js") : "tmp";

const TEST_DATA_DIR = path.resolve(process.cwd(), "tests", suffix);
process.env.DATA_DIR = TEST_DATA_DIR;

export async function setupTmpDir() {
  await cleanupTmpDir();
  await fs.mkdir(TEST_DATA_DIR, { recursive: true });
}

export async function cleanupTmpDir() {
  try {
    await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
  }
}

export { TEST_DATA_DIR };
