# Interview Coach

<p  align="center">

<img src="https://i.ibb.co/p6FW39FX/Chat-GPT-Image-Jul-9-2026-05-45-13-PM.png" width="400">

</p>

<p  align="center">

<img src="https://img.shields.io/badge/node-%3E%3D20-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">

<a href="https://www.npmjs.com/package/interview-coach"><img src="https://img.shields.io/npm/v/interview-coach?style=for-the-badge" alt="npm version"></a>

<a href="https://www.npmjs.com/package/interview-coach"><img src="https://img.shields.io/npm/dm/interview-coach?style=for-the-badge" alt="npm downloads"></a>

<a href="https://github.com/J3rry320/interview-coach/stargazers"><img src="https://img.shields.io/github/stars/J3rry320/interview-coach?style=for-the-badge" alt="github stars"></a>

<a href="https://github.com/J3rry320/interview-coach/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/interview-coach?style=for-the-badge" alt="npm license"></a>

</p>

<p  align="center">

<img src="https://img.shields.io/badge/Open_Source-MIT-success?style=for-the-badge" alt="Open Source">

<img src="https://img.shields.io/badge/Telemetry-Zero-black?style=for-the-badge" alt="Zero Telemetry">

<img src="https://img.shields.io/badge/BYOM-Bring_Your_Own_Model-blue?style=for-the-badge" alt="BYOM">

<img src="https://img.shields.io/badge/Offline-Ollama_Support-orange?style=for-the-badge" alt="Offline Ollama Support">

</p>

AI-powered dual-mode interview simulator that helps you practice interviews, receive structured evaluations, and track progress either directly through your terminal or via a gorgeous local Web Dashboard.

---

## Table of Contents

