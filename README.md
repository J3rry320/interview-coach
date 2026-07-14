# Interview Coach

<p  align="center">

<img src="https://i.ibb.co/p6FW39FX/Chat-GPT-Image-Jul-9-2026-05-45-13-PM.png" width="400">

</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D20-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <a href="https://www.npmjs.com/package/interview-coach"><img src="https://img.shields.io/npm/v/interview-coach?style=for-the-badge" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/interview-coach"><img src="https://img.shields.io/npm/dm/interview-coach?style=for-the-badge" alt="npm downloads"></a>
  <a href="https://github.com/J3rry320/interview-coach/stargazers"><img src="https://img.shields.io/github/stars/J3rry320/interview-coach?style=for-the-badge" alt="github stars"></a>
  <a href="https://github.com/J3rry320/interview-coach/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/interview-coach?style=for-the-badge" alt="npm license"></a>
</p>

<p align="center">
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

### Purpose-Built Interview Workflow

Instead of manually crafting prompts for every session, Interview Coach guides you through a complete interview experience—from role selection and questioning to evaluation and reporting.

### Progress Tracking & Smart Memory

Interview Coach stores your interview history locally, tracks performance over time, and uses recent sessions to focus future interviews on areas where you need the most improvement.

### Bring Your Own Model

Use the LLM provider you prefer—including OpenAI, Anthropic, Groq, Ollama, or any OpenAI-compatible endpoint—without being tied to a single platform or subscription.

### Developer-First Experience

Practice directly from the CLI or launch the local web dashboard for browser-based Text-to-Speech (TTS), Speech-to-Text (STT), interactive analytics, and professional PDF evaluation reports.

### Privacy & Local Control

Interview sessions, configuration, and reports remain on your machine, giving you full ownership of your interview history and API credentials.

---

## Privacy First

### 100% Telemetry-Free

Interview Coach doesn't collect analytics, track usage, or send telemetry.

### Local by Default

Configuration, interview history, reports, and analytics are stored entirely on your machine.

### Your API Keys, Your Control

Credentials are never uploaded or shared beyond the LLM provider you choose.

### Offline with Ollama

When using Ollama, interview prompts and responses remain on your local machine without relying on cloud-hosted models.

---

## Who Is It For?

Interview Coach is designed for anyone who wants structured, repeatable interview practice.

### Candidates & Job Seekers

- **Students & Graduates**: Preparing for internships, graduate programs, or first-time full-time roles.
- **Industry Professionals**: Practicing for software engineering, product management, marketing, sales, finance, consulting, healthcare, law, HR, and more.
- **Career Switchers**: Building confidence while transitioning into a new field or role.

### Enterprise & Administrators

- **Recruiters & Hiring Managers**: Creating consistent interview scenarios, evaluating candidate responses, or training junior interviewers.

### Developers & Power Users

- **AI Enthusiasts**: Customizing the prompt flows with support for OpenAI, Anthropic, Groq, Ollama, and OpenAI-compatible APIs.
- **Privacy-Conscious Users**: Keeping data local, running offline-capable LLMs, and maintaining ownership of configurations and history.

---

## Architecture

<p align="center">
  <img src="assets/architecture.svg" alt="Interview Coach Architecture" width="100%">
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

The configuration wizard guides you through the following setup:

1. **Select Provider**: Choose from `groq`, `openai`, `anthropic`, `ollama`, or `custom` endpoints.
2. **Provider-Specific Settings**:
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

### Key Dashboard Features

#### Local Web Server

Operates locally on `http://localhost:3000` via Express.

#### Navigation & Workspace

- **Dashboard Tab**: The main workspace where you configure new mock sessions, explore history lists, select past reports, and review performance trends.
- **Features Tab**: A detailed feature guide outlining core architectural benefits, speech pipelines, data layers, and token security boundaries.
- **Settings Tab**: A clean, in-browser interface to dynamically update active LLM providers, models, custom endpoints, base URLs, and parameters.

#### Speech Recognition (STT)

Harnesses the browser-native `webkitSpeechRecognition` API. It allows you to click the microphone icon to dictate answers verbally with no heavy Python dependencies, audio binaries, or external paid voice APIs.

#### Speech Synthesis (TTS)

Utilizes the browser-native `SpeechSynthesisUtterance` API. It generates realistic audio readings of interview questions, allowing you to toggle audio playback on/off directly from the main panel.

---

## Reports

### Detailed Evaluation Breakdown

Each answer is graded on a scale of 0–100, deriving precise verdicts (`correct`, `partial`, or `incorrect`).

### Missed Points & Ideal Answers

The evaluator highlights key technical trade-offs or points you omitted, generating a tailored "ideal response" guide for study.

### PDF Report Downloads

Graded session reports can be compiled and downloaded instantly. The application uses `html2pdf.js` to compile the report layout, strength lists, missed points, and ideal answers into a print-ready, branded PDF format.

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

- **CLI Framework**: Commander.js & Inquirer.js
- **Backend API Server**: Express.js
- **Visual Analytics & Charting**: Chart.js
- **PDF Generation**: html2pdf.js
- **Styling**: Tailwind CSS
- **Metadata Badges**: Shields.io

---

## Contributing & Feedback

We welcome and encourage contributions of all kinds! If you find a bug, have an idea for a new feature, or want to suggest better features and advanced functionality, we'd love to hear from you.

- **Find & Report Issues**: Encountered a bug? Check existing issues or open a new one to report it.
- **Recommend Features**: Have suggestions for new capabilities, advanced options, or workflow enhancements? Start a discussion or open a feature request.
- **Submit Pull Requests**: Ready to contribute code? Please check out our [Contributing Guidelines](CONTRIBUTING.md) to set up the development environment, then open a pull request!

---

## About Code Media Labs

Code Media Labs is a digital agency focused on building modern websites, scalable platforms, automation workflows, and creative media experiences.

- Website: [https://codemedialabs.in](https://codemedialabs.in/)

- Email: [hello@codemedialabs.in](mailto:hello@codemedialabs.in)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<a href="https://www.producthunt.com/products/interview-coach-2?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-interview-coach-2" target="_blank" rel="noopener noreferrer"><img alt="Interview Coach - Opensource AI interview coach with local LLM &amp; voice support | Product Hunt" width="250" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1195863&amp;theme=light&amp;t=1784014921159"></a>
