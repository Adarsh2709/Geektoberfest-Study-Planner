# Contribution Guidelines

Thank you for your interest in contributing to **StudyFlow**! We appreciate your help in making StudyFlow a better study planning tool for everyone.

Please take a moment to review this document before submitting issues or pull requests.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Branching and Commit Conventions](#branching-and-commit-conventions)
- [Coding Standards](#coding-standards)
- [Getting Help](#getting-help)

---

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for all contributors. Please be respectful and constructive in all discussions, reviews, and communications.

---

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please check existing issues to ensure the issue hasn't already been reported.

When creating a bug report, include:
- A clear, descriptive title.
- Steps to reproduce the bug.
- Expected behavior vs. actual behavior.
- Screenshots or console logs if applicable.
- Environment details (Node.js version, browser, OS).

### Suggesting Enhancements

Feature requests and design suggestions are always welcome! When submitting a feature request:
- Provide a clear and concise description of the proposal.
- Explain the motivation or use case behind the feature.
- Include mockups, UI sketches, or API designs if relevant.

### Pull Requests

1. **Fork the repository** to your GitHub account.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/studyflow-nextjs.git
   cd studyflow-nextjs
   ```
3. **Create a new branch** with a descriptive name (e.g. `feat/pomodoro-timer`, `fix/login-redirect`).
4. **Make your changes** following our coding standards.
5. **Test your changes locally** to ensure builds and routes work as expected.
6. **Commit and push** your branch to your fork.
7. **Open a Pull Request (PR)** against the `main` branch. Provide a clear description of the problem solved and any relevant issue references.

---

## Development Setup

### Prerequisites

- **Node.js**: `20.9` or higher
- **npm**: `10.x` or higher
- **MongoDB**: A running local instance or MongoDB Atlas URI

### Steps

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in the required variables in `.env.local`:
   - `MONGODB_URI`: MongoDB connection string
   - `AUTH_SECRET`: Random 32+ character string (generate using `openssl rand -base64 32`)
   - `NEXT_PUBLIC_APP_URL`: Defaults to `http://localhost:3000`
   - *(Optional)* `AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL` for AI topic suggestions.

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Verify the application build:
   ```bash
   npm run build
   ```

---

## Branching and Commit Conventions

### Branch Naming
- `feat/<feature-name>`: New features or capabilities
- `fix/<bug-name>`: Bug fixes
- `docs/<doc-change>`: Documentation updates
- `refactor/<refactor-name>`: Code restructuring without functional changes
- `chore/<chore-name>`: Dependency updates, build changes, etc.

### Commit Messages
We encourage writing conventional and descriptive commit messages:
- `feat: add custom study session durations`
- `fix: resolve incorrect date offset in weekly planner`
- `docs: update setup instructions in README`
- `refactor: extract reusable modal component`

---

## Coding Standards

- **Formatting & Style**: Write clean, readable JavaScript and React code. Ensure consistent indentation and clean import structures.
- **Component Design**: Keep components modular, accessible, and responsive.
- **Styling**: Use Tailwind CSS conventions consistent with the existing codebase.
- **Environment & Secrets**: Never commit `.env.local` or any sensitive tokens or database credentials.
- **Error Handling**: Gracefully handle database or network failures with appropriate user feedback and status codes.

---

## Getting Help

If you have questions, encounter difficulties during setup, or want to discuss an idea before implementing it:
- Open a GitHub Discussion or Issue in the repository.
- Reach out to the maintainers.

Thank you for contributing to StudyFlow! 🚀
