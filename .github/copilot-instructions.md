# Copilot Instructions for Pivot & Pulse (InsightSpark)

## Project Overview

Pivot & Pulse is an interactive lateral thinking workbench and medical care planner. It pairs Edward de Bono's lateral thinking strategies with Google Gemini streaming, D3.js force-directed visualizations, and compliance-first clinical assistants.

## Architecture

```
├── server.js          # Express.js backend proxy (stateless, SSE streaming)
├── src/               # Angular 22 SPA (standalone components, signals)
│   ├── app/           # Core application components and services
│   ├── models/        # TypeScript interfaces and strategy definitions
│   └── styles/        # Component-level styles
├── tests/             # Chaos/resilience test suite
├── docs/              # Documentation assets and images
└── .github/           # CI, issue templates, community health
```

### Frontend (Angular 22)
- **State management:** Angular signals (not NgRx or services with BehaviorSubject)
- **Components:** Standalone components only — no NgModules
- **Visualization:** D3.js v7 for force-directed graphs
- **Styling:** Tailwind CSS via PostCSS
- **Data persistence:** Browser `localStorage` only — never send user data to external storage
- **PII Scanner:** Client-side regex-based scanner that checks for PHI/PII before any API call

### Backend (Express.js)
- **Stateless proxy:** `server.js` is a pure middleware proxy to the Gemini API
- **No database, no session storage, no query logging** — this is a HIPAA design constraint
- **Security:** Helmet for headers, express-rate-limit, express-validator for input sanitization
- **Streaming:** SSE (Server-Sent Events) for real-time Gemini responses
- **Environment:** API key loaded from `.env.local` (never committed)

## Coding Conventions

### TypeScript
- Strict mode enabled
- Prefer `const` over `let`; never use `var`
- Use Angular signals for reactive state, not RxJS Subjects (RxJS is used only for HTTP and SSE streams)
- All models and interfaces go in `src/models/`

### Commits
- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`
- Keep commit messages concise and descriptive

### Styling
- Use Tailwind utility classes in templates
- Component-specific styles in co-located CSS files
- Design tokens: dark moody palette (`#24211c` base), rose/mauve accents, Art Nouveau aesthetic

## Testing

### How to run tests
```bash
npm run lint          # ESLint
npm run build         # Angular production build
npm test              # Chaos/resilience tests via tsx
npm run test:e2e      # Playwright end-to-end tests
```

### Test philosophy
- The chaos test suite in `tests/` simulates API failures (429, 500, network drops) to verify exponential backoff and graceful degradation
- When adding new API-facing features, add corresponding chaos test cases
- UI components should degrade gracefully — never show raw errors to users

## Privacy & Compliance Guardrails

> **CRITICAL: Do not violate these constraints.**

1. **Never add server-side storage** — no databases, no file writes, no session stores, no analytics
2. **Never log user queries or API responses** on the server — Morgan logs only HTTP metadata
3. **Never remove or weaken the PII scanner** — it must run client-side before every API dispatch
4. **Never commit API keys or secrets** — `.env.local` is gitignored
5. **Never add external tracking scripts** (Google Analytics, Sentry, etc.) without explicit approval

## Common Tasks

### Adding a new lateral thinking strategy
1. Define the strategy type in `src/models/creative-types.ts`
2. Add the corresponding system prompt template
3. Update the UI strategy selector component
4. Add a test case verifying the prompt structure

### Adding a new API endpoint to the proxy
1. Add the route in `server.js` with input validation via `express-validator`
2. Ensure the endpoint is stateless — process, proxy, forget
3. Add rate limiting if the endpoint is user-facing
4. Add a chaos test simulating failure modes for the new endpoint

### Modifying the D3 visualization
1. D3 rendering logic lives in the graph component under `src/app/`
2. Use D3's data join pattern (enter/update/exit)
3. Test with varying node counts — the graph must handle 1-100+ nodes smoothly
4. Ensure mobile responsiveness (force simulation should adapt to viewport)

## Files You Should Not Modify Without Explicit Approval
- `LICENSE` — CC BY-NC-SA 4.0, legally binding
- `SECURITY.md` — security disclosure policy
- `CODE_OF_CONDUCT.md` — community standards
- `.env.local` — local secrets (should never appear in PRs)
- `docs/*.png` — generated artwork assets
