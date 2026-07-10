# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-07-10

### Added

- **Dual-Mode Architecture**: Seamless transition between interactive Terminal CLI and browser-based Web Dashboard.
- **Web Dashboard**: Local Express-powered web application serving visual analytics, session tracking, and dashboard settings.
- **Browser-Native Speech Pipeline**: Support for Speech-to-Text (STT) and Text-to-Speech (TTS) leveraging standard browser speech synthesis and recognition APIs.
- **Multi-Provider LLM Integration**: Added native support for OpenAI, Anthropic, Ollama, and Custom OpenAI-compatible endpoints alongside Groq.
- **Native Test Coverage**: Added testing with Node.js's native test runner (`node --test`).
- **PDF Report Export**: Render and download graded interview feedback sheets locally as a PDF.
- **Custom Local Model Timeout**: Adjustable request timeouts (defaulting to 5 minutes) via `configure` to prevent timeouts on slow hardware during local generation.

## [1.0.0] - 2026-05-29

### Added

- Interactive CLI interview workflow
- Groq-powered question generation
- Groq-powered answer evaluation
- Session persistence
- Detailed interview reports
- Webpack bundling
- Role-agnostic interview support
- Structured feedback system
