# Contributing to InsightSpark

Thank you for your interest in contributing to **InsightSpark** (Pivot & Pulse)! We welcome contributions from the community and are excited to have you on board.

---

## 📜 Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to phil@geararts.dev.

---

## 🐛 Reporting Bugs

If you find a bug, please [open an issue](https://github.com/philgear/InsightSpark/issues/new?template=bug_report.yml) using our bug report template. Include:

- A clear description of the problem
- Steps to reproduce
- Expected vs. actual behavior
- Your browser and environment details

---

## 💡 Suggesting Features

Have an idea? [Open a feature request](https://github.com/philgear/InsightSpark/issues/new?template=feature_request.yml) and tell us:

- What problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

---

## 🔐 Security Vulnerabilities

> **Do NOT open a public issue for security vulnerabilities.**

Please report them responsibly by emailing **phil@geararts.dev** with a description, reproduction steps, and potential exploit vectors. See our [Security Policy](./SECURITY.md) for full details.

---

## 🛠️ Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS recommended)
- A [Google Gemini API key](https://aistudio.google.com/apikey)

### Getting Started

1. **Fork and clone** the repository
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Create a `.env.local`** file in the root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. **Start the Express backend proxy:**
   ```bash
   npm start
   ```
5. **In a separate terminal, start the Angular dev server:**
   ```bash
   npm run dev
   ```

### Running Tests

```bash
# Unit/resilience tests
npm test

# End-to-end tests (requires Playwright)
npm run test:e2e
```

---

## 📝 Coding Standards

- **Language:** TypeScript (strict mode)
- **Framework:** Angular 22 with standalone components and signals
- **Linting:** ESLint — run `npm run lint` before submitting
- **Style:** Follow existing patterns in the codebase
- **Commits:** Use [Conventional Commits](https://www.conventionalcommits.org/) format (e.g., `feat:`, `fix:`, `docs:`, `chore:`)

---

## 🔄 Pull Request Process

1. **Fork** the repo and create a feature branch from `main`
2. Make your changes following the coding standards above
3. Ensure all checks pass:
   - `npm run lint` — no lint errors
   - `npm test` — chaos/resilience tests pass
   - `npm run build` — production build succeeds
4. **Submit a Pull Request** — our [PR template](./.github/pull_request_template.md) includes a quality checklist covering:
   - HIPAA compliance verification
   - Chaos test execution
   - Dependency audit
5. A maintainer will review your PR. Please be responsive to feedback.

---

## ⚖️ License

By contributing to InsightSpark, you agree that your contributions will be licensed under the [CC BY-NC-SA 4.0](./LICENSE) license. This means contributions can be shared and adapted for non-commercial purposes with attribution and under the same terms.
