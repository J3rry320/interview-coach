# Interview Coach

<p align="center">
  <img src="https://i.ibb.co/DDLPynLM/Interview-Coach.png" alt="Logo Description" width="400">
</p>

![Node.js](https://img.shields.io/badge/node-%3E%3D20-339933?style=for-the-badge&logo=node.js&logoColor=white)
![CLI](https://img.shields.io/badge/CLI-Terminal_Tool-06b6d4?style=for-the-badge)
![Open Source](https://img.shields.io/badge/Open_Source-MIT-success?style=for-the-badge)
![Groq](https://img.shields.io/badge/GROQ-LLM-black?style=for-the-badge)
![Webpack](https://img.shields.io/badge/Bundled-Webpack-8DD6F9?style=for-the-badge&logo=webpack)
[![npm version](https://img.shields.io/npm/v/interview-coach?style=for-the-badge)](https://www.npmjs.com/package/interview-coach)
[![npm downloads](https://img.shields.io/npm/dm/interview-coach?style=for-the-badge)](https://www.npmjs.com/package/interview-coach)
[![GitHub stars](https://img.shields.io/github/stars/J3rry320/interview-coach?style=for-the-badge)](https://github.com/J3rry320/interview-coach)
[![License](https://img.shields.io/github/license/J3rry320/interview-coach?style=for-the-badge)](https://github.com/J3rry320/interview-coach/blob/main/LICENSE)

AI-powered terminal interview simulator that helps you practice interviews, receive structured feedback, and improve your performance through realistic AI-generated questions.

Built as a Proof of Concept (POC) by Code Media Labs to demonstrate how modern AI can be combined with developer tooling to create practical career-focused applications.

Whether you're preparing for a technical role, content writing position, marketing interview, sales role, design job, or any other profession, Interview Coach adapts to the role you provide and conducts a realistic interview experience directly from your terminal.

## Why We Built This

Interview Coach started as an internal experiment at Code Media Labs to explore:

- AI-powered assessments
- Terminal-first developer experiences
- Structured LLM outputs
- Practical career preparation tools

The project evolved into an open-source Proof of Concept showcasing how AI can be used to create interactive interview and evaluation systems.

## Features

- **Multi-Provider & Offline Support**: Seamlessly integrate with **Groq**, **OpenAI**, **Anthropic Claude**, **Ollama (Offline/Local)**, or any Custom OpenAI-Compatible endpoint. Run completely offline using local LLMs.
- **Interactive Resumption**: Interrupt your interview at any point and resume exactly where you left off.
- **Session History & History Table**: Store and track multiple past interviews. View performance chronologically with `interview-coach history`.
- **Targeted Focus Areas**: Personalize your interview by specifying libraries, tools, or topics (e.g. `React, Docker, system design`).
- **Interactive Report Browser**: View reports for any session by running `interview-coach report` and selecting from an interactive CLI menu of past sessions.
- **Educational Ideal Answer Guides**: Review AI-suggested ideal answers side-by-side with your own for detailed study.
- **Pacing & Duration Tracking**: Displays time taken per answer and average pacing metrics.
- **Skills Analysis**: Groups questions by category and shows visual score progress bars (`[████████░░] 80%`) in the terminal.
- **Local Speech Mode (STT & TTS)**: Conduct interviews entirely using your voice. Speak answers to questions and hear the AI ask them aloud. Utilizes a local, quantized 8-bit ONNX Whisper model (`whisper-tiny.en`) for Speech-to-Text, and native system-level synthesizers (such as macOS `say` with dynamic voice selection, and Windows `System.Speech` PowerShell integration) for Text-to-Speech to guarantee 100% correct pronunciation, zero dependencies, and instant response times.
- **Cross-LLM Data Normalization**: Model-agnostic JSON cleaners extract, map, and cast outputs to prevent schema parsing crashes, even on smaller local models.

---

## Requirements

- Node.js >= 20
- A valid API key for cloud providers (optional if using local Ollama or Custom offline configurations)
- **FFmpeg**: Required for Speech-to-Text (STT) voice recording capture. (Install via `brew install ffmpeg` on macOS, `sudo apt install ffmpeg` on Linux, or `winget install FFmpeg.FFmpeg` on Windows)
- **Native TTS Utilities**: Utilizes pre-installed OS speech engines. (On Linux, ensure `spd-say` or `espeak` is installed: `sudo apt install speech-dispatcher` or `sudo apt install espeak`)

---

## Installation

### Run without installing

```bash
npx interview-coach
```

### Install globally

```bash
npm install -g interview-coach
# or
pnpm add -g interview-coach
# or
yarn global add interview-coach
```

### Verify installation

```bash
interview-coach --version
```

---

## Configuration

Set up your AI provider and parameters interactively:

```bash
interview-coach configure
```

This walkthrough command will prompt you to select your preferred provider, enter custom model names, add API keys, or specify local endpoints with smart defaults.

Alternatively, you can load keys via environment variables:

```bash
export GROQ_API_KEY="YOUR_KEY"
export OPENAI_API_KEY="YOUR_KEY"
export ANTHROPIC_API_KEY="YOUR_KEY"
```

---

## Usage

### Start or Resume an Interview

```bash
interview-coach start
```
If an active incomplete interview is detected, the CLI will ask whether you want to resume it or archive it and start a new session.

### Start with an API Key Override

```bash
interview-coach start -k YOUR_API_KEY
# or
interview-coach start --api-key YOUR_API_KEY
```

### View Interview History

```bash
interview-coach history
```
Displays a table of all past sessions, roles, levels, average scores, progress rates, and statuses.

### View a Report

```bash
interview-coach report
```
If no ID is passed, it loads the active session or presents an interactive list of all past sessions to select from.

```bash
interview-coach report <session-id>
```

### Delete a Session

```bash
interview-coach delete
# or
interview-coach delete <session-id>
```

---

## Example

```bash
$ interview-coach start

Role: Frontend Developer
Difficulty: Senior
Focus Areas (optional): React, performance
Number of questions: 5

★ Question 1/5

Category: React
Difficulty: Medium

How would you optimize a React application experiencing unnecessary re-renders?

Your Answer:
```

---

## Development

```bash
git clone https://github.com/codemedialabs/interview-coach.git
cd interview-coach
npm install
npm run build
```

Useful commands:

```bash
npm run dev       # runs the local entry CLI
npm run build     # compiles with webpack to dist
npm run rebuild   # cleans dist and compiles
npm run clean     # removes dist folder
npm run check     # prints compiled CLI help
```

---

## Project Structure

```txt
bin/
└── cli.js                  # CLI Entrypoint (Commander wrapper)
src/
├── commands/
│   ├── configure.js        # LLM Provider Prompt Walkthrough
│   └── start.js            # Start/Resume Interview Configuration
├── providers/
│   └── llm.js              # Generalized multi-provider client (Groq, OpenAI, Anthropic, Ollama, etc.)
├── schemas/
│   └── sessionSchema.js    # Zod schemas for validation
└── utils/
    ├── answerEvaluator.js  # Candidate answer evaluation wrapper
    ├── config.js           # Configuration loader/writer
    ├── engine.js           # Core interview loop & timer tracking
    ├── evaluateAnswerPrompt.js
    ├── generateQuestionPrompt.js
    ├── normalize.js        # Model-agnostic response cleaner and normalizer
    ├── questionGenerator.js
    ├── renderLogo.js
    ├── session.js          # Multi-session database manager
    ├── showReport.js       # Skills Analysis and pacing reports visual display
    ├── speech.js           # Core speech engine (native TTS playback & ONNX Whisper ASR transcription)
    └── storage.js          # File system directory helper
dist/
└── interview-coach.js      # Bundled distribution
data/
├── active_session_id.json  # Reference to active interview
├── config.json             # AI provider configuration parameters
└── sessions/
    └── session-<id>.json   # Individual session logs
```

---

## Notes

- **Offline Support**: Selecting Ollama or Custom providers bypasses cloud API key checks completely.
- **Auto-Migration**: Any old legacy `data/session.json` database files are auto-migrated to the new structure upon CLI execution.
- **Local Logs**: Session records are saved in your local directory inside `data/sessions/`.
- **JSON Formatting**: Prompt constraints instruct models to return JSON, and internal post-processors extract valid JSON fields even if models append conversational prose.

## Contributing

Contributions, bug reports, feature requests, and improvements are welcome.

Please open an issue or submit a pull request.

## About Code Media Labs

Code Media Labs is a digital agency focused on building modern websites, scalable platforms, automation workflows, branding systems, and creative media experiences.

We work at the intersection of technology, design, branding, and digital marketing to help organizations strengthen their online presence and operate more efficiently.

Website: [https://codemedialabs.in](https://codemedialabs.in/)

Email: [hello@codemedialabs.in](mailto:hello@codemedialabs.in)

## License

MIT License

Copyright (c) 2026 Code Media Labs
