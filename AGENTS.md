# InsightSpark (Pivot & Pulse) — Project Rules & Directives

Welcome to **Pivot & Pulse (InsightSpark)**, an interactive lateral thinking workbench, positive psychology companion, and intergenerational care planner. This document defines the engineering standards, architecture invariants, security protocols, and clinical guidelines for all AI agents working in this repository.

---

## 1. Core Architecture & Technology Stack

*   **Frontend Framework:** Angular 22 (Standalone Components only; **NO** legacy `NgModule`).
*   **State Management:** Angular Reactive Signals (`signal()`, `computed()`, `effect()`) for all dynamic UI state.
*   **Styling:** Tailwind CSS with custom glassmorphic variables and color tokens (`var(--...)`).
*   **Visualizations:** D3.js (v7.9+) force-directed graphs and responsive SVG rendering.
*   **Speech & Living Room Audio:** Native Web Speech API for voice dictation and synthesized text-to-speech (TTS) playback.
*   **Backend Proxy:** Express 5 (`server.js`) serving as a stateless middleware proxy with zero disk retention of prompts or PII.
*   **AI Engines:**
    *   *Google Gemini Cloud:* `@google/genai` (v2.8+) using Gemini 2.5 Pro / Flash models with structured schemas (`responseSchema`) and dynamic thinking budgets (`thinkingBudget`).
    *   *Chrome Built-in AI:* Zero-network on-device Gemini Nano via `window.ai` Prompt API.
    *   *Local Gemma / Ollama:* Offline local LLM bridge via `localhost:11434`.
*   **Clinical & Research Standards:**
    *   *HL7 FHIR R4:* Care plan bundles conforming to standard `CarePlan`, `Condition`, `Goal`, and `ServiceRequest` resource schemas.
    *   *Direct Preference Optimization (DPO):* Pairwise export matching Hugging Face TRL format with ORCID researcher attribution.

---

## 2. Clinical, Privacy & Ethical Guardrails

### A. HIPAA / COPPA & Zero-Data Retention
*   **Mandatory PII / PHI Scanning:** Before any health goal, brainstorm prompt, or care plan input is forwarded to any AI model (Cloud or Local), it MUST pass through the pre-flight `scanForPII` regex shield.
*   **De-Identification:** If emails, phone numbers, SSNs, or IP addresses are detected, block the request with a clear warning instructing the user to de-identify their goal.
*   **Stateless Execution:** Neither the Express server nor the Angular client may persist user health inquiries to disk or cloud databases. All state in the browser is ephemeral or user-controlled in `localStorage`.

### B. Positive Psychology (PERMA+H) & Asset Framing
*   All recommendations, care plans, and reflection cards MUST be grounded in Dr. Martin Seligman's **PERMA+H** framework:
    *   **P** (Positive Emotion), **E** (Engagement/Flow), **R** (Relationships), **M** (Meaning), **A** (Accomplishment), **+H** (Health/Vitality).
*   **Learned Optimism (ABCDE):** Always reframe setbacks as temporary and specific, avoiding permanent or pervasive deficit language.
*   **DPO Alignment Criteria ($\mathbf{y_w} \succ \mathbf{y_l}$):**
    *   $\mathbf{y_w}$ (Preferred): Asset-based, empowers personal agency, balances multi-generational family roles, protects caregiver respite.
    *   $\mathbf{y_l}$ (Penalized): Pathologizing, deficit-focused, paternalistic, or assigning 100% burden to a single primary caregiver.

### C. Critical Period Closure Guardrails
Every generated Care Plan must provide concrete, closed-loop checklists for:
1.  **Care Transitions (72h / 30d):** Post-acute discharge or stage-transition handoffs (medication reconciliation, environmental safety checks, follow-up contact handoffs).
2.  **Caregiver Respite Safeguards:** Non-negotiable weekly respite schedules (3–4 hours/week minimum) and designated handoff partners.

---

## 3. Project Sandboxing Protocol

All external scripts, dependencies, and test executions must comply with the **Global Sandboxing Directives**:
*   Repository configuration is defined in [.sandbox.json](file:///c:/Users/philg/InsightSpark/InsightSpark/.sandbox.json).
*   Untrusted external scripts or unknown packages must be vetted or run inside the hardened container launcher (`sandbox-docker.ps1`) or Windows Sandbox (`sandbox-win.ps1`).
*   Network access during builds is restricted to verified npm registries.

---

## 4. Code Quality & Pre-Commit Verification Gates

Before completing any task or committing changes, you MUST empirically verify that:
1.  **Unit Tests Pass:** `npm run test` executes cleanly with zero failures across all test suites (PII evasion, SSE fuzzing, chaos engineering, FHIR/DPO exports).
2.  **Linter Passes:** `npm run lint` completes with zero ESLint errors and zero warnings.
3.  **Documentation Integrity:** Preserve all existing docstrings, copyright headers, and CC BY-SA 4.0 / Apache-2.0 notices.
