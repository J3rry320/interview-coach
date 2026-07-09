import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";
import readline from "readline";
import { pipeline } from "@huggingface/transformers";
import chalk from "chalk";
import { loadConfig } from "./config.js";

let sttPipeline = null;

/**
 * Lists available English voices on macOS.
 * @returns {Array<{name: string, value: string}>}
 */
export function getMacVoices() {
  if (process.platform !== "darwin") return [];
  try {
    const output = execSync("say -v \\?", { encoding: "utf8" });
    const voices = [];
    const lines = output.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const match = trimmed.match(/^([^\t#]+?)\s+(en_[A-Z]{2})\s*#/);
      if (match) {
        const voiceName = match[1].trim();
        const locale = match[2].trim();
        voices.push({ name: `${voiceName} (${locale})`, value: voiceName });
      }
    }
    return voices;
  } catch {
    return [];
  }
}

/**
 * Checks if FFmpeg is installed and accessible in the system PATH.
 * @returns {boolean}
 */
export function isFfmpegInstalled() {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Lazy-loads the required ONNX pipelines.
 * @param {Object} options
 * @param {boolean} options.tts
 * @param {boolean} options.stt
 */
export async function initializeSpeech(options = { tts: false, stt: false }) {
  if (options.tts && process.platform === "linux") {
    try {
      execSync("command -v spd-say || command -v espeak", { stdio: "ignore" });
    } catch {
      console.log(chalk.yellow("\n[Warning] No TTS engine found on Linux."));
      console.log(chalk.gray("To enable TTS, please install speech-dispatcher or espeak:"));
      console.log(chalk.gray("sudo apt-get install speech-dispatcher"));
      console.log(chalk.gray("Continuing without TTS..."));
      options.tts = false; // Fallback gracefully if missing
    }
  }

  if (options.stt && !sttPipeline) {
    try {
      sttPipeline = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en", {
        quantized: true,
      });
    } catch (err) {
      console.log(chalk.red(`\n[Warning] Failed to initialize local STT model: ${err.message}`));
      console.log(chalk.gray("This can happen if the Hugging Face cache is inaccessible or network is down."));
      console.log(chalk.gray("Speech-to-Text will be disabled for this session."));
      throw err; // Rethrow to let engine.js handle fallback
    }
  }
}

/**
 * Synthesizes text to speech using MMS-TTS and plays it via system utility.
 * @param {string} text
 */
export async function speakText(text) {
  const config = await loadConfig();
  const voice = config.ttsVoice || "Default";

  return new Promise((resolve, reject) => {
    let cmd = "";
    const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

    if (process.platform === "darwin") {
      if (voice === "Default") {
        cmd = `say "${escaped}"`;
      } else {
        cmd = `say -v "${voice}" "${escaped}"`;
      }
    } else if (process.platform === "win32") {
      if (voice === "Default") {
        cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.Speak(\\"${escaped}\\")"`;
      } else {
        cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.SelectVoice(\\"${voice}\\"); $synth.Speak(\\"${escaped}\\")"`;
      }
    } else if (process.platform === "linux") {
      cmd = `spd-say "${escaped}" || espeak "${escaped}"`;
    } else {
      return reject(new Error("Unsupported platform for native text-to-speech"));
    }

    const exec = spawn(cmd, { shell: true, stdio: "ignore" });
    exec.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Native speak command exited with code ${code}`));
    });
  });
}

/**
 * Attempts to dynamically discover the first available DirectShow audio device on Windows.
 * @returns {string} The name of the audio device, or "audio=Default" as a fallback.
 */
function getWindowsAudioDevice() {
  try {
    const output = execSync('ffmpeg -list_devices true -f dshow -i dummy 2>&1', { encoding: 'utf8' });
    // Parse the output to find "DirectShow audio devices" section
    const lines = output.split('\n');
    let inAudioSection = false;
    for (const line of lines) {
      if (line.includes('DirectShow audio devices')) {
        inAudioSection = true;
        continue;
      }
      if (inAudioSection && line.includes(']  "')) {
        const match = line.match(/\]\s+"([^"]+)"/);
        if (match) {
          return `audio=${match[1]}`;
        }
      }
      if (inAudioSection && line.includes('DirectShow video devices')) {
        inAudioSection = false; // Just in case the order is different
      }
    }
  } catch (err) {
    // execSync throws if exit code > 0. ffmpeg dummy always exits > 0, so we MUST parse err.stdout or err.stderr
    const output = err.stdout?.toString() + err.stderr?.toString() || err.message;
    const lines = output.split('\n');
    let inAudioSection = false;
    for (const line of lines) {
      if (line.includes('DirectShow audio devices')) {
        inAudioSection = true;
        continue;
      }
      if (inAudioSection && line.includes(']  "')) {
        const match = line.match(/\]\s+"([^"]+)"/);
        if (match) {
          return `audio=${match[1]}`;
        }
      }
      if (inAudioSection && line.includes('DirectShow video devices')) {
        inAudioSection = false;
      }
    }
  }
  return "audio=Default"; // Fallback
}

/**
 * Spawns FFmpeg to record audio from microphone to s16le raw format.
 * Waits for user to press [Enter] to terminate recording.
 * @param {string} outputPath
 * @returns {Promise<void>}
 */
export function recordAudio(outputPath) {
  return new Promise((resolve, reject) => {
    if (!isFfmpegInstalled()) {
      return reject(new Error("FFmpeg is not installed. Please install FFmpeg to use voice features."));
    }

    let args = [];
    if (process.platform === "darwin") {
      // macOS: avfoundation, default input device (index 0 is usually the primary mic)
      args = ["-f", "avfoundation", "-i", ":0", "-ar", "16000", "-ac", "1", "-f", "s16le", "-y", outputPath];
    } else if (process.platform === "linux") {
      // Linux: pulse audio default device
      args = ["-f", "pulse", "-i", "default", "-ar", "16000", "-ac", "1", "-f", "s16le", "-y", outputPath];
    } else if (process.platform === "win32") {
      // Windows: Dynamically discover capture device instead of assuming "Default" exists
      const device = getWindowsAudioDevice();
      args = ["-f", "dshow", "-i", device, "-ar", "16000", "-ac", "1", "-f", "s16le", "-y", outputPath];
    } else {
      return reject(new Error("Unsupported platform for audio recording"));
    }

    const recordProc = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let ffmpegStderr = "";
    
    recordProc.stderr.on("data", (data) => {
      const output = data.toString();
      ffmpegStderr += output;
      // macOS specific warning
      if (output.includes("Failed to create AV capture input device")) {
        console.log(chalk.red("\n[Warning] macOS blocked microphone access or the device is unavailable."));
        console.log(chalk.yellow("Please check System Settings > Privacy & Security > Microphone and ensure your terminal has permission."));
      }
      // Windows specific warning
      if (output.includes("Input/output error") || output.includes("Could not open audio device")) {
        console.log(chalk.red("\n[Warning] Windows blocked microphone access or the device is unavailable."));
        console.log(chalk.yellow("Please check Settings > Privacy & security > Microphone and ensure 'Let desktop apps access your microphone' is enabled."));
      }
    });

    console.log(chalk.cyan("\nRecording... Speak your answer now."));
    console.log(chalk.bold.red(">>> Press [Enter] to stop recording <<< \n"));

    // Fallback: allow the user to press Enter to stop if silence detection fails
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    let finished = false;

    const cleanup = () => {
      if (finished) return;
      finished = true;
      process.stdin.removeListener("data", onData);
      process.stdin.pause();
    };

    const onData = (key) => {
      if (key.includes("\r") || key.includes("\n") || key.includes("\u0003")) {
        cleanup();
        recordProc.kill("SIGKILL");
      }
    };

    process.stdin.on("data", onData);

    recordProc.on("exit", (code, signal) => {
      cleanup();
      const normalExit = code === 0 || code === 255 || signal === "SIGTERM" || signal === "SIGKILL" || code === 143 || code === 137;
      if (normalExit) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with error code ${code}. Stderr:\n${ffmpegStderr}`));
      }
    });

    recordProc.on("error", (err) => {
      cleanup();
      reject(err);
    });
  });
}

