import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "data");

const SESSION_FILE = path.join(DATA_DIR, "session.json");

export async function ensureStorage() {
  await fs.mkdir(DATA_DIR, {
    recursive: true,
  });
}

export async function fileExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

export { SESSION_FILE };
