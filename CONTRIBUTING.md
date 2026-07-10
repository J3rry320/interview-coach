# Contributing to Interview Coach

Thank you for your interest in contributing to Interview Coach.

We welcome bug fixes, feature improvements, documentation updates, UI enhancements, and new ideas that help improve the project.

## Getting Started

### Fork the Repository

```bash
git clone https://github.com/J3rry320/interview-coach.git

cd interview-coach
```

### Install Dependencies

```bash
npm install
```

### Build the Project

```bash
npm run build
```

### Run Locally

```bash
npm run dev
```

## Development Workflow

1. Create a new branch.

```bash
git checkout -b feature/my-feature
```

2. Make your changes.

3. Verify the build succeeds.

```bash
npm run build
```

4. Test the CLI locally:

```bash
node dist/interview-coach.js --help
node dist/interview-coach.js start
```

5. Run unit tests to verify changes:

```bash
npm test
```

6. Commit your changes.

```bash
git commit -m "feat: add new interview evaluation strategy"
```

6. Push your branch and open a Pull Request.

## Areas for Contribution

- Interview generation improvements
- Answer evaluation quality
- Additional LLM providers
- Enhanced reporting
- Better CLI UX
- Documentation
- Performance improvements
- New interview modes

## Pull Request Guidelines

- Keep pull requests focused.
- Update documentation when necessary.
- Avoid introducing breaking changes without discussion.
- Follow the existing project structure and coding style.

## Questions?

Open an issue or start a discussion on GitHub.

Thank you for helping improve Interview Coach.