/**
 * Transcribes s16le raw audio using local Whisper ONNX model.
 * @param {string} rawPcmPath
 * @returns {Promise<string>}
 */
export async function transcribeAudio(rawPcmPath) {
  if (!sttPipeline) {
    throw new Error("STT Pipeline not initialized. Call initializeSpeech({ stt: true }) first.");
  }

  if (!fs.existsSync(rawPcmPath)) {
    throw new Error(`PCM file not found: ${rawPcmPath}`);
  }

  const buffer = fs.readFileSync(rawPcmPath);
  
  // If the audio file is empty (e.g. ffmpeg was immediately killed or failed silently),
  // return empty string to avoid Whisper hallucinating text (like "you").
  if (buffer.length === 0) {
    return "";
  }

  const samples = new Float32Array(buffer.length / 2);
  for (let i = 0; i < samples.length; i++) {
    const intSample = buffer.readInt16LE(i * 2);
    samples[i] = intSample / 32768.0;
  }

  // Provide chunk_length_s to prevent failure on long audio recordings
  const transcription = await sttPipeline(samples, { chunk_length_s: 30, stride_length_s: 5 });
  
  // Safely extract text whether the pipeline returns an object or an array of objects
  const text = Array.isArray(transcription) ? transcription[0]?.text : transcription?.text;
  return (text || "").trim();
}


