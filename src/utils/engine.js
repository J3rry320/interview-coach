import { input, select } from "@inquirer/prompts";
import boxen from "boxen";
import chalk from "chalk";
import figures from "figures";
import ora from "ora";
import path from "path";
import fs from "fs";

import { addQuestion, loadSession, saveEvaluation } from "../utils/session.js";
import { generateQuestion } from "./questionGenerator.js";
import { evaluateAnswer } from "./answerEvaluator.js";
import { showFinalReport } from "./showReport.js";
import { loadConfig } from "./config.js";
import {
  initializeSpeech,
  speakText,
  recordAudio,
  transcribeAudio,
  isFfmpegInstalled,
} from "./speech.js";

export async function runInterview(session) {
  const config = await loadConfig();
  let speechActive = config.speechEnabled;

  if (speechActive) {
    const speechSpinner = ora("Initializing local Speech Engine (ONNX models)...").start();
    try {
      await initializeSpeech({ tts: config.ttsEnabled, stt: config.sttEnabled });
      speechSpinner.succeed("Speech Engine initialized successfully.");
    } catch (err) {
      speechSpinner.fail("Failed to initialize local Speech Engine: " + err.message);
      console.log(chalk.yellow("Continuing in text-only mode.\n"));
      speechActive = false;
    }
  }

  const startIdx =
    session.questions.length > 0 &&
    !session.questions[session.questions.length - 1].answer
      ? session.questions.length - 1
      : session.questions.length;

  if (startIdx > 0) {
    console.log(
      chalk.yellow(`\nResuming interview from question ${startIdx + 1}...\n`)
    );
  }

  for (let i = startIdx; i < session.totalQuestions; i++) {
    let question;
    let startTime;

    if (i < session.questions.length) {
      question = session.questions[i];
      startTime = Date.now(); // reset timer for resumption
    } else {
      const questionSpinner = ora("Generating question...").start();
      question = await generateQuestion(session);
      questionSpinner.succeed();
      
      question.startTime = new Date().toISOString();
      await addQuestion(question);
      startTime = Date.now();
    }

    const topics = question.expectedTopics ?? [];

    console.log(
      boxen(
        [
          `${figures.star} Question ${i + 1}/${session.totalQuestions}`,
          "",
          `${chalk.bold("Category:")} ${chalk.cyan(question.category ?? "General")}`,
          `${chalk.bold("Difficulty:")} ${chalk.yellow(question.difficulty ?? "N/A")}`,
          "",
          chalk.whiteBright(question.question),
          "",
          chalk.gray("Expected Areas:"),
          ...topics.map((topic) => `${chalk.gray(figures.bullet)} ${topic}`),
        ].join("\n"),
        {
          padding: 1,
          borderColor: "blue",
          title: "Interview Question",
          titleAlignment: "center",
        },
      ),
    );

    if (speechActive && config.ttsEnabled) {
      try {
        console.log(chalk.gray("🎤 AI is speaking question..."));
        await speakText(question.question);
      } catch (err) {
        console.error(chalk.red(`\n[TTS Playback Error]: ${err.message}`));
      }
    }

    let answer = "";
    let loopRecord = speechActive && config.sttEnabled;

    if (loopRecord && !isFfmpegInstalled()) {
      console.log(chalk.red("\nError: FFmpeg is not installed on your system."));
      console.log(chalk.yellow("Please install FFmpeg to use voice answers (e.g. 'brew install ffmpeg' on macOS)."));
      console.log(chalk.gray("Falling back to keyboard input for this question.\n"));
      loopRecord = false;
    }

    if (loopRecord) {
      while (loopRecord) {
        const answerMode = await select({
          message: "How would you like to answer?",
          choices: [
            { name: "🎤 Speak answer", value: "speak" },
            { name: "⌨️  Type/keyboard input", value: "type" },
          ],
        });

        if (answerMode === "speak") {
          const rawPcmPath = path.resolve(process.cwd(), "data", `temp_response_${Date.now()}.raw`);
          try {
            await recordAudio(rawPcmPath);
            const transSpinner = ora("Transcribing your answer...").start();
            const transcription = await transcribeAudio(rawPcmPath);
            transSpinner.succeed("Transcription finished.");

            console.log(chalk.cyan(`\nTranscribed Answer: "${transcription}"\n`));

            answer = await input({
              message: "Your Answer (edit or press Enter to submit):",
              default: transcription,
            });
            loopRecord = false;
          } catch (err) {
            console.error(chalk.red(`\nRecording/Transcription failed: ${err.message}`));
            console.log(chalk.yellow("Please try again or fallback to keyboard input."));
          } finally {
            try {
              if (fs.existsSync(rawPcmPath)) {
                fs.unlinkSync(rawPcmPath);
              }
            } catch {}
          }
        } else {
          answer = await input({
            message: "Your Answer:",
          });
          loopRecord = false;
        }
      }
    } else {
      answer = await input({
        message: "Your Answer:",
      });
    }

    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    const evalSpinner = ora("Evaluating answer...").start();

    const evaluation = await evaluateAnswer({
      role: session.role,
      question: question.question,
      expectedTopics: question.expectedTopics,
      answer,
    });

    evalSpinner.succeed();

    await saveEvaluation({
      questionId: i,
      answer,
      evaluation,
      durationSeconds,
    });

    console.log(`Score: ${evaluation.score}`);

    console.log(evaluation.feedback);

    if (speechActive && config.ttsEnabled) {
      try {
        console.log(chalk.gray("🎤 AI is speaking review..."));
        await speakText(evaluation.feedback);
      } catch (err) {
        console.error(chalk.red(`\n[TTS Playback Error]: ${err.message}`));
      }
    }

    session = await loadSession();
  }

  await showFinalReport(session);
}
