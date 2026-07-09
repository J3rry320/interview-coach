import fs from "fs/promises";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), "data");

const SESSIONS_DIR = path.join(DATA_DIR, "sessions");
const ACTIVE_SESSION_ID_FILE = path.join(DATA_DIR, "active_session_id.json");
const MIGRATED_SESSION_FILE = path.join(DATA_DIR, "session.json");

export async function ensureStorage() {
  await fs.mkdir(DATA_DIR, {
    recursive: true,
  });
  await fs.mkdir(SESSIONS_DIR, {
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

export { DATA_DIR, SESSIONS_DIR, ACTIVE_SESSION_ID_FILE, MIGRATED_SESSION_FILE };
