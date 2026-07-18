# Installation Guide

This guide provides step-by-step instructions to set up **Interview Coach** on your system, including installing **Node.js**, setting up **Ollama** for offline/local LLM usage, and installing the `interview-coach` package itself.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [1. Installing Node.js](#1-installing-nodejs)
  - [macOS](#macos)
  - [Windows](#windows)
  - [Linux](#linux)
  - [Verifying Node.js Installation](#verifying-nodejs-installation)
- [2. Installing Ollama (Optional for Local Models)](#2-installing-ollama-optional-for-local-models)
  - [macOS](#macos-1)
  - [Windows](#windows-1)
  - [Linux](#linux-1)
  - [Verifying & Setting Up Ollama](#verifying--setting-up-ollama)
- [3. Installing Interview Coach](#3-installing-interview-coach)
  - [Option A: Global Installation (Recommended)](#option-a-global-installation-recommended)
  - [Option B: Running via npx (No Installation Needed)](#option-b-running-via-npx-no-installation-needed)
  - [Option C: Local Development Setup](#option-c-local-development-setup)
- [4. Next Steps](#4-next-steps)

---

## Prerequisites

- **Node.js**: `v20.0.0` or higher is required.
- **npm**: Included automatically with Node.js.
- **Ollama**: (Optional) Required only if you intend to run local offline LLM models without cloud API keys.

---

## 1. Installing Node.js

Interview Coach requires Node.js version 20 or higher. Follow the platform-specific instructions below for your operating system:

### macOS

#### Method 1: Using Homebrew (Recommended)
If you have [Homebrew](https://brew.sh/) installed:
```bash
brew install node
```

#### Method 2: Using nvm (Node Version Manager)
```bash
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Restart your terminal or reload environment, then install Node.js v20+
nvm install 20
nvm use 20
```

#### Method 3: Official Installer
Download and run the macOS `.pkg` installer directly from the official website:
[nodejs.org Downloads](https://nodejs.org/en/download)

---

### Windows

#### Method 1: Using Winget (Windows Package Manager)
Run Windows Terminal or PowerShell as Administrator:
```powershell
winget install OpenJS.NodeJS
# Or for a specific version:
winget install OpenJS.NodeJS.LTS
```

#### Method 2: Using nvm-windows
1. Download `nvm-setup.exe` from [nvm-windows releases](https://github.com/coreybutler/nvm-windows/releases).
2. Run the installer and then in Command Prompt / PowerShell:
```cmd
nvm install 20
nvm use 20
```

#### Method 3: Official Windows Installer (.msi)
Download the 64-bit `.msi` installer from [nodejs.org Downloads](https://nodejs.org/en/download) and follow the setup wizard.

---

### Linux

#### Method 1: Using NodeSource (Ubuntu / Debian / Linux Mint)
```bash
# Install Node.js v20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Method 2: Using nvm (Recommended for multi-version management)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload terminal shell, then run:
nvm install 20
nvm use 20
```

#### Method 3: Distribution Package Managers
- **Arch Linux**:
  ```bash
  sudo pacman -S nodejs npm
  ```
- **Fedora / RHEL**:
  ```bash
  sudo dnf install nodejs npm
  ```

---

### Verifying Node.js Installation

Verify that Node.js (>= 20) and npm are properly installed by running:

```bash
node -v
npm -v
```

Output should show `v20.x.x` or higher for Node.js.

---

## 2. Installing Ollama (Optional for Local Models)

Ollama allows you to run open-source Large Language Models (LLMs) locally on your hardware with 100% data privacy and zero API costs.

### macOS

#### Method 1: Using Homebrew
```bash
brew install --cask ollama
```

#### Method 2: Direct Download
Download the macOS app from [ollama.com/download/mac](https://ollama.com/download/Ollama-darwin.zip), unzip it, and drag it to your Applications folder.

---

### Windows

1. Download the Windows installer from [ollama.com/download/windows](https://ollama.com/download/OllamaSetup.exe).
2. Run `OllamaSetup.exe` and follow the installer steps.
3. Alternatively via Winget:
   ```powershell
   winget install Ollama.Ollama
   ```

---

### Linux

Install Ollama instantly using the official install script:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

---

### Verifying & Setting Up Ollama

1. Start the Ollama server if it isn't running automatically:
   ```bash
   ollama serve
   ```
2. Pull your desired model (e.g. Llama 3 or Mistral):
   ```bash
   ollama pull llama3
   ```
3. Test the model in terminal:
   ```bash
   ollama run llama3
   ```

---

## 3. Installing Interview Coach

You can install and use Interview Coach through any of the following options:

### Option A: Global Installation (Recommended)

Install `interview-coach` globally via `npm` to make the executable available across your system:

```bash
npm install -g interview-coach
```

Verify global installation:
```bash
interview-coach --help
```

---

### Option B: Running via npx (No Installation Needed)

If you prefer not to install packages globally, run directly using `npx`:

```bash
# Configure API keys / providers
npx interview-coach configure

# Start mock interview session
npx interview-coach start
```

---

### Option C: Local Development Setup

To build or modify Interview Coach from source code:

1. Clone the official repository:
   ```bash
   git clone https://github.com/J3rry320/interview-coach.git
   cd interview-coach
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the production package:
   ```bash
   npm run build
   ```

4. Run locally:
   ```bash
   # Run configuration wizard
   node dist/interview-coach.js configure

   # Run interview session
   node dist/interview-coach.js start
   ```

---

## 4. Next Steps

Once installation is complete, configure your environment and run your first interview:

```bash
interview-coach configure
interview-coach start
```

For more details on CLI commands, browser dashboard features, and environment variables, refer to the main [README.md](README.md).
