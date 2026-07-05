# Developer Documentation (DEVELOPMENT.md)

Welcome to the **Pivot & Pulse** developer guide. This document explains the codebase architecture, key components, and instructions for running and testing the application.

---

## Architecture Overview

Pivot & Pulse is built using a modern decoupled architecture consisting of an **Angular SPA (Single Page Application)** frontend and a stateless **Express.js API Proxy** backend.

```
┌────────────────────────────────┐
│      Angular SPA Client        │
│  (LocalStorage, D3 Graph, UI)  │
└───────────────┬────────────────┘
                │ HTTP Requests (CORS, Rate Limited)
                ▼
┌────────────────────────────────┐
│      Express.js Proxy          │
│ (Helmet, Rate Limiter, Morgan) │
└───────────────┬────────────────┘
                │ Streamed API Calls (SSL)
                ▼
┌────────────────────────────────┐
│      Gemini API Service        │
└────────────────────────────────┘
```

### 1. Express Proxy Server (`server.js`)
The backend is a lightweight Node.js server that acts as a secure proxy to the Gemini API. Its main roles are:
- **Security Hardening:** Implements `helmet` for HTTP response headers protection and `cors` for cross-origin access control.
- **Rate Limiting:** Prevents brute-force API consumption using `express-rate-limit`.
- **Validation:** Sanitizes and validates user inputs via `express-validator`.
- **Stateless Operation:** No databases or session storage exist on the backend to prevent the risk of data leaks.

### 2. AI Orchestrators & Stream Processing
Insight generation uses Server-Sent Events (SSE) to stream responses from the Gemini model to the client:
- **Streaming Response:** In `server.js`, calls to `gemini.models.generateContentStream` are piped directly back to the client using a text/event-stream content type. This reduces perceived latency and allows the client to display insights as they generate.
- **Schema & Prompt Enforcement:** System instructions enforce JSON formatting, structured output, and HIPAA compliance (preventing the model from reflecting back any PII/PHI).
- **Client Parsing:** The client utilizes `partial-json` to dynamically parse incomplete JSON strings as they stream, displaying partial card data in real-time.

### 3. D3.js Visualization Engine (`graph-view.component.ts`)
The visualization view converts the generated insights into an interactive network diagram:
- Uses a **D3.js Force-Directed Simulation**.
- Central Node representing the user's core problem.
- Peripheral Nodes representing the selected thinking strategies.
- Branch Nodes representing individual insights linked back to their parent strategies.
- Fully responsive, supporting drag gestures and click-to-highlight/copy interactivity.

### 4. Local Persistence (`storage.service.ts`)
To respect clinical data sovereignty:
- All saved items (insights, care plans, user preferences) are stored in `LocalStorage` under the client browser profile.
- Component state is synced reactively using Angular Signals (`storageService.savedItems`).

---

## Resilience & Chaos Mode

### Retry Mechanism
The frontend `GeminiService` wraps all asynchronous API endpoints in a `_withRetries` helper.
- **Exponential Backoff:** If a fetch fails (e.g. rate limit `429` or connection drop), the service waits `initialDelay * 2^(attempt - 1)` before retrying.
- **Max Retries:** Tries up to 3 times (1 initial attempt + 2 retries) before showing a final failure screen.

### Chaos Simulation UI
Developers can test client behavior under network dropouts or server failures:
1. Navigate to the **Help & Pro Tips** page.
2. Scroll to the **Developer Settings (Chaos Mode)** card.
3. Select a failure type (`429 Rate Limit`, `500 Internal Error`, or `Network Drop`).
4. Select the behavior:
   - **Transient:** Fails twice and succeeds on the 3rd attempt, verifying that the UI shows warning states, retries, and recovers.
   - **Permanent:** Fails continuously, verifying that the UI displays a clean `ApiRetryError` dialog.

---

## Local Development & Testing

### Installation
Install exact pinned dependencies:
```powershell
npm install
```

### Run Locally
Start the local dev server and proxy:
1. Run the Express backend:
   ```powershell
   npm start
   ```
2. In a separate terminal, start the Angular development environment:
   ```powershell
   npm run dev
   ```

### Running Chaos Tests
Run the automated resilience test suite using Node's native test runner and `tsx`:
```powershell
npx tsx tests/chaos.test.js
```
*(Specify the absolute path if your PowerShell profile forces directory redirection).*
