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

## Features

- Interactive CLI interview experience

- Support for any role or profession

- AI-generated interview questions using Groq

- AI-powered answer evaluation

- Structured scoring and verdicts

- Detailed feedback and improvement suggestions

- Final performance report

- Beautiful terminal UI with progress indicators and formatted reports

- Lightweight bundled CLI distribution

## Why We Built This

Interview Coach started as an internal experiment at Code Media Labs to explore:

- AI-powered assessments

- Terminal-first developer experiences

- Structured LLM outputs

- Practical career preparation tools

The project evolved into an open-source Proof of Concept showcasing how AI can be used to create interactive interview and evaluation systems.

## Requirements

- Node.js >= 20

- A valid Groq API Key

## Installation

### Run without installing

```bash

npx  interview-coach

```

### Install globally with npm

```bash

npm  install  -g  interview-coach

```

### Install globally with pnpm

```bash

pnpm  add  -g  interview-coach

```

### Install globally with Yarn

```bash

yarn  global  add  interview-coach

```

### Verify installation

```bash

interview-coach  --version

```

## Configuration

Interview Coach requires a Groq API key.

### macOS / Linux

```bash

export  GROQ_API_KEY="YOUR_API_KEY"

```

### Windows (PowerShell)

```powershell

$env:GROQ_API_KEY="YOUR_API_KEY"

```

You can also provide the API key directly:

```bash

interview-coach  start  --api-key  YOUR_API_KEY

```

---

## Usage

### Start an Interactive Interview

```bash

interview-coach  start

```

### Start with an API Key

```bash

interview-coach  start  \

-k YOUR_API_KEY

```

```bash

interview-coach  start  \

--api-key YOUR_API_KEY

```

### View the Latest Report

```bash

interview-coach  report

```

### Show Help

```bash

interview-coach  --help

```

### Show Version

```bash

interview-coach  --version

```

## Example

```bash
$  interview-coach  start

Role:  Frontend  Developer
Difficulty:  Senior
Questions:  5

★  Question  1/5

Category:  React
Difficulty:  Medium

How  would  you  optimize  a  React  application  experiencing  unnecessary  re-renders?

Your  Answer:

```

## Development

```bash
git  clone  https://github.com/codemedialabs/interview-coach.git
cd  interview-coach
npm  install
npm  run  build
```

Useful commands:

```bash

npm  run  dev

npm  run  build

npm  run  rebuild

npm  run  clean

npm  run  check

```

## Project Structure

```txt
bin/
├── cli.js
src/
├── commands/
│ └── start.js
├── providers/
│ └── groq.js
├── schemas/
│ └── sessionSchema.js
├── utils/
│ ├── answerEvaluator.js
│ ├── engine.js
│ ├── evaluateAnswerPrompt.js
│ ├── generateQuestionPrompt.js
│ ├── questionGenerator.js
│ ├── renderLogo.js
│ ├── session.js
│ ├── showReport.js
│ └── storage.js
dist/
└── interview-coach.js
data/
└── session.json

```

### File descriptions

- `bin/cli.js` — entrypoint for the published CLI. Parses commands and dispatches to the interview or report workflows.

- `src/commands/start.js` — initiates a new interactive interview session and prompts the user for role, difficulty, and question count.

- `src/providers/groq.js` — wraps the Groq SDK and sends structured prompts to the LLM to return JSON responses.

- `src/schemas/sessionSchema.js` — Zod schema for validating interview session shape before saving to disk.

- `src/utils/answerEvaluator.js` — evaluates the candidate's answer using an AI-generated JSON payload.

- `src/utils/engine.js` — main interview loop: generates questions, asks for answers, evaluates responses, saves state, and displays the final report.

- `src/utils/evaluateAnswerPrompt.js` — builds the prompt text used to evaluate candidate answers.

- `src/utils/generateQuestionPrompt.js` — builds the prompt text used to generate interview questions.

- `src/utils/questionGenerator.js` — requests a new interview question from the Groq provider.

- `src/utils/renderLogo.js` — prints the terminal banner/logo at startup.

- `src/utils/session.js` — handles creation, loading, saving, updating, and deletion of interview session data.

- `src/utils/showReport.js` — renders the final interview report and detailed feedback in the terminal.

- `src/utils/storage.js` — filesystem helpers for ensuring storage directories and checking file existence.

- `dist/interview-coach.js` — bundled CLI distribution produced by Webpack for publishing.

- `data/session.json` — runtime session persistence file created by the CLI for ongoing interview state.

## Notes

- Session data is stored locally.

- The report command displays the latest completed interview.

- Structured JSON outputs are used for both question generation and answer evaluation.

- The default model can be configured inside the Groq provider implementation.

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