- [Why We Built This](#why-we-built-this)

- [Why Not ChatGPT?](#why-not-chatgpt)

- [Privacy & Target Audience](#privacy--target-audience)

- [Architecture](#architecture)

- [Quick Start](#quick-start)

- [Commands](#commands)

- [Configuration](#configuration)

- [Dashboard](#dashboard)

- [Reports](#reports)

- [Environment Variables](#environment-variables)

- [Developer Guide](#developer-guide)

- [Roadmap](#roadmap)

- [Powered By](#powered-by)

- [License](#license)

---

## Why We Built This

Most interview preparation tools are expensive, locked to a single AI provider, or rely on generic question banks. Interview Coach was built to provide a free, open-source alternative that lets you practice realistic interviews using the models you already trust, whether that's OpenAI, Anthropic, Groq, Ollama, or your own OpenAI-compatible endpoint.

With version `2.0.0`, we transitioned from a voice-heavy CLI with fragile local system dependencies to a unified **Dual-Mode Architecture**:

- **Terminal CLI**: A blazingly fast, text-only interactive CLI.

- **Web Dashboard**: A local web interface leveraging browser-native speech recognition and synthesis APIs for 100% reliable voice practice without the need to download large machine learning libraries or install binary tools like FFmpeg.

---

## Why Not ChatGPT?

While ChatGPT is excellent for general interview preparation, **Interview Coach** is purpose-built for structured, repeatable mock interviews.

- **Purpose-Built Interview Workflow**: Instead of manually crafting prompts for every session, Interview Coach guides you through a complete interview experience—from role selection and questioning to evaluation and reporting.
- **Progress Tracking & Smart Memory**: Interview Coach stores your interview history locally, tracks performance over time, and uses recent sessions to focus future interviews on areas where you need the most improvement.
- **Bring Your Own Model**: Use the LLM provider you prefer—including OpenAI, Anthropic, Groq, Ollama, or any OpenAI-compatible endpoint—without being tied to a single platform or subscription.
- **Developer-First Experience**: Practice directly from the CLI or launch the local web dashboard for browser-based Text-to-Speech (TTS), Speech-to-Text (STT), interactive analytics, and professional PDF evaluation reports.
- **Privacy & Local Control**: Interview sessions, configuration, and reports remain on your machine, giving you full ownership of your interview history and API credentials.

---

## Privacy First

- **100% Telemetry-Free**: Interview Coach doesn't collect analytics, track usage, or send telemetry.
- **Local by Default**: Configuration, interview history, reports, and analytics are stored entirely on your machine.
- **Your API Keys, Your Control**: Credentials are never uploaded or shared beyond the LLM provider you choose.
- **Offline with Ollama**: When using Ollama, interview prompts and responses remain on your local machine without relying on cloud-hosted models.

---

## Who Is It For?

Interview Coach is designed for anyone who wants structured, repeatable interview practice, including:

- **Students & Job Seekers** preparing for internships, graduate programs, or full-time roles.
- **Professionals Across Any Industry** practicing for interviews in software engineering, product management, marketing, sales, finance, consulting, healthcare, education, law, human resources, customer success, and more.
- **Career Switchers** building confidence while transitioning into a new field or role.
- **Recruiters, Hiring Managers & Trainers** creating consistent interview scenarios, evaluating responses, or training interviewers.
- **Developers & AI Enthusiasts** looking for a customizable interview framework with support for OpenAI, Anthropic, Groq, Ollama, and OpenAI-compatible APIs.
- **Privacy-Conscious Users** who value local storage, offline-capable workflows, and complete control over their interview history and configuration.

---

## Architecture

<p  align="center">

<svg  xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 800 240"  width="100%"  height="auto"  style="background:#09090b; border-radius:12px; border:1px solid rgba(255,255,255,0.08); font-family:system-ui, -apple-system, sans-serif;">

<defs>

<marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">

<path d="M 0 0 L 10 5 L 0 10 z" fill="#a1a1aa"  />

</marker>

</defs>

<!-- Row titles -->

<text x="20" y="35" fill="#a1a1aa" font-size="12" font-weight="bold" letter-spacing="1">INTERFACES</text>

<text x="240" y="35" fill="#a1a1aa" font-size="12" font-weight="bold" letter-spacing="1">CONTROL LAYER</text>

<text x="460" y="35" fill="#a1a1aa" font-size="12" font-weight="bold" letter-spacing="1">INTELLIGENCE LAYER</text>

<text x="680" y="35" fill="#a1a1aa" font-size="12" font-weight="bold" letter-spacing="1">PROVIDERS (BYOM)</text>

<!-- Node 1: Frontends -->

<rect x="20" y="55" width="180" height="150" rx="8" fill="#18181b" stroke="rgba(255,255,255,0.08)" stroke-width="1.5" />

<text x="110" y="90" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">Interactive UI</text>

<rect x="35" y="115" width="150" height="30" rx="4" fill="#27272a" stroke="rgba(255,255,255,0.04)" />

<text x="110" y="134" fill="#e4e4e7" font-size="12" text-anchor="middle">Terminal CLI</text>

<rect x="35" y="155" width="150" height="30" rx="4" fill="#27272a" stroke="rgba(255,255,255,0.04)" />

<text x="110" y="174" fill="#e4e4e7" font-size="12" text-anchor="middle">Web Dashboard</text>

<!-- Node 2: Server -->

<rect x="240" y="55" width="180" height="150" rx="8" fill="#18181b" stroke="rgba(255,255,255,0.08)" stroke-width="1.5" />

<text x="330" y="90" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">Express Backend</text>

<rect x="255" y="115" width="150" height="30" rx="4" fill="#27272a" stroke="rgba(255,255,255,0.04)" />

<text x="330" y="134" fill="#e4e4e7" font-size="12" text-anchor="middle">Session Manager</text>

<rect x="255" y="155" width="150" height="30" rx="4" fill="#27272a" stroke="rgba(255,255,255,0.04)" />

<text x="330" y="174" fill="#e4e4e7" font-size="12" text-anchor="middle">REST API Endpoints</text>

<!-- Node 3: Intelligence -->

<rect x="460" y="55" width="180" height="150" rx="8" fill="#18181b" stroke="rgba(255,255,255,0.08)" stroke-width="1.5" />

<text x="550" y="90" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">Core Engine</text>

<rect x="475" y="115" width="150" height="30" rx="4" fill="#27272a" stroke="rgba(255,255,255,0.04)" />

<text x="550" y="134" fill="#e4e4e7" font-size="12" text-anchor="middle">Smart Context Builder</text>

<rect x="475" y="155" width="150" height="30" rx="4" fill="#27272a" stroke="rgba(255,255,255,0.04)" />

<text x="550" y="174" fill="#e4e4e7" font-size="12" text-anchor="middle">Safety Guardrails</text>

<!-- Node 4: LLMs -->

<rect x="680" y="55" width="100" height="150" rx="8" fill="#18181b" stroke="rgba(255,255,255,0.08)" stroke-width="1.5" />

<text x="730" y="85" fill="#ffffff" font-size="13" font-weight="bold" text-anchor="middle">Agnostic LLM</text>

<text x="730" y="115" fill="#a1a1aa" font-size="11" text-anchor="middle">Groq / OpenAI</text>

<text x="730" y="135" fill="#a1a1aa" font-size="11" text-anchor="middle">Anthropic</text>

<text x="730" y="155" fill="#a1a1aa" font-size="11" text-anchor="middle">Ollama (Local)</text>

<text x="730" y="175" fill="#a1a1aa" font-size="11" text-anchor="middle">Custom API</text>

<!-- Connector Arrows -->

<line x1="200" y1="130" x2="234" y2="130" stroke="#3f3f46" stroke-width="2" marker-end="url(#arrow)" />

<line x1="420" y1="130" x2="454" y2="130" stroke="#3f3f46" stroke-width="2" marker-end="url(#arrow)" />

<line x1="640" y1="130" x2="674" y2="130" stroke="#3f3f46" stroke-width="2" marker-end="url(#arrow)" />

</svg>

</p>

---

## Quick Start

Get up and running in seconds. No global install required.

1.  **Initialize configuration wizard:**

```bash

npx interview-coach configure

```

2.  **Start your mock interview session:**

```bash

npx interview-coach start

```

---

## Commands

### `interview-coach start`

Initializes a mock interview session. This interactive prompt dynamically sets up the structure of the simulation.

```bash

interview-coach  start

```

**Custom API Key Override:**

Pass a one-off API key directly in your terminal command:

```bash

interview-coach  start  --api-key  "gsk_xxxxxxx"

```

**Interview Loop Walkthrough:**

1.  **Interface Choice**: Choose `Browser (Voice & Dashboard)` or `CLI (Text Terminal)`.

2.  **Target Role**: Input the role you are targeting (e.g. `Senior React Engineer`, `Data Analyst`, `Product Manager`).

3.  **Seniority Level**: Select from `junior`, `mid`, or `senior`.

4.  **Focus Areas** _(Optional)_: Specify target skills (e.g. `GraphQL, Redux, Performance Optimization`).

5.  **Interview Length**: Choose how many questions to simulate.

---

### `interview-coach history`

Renders a neat, colored ASCII table inside your terminal detailing all past sessions.

```bash

interview-coach  history

```

---

### `interview-coach report`

Displays the full, graded evaluation breakdown of a specific mock interview session.

```bash

# View active or select from interactive history list:

interview-coach  report



# View specific session directly (requires at least the first 8 characters of the ID):

interview-coach  report  a8d8f0e0

```

---

### `interview-coach delete`

Removes an interview session from your local database file system.

```bash

# Select from interactive history list to delete:

interview-coach  delete



# Delete specific session directly (requires at least the first 8 characters of the ID):

interview-coach  delete  a8d8f0e0

```

---

## Configuration

### `interview-coach configure`

Before starting your first session, you need to configure your LLM provider. Run this interactive wizard to hook up your preferred provider and adjust settings.

```bash

interview-coach  configure

```

**Interactive Walkthrough Prompts:**

1.  **Select Provider**: Choose from `groq`, `openai`, `anthropic`, `ollama`, or `custom` endpoints.

2.  **Provider-Specific Settings**:

- **Groq**: Model Name, API Key

- **OpenAI**: Model Name, API Key, Base URL (optional proxy)

- **Anthropic**: Model Name, API Key

- **Ollama**: Ollama Base URL, Model Name, Request Timeout (minutes, defaults to 5)

- **Custom**: Base URL, Model Name, API Key (optional), Request Timeout (minutes, defaults to 5)

> [!NOTE]
> The **Request Timeout** configuration option is particularly useful for local or offline models. Since local model generation can take a few minutes to warm up and load weights into memory on the first request, the default 5-minute timeout helps prevent `UND_ERR_HEADERS_TIMEOUT` failures.

> [!TIP]
> All configurations are saved locally in `./data/config.json` relative to your current workspace directory. You can inspect or modify this file directly to adjust your configurations. You can also bypass the configuration wizard entirely by setting environment variables in your shell (e.g., `GROQ_API_KEY`, `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY`).

---

## Dashboard

### `interview-coach web`

Starts the local Express REST API backend server and automatically launches the monochromatic Web Dashboard in your default web browser.

```bash

interview-coach  web

```

- **Server Port**: Operates on `http://localhost:3000`.

- **Top Navigation Bars**:

- **Dashboard**: The main workspace where you configure new mock sessions, explore history lists, select past reports, and review performance trends.

- **Features**: A detailed feature guide outlining core architectural benefits, including speech pipelines, summarized data layers, and token security boundaries.

- **Settings**: A clean, in-browser interface to dynamically update your active LLM provider, models, custom endpoints, base URLs, and parameters.

- **Speech Recognition (STT)**:

- Harnesses the browser-native `webkitSpeechRecognition` API.

- Allows you to click the microphone icon to dictate answers verbally. No heavy Python dependencies, audio binaries, or external voice APIs are required.

- **Speech Synthesis (TTS)**:

- Utilizes the browser-native `SpeechSynthesisUtterance` API.

- Generates realistic audio readings of interview questions. You can toggle audio playback on/off directly from the main panel.

---

## Reports

- **Detailed Evaluation breakdown**: Each answer is instantly graded across a scale of 0-100, deriving verdicts (`correct`, `partial`, `incorrect`).

- **Missed Points & Ideal Answers**: Evaluator highlights key technical trade-offs that you omitted and generates an ideal response guide.

- **PDF Report Downloads**:

- Graded session reports can be compiled and downloaded instantly.

- Uses `html2pdf.js` to compile the report layout, strength lists, missed points, and ideal answers into a print-ready, branded PDF format.

---

## Environment Variables

| Environment Variable | Description                                                                                                       | Example                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `GROQ_API_KEY`       | API key for Groq models.                                                                                          | `gsk_xxxxxxxxxxxx`     |
| `OPENAI_API_KEY`     | API key for OpenAI models.                                                                                        | `sk-proj-xxxxxxxxxxxx` |
| `ANTHROPIC_API_KEY`  | API key for Anthropic Claude models.                                                                              | `sk-ant-xxxxxxxxxxxx`  |
| `DATA_DIR`           | Optional directory for storing configuration, interview sessions, reports, analytics, and other application data. | `./my-custom-data/`    |

---

## Developer Guide

### Development Installation

1. Clone the repository and install dependencies:

```bash

git clone https://github.com/J3rry320/interview-coach.git

cd interview-coach

npm install

```

2. Build distribution modules:

```bash

npm run build

```

3. Run the locally built application:

```bash

# Run configuration wizard:
node dist/interview-coach.js configure

# Start the mock interview session:
node dist/interview-coach.js start

```

### Running Tests & Code Coverage

All core logic is validated using Node's native test runner:

```bash

npm  test

```

**Latest Package Coverage Statistics:**

- **Line Coverage**: `100.00%`

- **Branch Coverage**: `91.67%`

- **Function Coverage**: `100.00%`

---

## Roadmap

- [ ] **AI-driven voice variety**: Customize vocal pitches, speed, and accents directly from settings.

- [ ] **Fine-tuned local models**: Pre-configure Ollama system files with behavioral weights for target industries.

- [ ] **Realtime Speech Pacing Hints**: Visual warnings on the dashboard when response speed exceeds optimal words-per-minute target boundaries.

- [ ] **Interactive Resume Parsing**: Feed your CV/resume PDF directly to personalize candidate context.

---

## Powered By

- **Commander.js** (CLI Framework)

- **Express.js** (Backend API Server)

- **Inquirer.js** (CLI Prompting)

- **Chart.js** (Visual Analytics)

- **html2pdf.js** (PDF Generation)

- **Tailwind.css** (CSS Library)

- **Shields.io** (Metadata Badges)

---

## About Code Media Labs

Code Media Labs is a digital agency focused on building modern websites, scalable platforms, automation workflows, and creative media experiences.

- Website: [https://codemedialabs.in](https://codemedialabs.in/)

- Email: [hello@codemedialabs.in](mailto:hello@codemedialabs.in)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
