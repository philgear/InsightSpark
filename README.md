<div align="center">
  <img width="1200" height="475" alt="Pivot & Pulse Banner" src="docs/pivot-pulse-banner.png" />
</div>

<div align="center">

# Pivot & Pulse (InsightSpark)

[![Angular](https://img.shields.io/badge/Angular-v22.0.0-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![Express](https://img.shields.io/badge/Express-v4.19.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-latest-38BDF8?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![D3.js](https://img.shields.io/badge/D3.js-v7.9.0-F9A03F?logo=d3.js&logoColor=white)](https://d3js.org/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-v1.35.0-8E75C2?logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)

An interactive lateral thinking workbench and medical care planner. **Pivot & Pulse** pairs [Edward de Bono's](https://en.wikipedia.org/wiki/Edward_de_Bono) lateral thinking strategies with advanced Google Gemini streaming, real-time D3 force-directed visualizations, and compliance-first clinical assistants. Learn more about his legacy at [debono.com](https://www.debono.com).

[View App in Google AI Studio](https://ai.studio/apps/3eeb2b40-7093-4e40-b5a5-e1d2fbb75de7)

</div>

<div align="center">
  <img width="800" alt="Key Features" src="docs/divider-key-features.png" />
</div>

### 1. Dual-Mode Thinking Workspaces
*   **🎨 Creative Mode:** Solve complex issues, break writer's block, or draft conceptual plans using classic lateral thinking techniques (Butterfly, Combinatorial, First Principles).
*   **🏥 Care Mode:** Generate holistic, patient-centered care strategies by shifting perspective across roles (e.g., Bedside Nurse, Systems Theorist, Patient Advocate, Family Member, or Best Friend).

### 2. Live Visualization & Real-Time SSE Streaming
*   **D3 Force-Directed Diagrams:** Convert structured insights into interactive, responsive network maps. Inspect connections, highlight nodes, and navigate conceptual dependencies.
*   **Instant Streaming:** Leverages Server-Sent Events (SSE) from the Node.js backend. The client parses incomplete JSON fragments in real time via `partial-json`, displaying insight cards as they generate.

### 3. Patient Sovereignty & Security
*   **HIPAA De-identification scanner:** A clientside PII/PHI regex analyzer warns you if you enter email addresses, phone numbers, SSNs, or IP addresses before submitting queries to Gemini.
*   **Local Storage Sovereignty:** All saved insights, care plans, and settings reside in the user's local browser profile (`localStorage`) via Angular signals. The Express server is entirely stateless.

### 4. ORCID Researcher Integration
*   Connect your secure **ORCID ID** to authenticate your clinical or academic credentials, automatically appending attribution metadata to your exported care and action plans.

### 5. Developer Chaos Sandbox
*   Test application resilience directly from the settings drawer. Simulate transient or permanent API errors (`429 Rate Limit`, `500 Server Error`, or `Network Drop`) to verify exponential backoff retries.

<div align="center">
  <img width="800" alt="Architecture Overview" src="docs/divider-architecture.png" />
</div>

```mermaid
graph TD
    Client["Angular SPA Client <br> (LocalStorage, D3 Graph, UI)"]
    Proxy["Express.js Proxy <br> (Helmet, Rate Limiter, Morgan)"]
    Gemini["Gemini API Service"]

    Client -->|HTTP Requests (CORS, Rate Limited)| Proxy
    Proxy -->|Streamed API Calls (SSL / SSE)| Gemini
```


*   **Frontend ([src](./src)):** Built on Angular with signals for state management, D3.js for rendering force-directed graphs, and Tailwind CSS for styling.
*   **Backend ([server.js](./server.js)):** A lightweight Express middleware proxy managing API validation, input sanitization, security headers (Helmet), and streaming Gemini SSE feeds.

<div align="center">
  <img width="800" alt="Quick Start" src="docs/divider-quick-start.png" />
</div>

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env.local` file in the root directory (or update the existing one):
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run Locally

To spin up the developer server, run both backend proxy and frontend:

*   **Start Backend API Proxy:**
    ```bash
    npm start
    ```
*   **Start Angular Client:**
    In a separate terminal window, run:
    ```bash
    npm run dev
    ```

<div align="center">
  <img width="800" alt="For Researchers & Clinicians" src="docs/divider-researchers.png" />
</div>

### 1. Methodological Transparency
*   **Prompt Adaptation:** The system leverages custom system instructions to morph general-purpose LLM outputs into structured clinical/creative strategies.
*   **Strategies Mapping:** You can find the exact definitions and mapping of de Bono's creative strategies and clinical care mode strategies in [creative-types.ts](./src/models/creative-types.ts).

### 2. IRB & Data Privacy Checklist
If you are submitting an Institutional Review Board (IRB) proposal to use this tool in a clinical/academic pilot:
*   **Zero-Data Retention Backend:** The server proxy in [server.js](./server.js) is stateless. No databases, logs of user queries, or API history are kept.
*   **Client-Side Privacy Enforcement:** A PII scanner operates strictly inside the browser client before any payload is dispatched, preventing inadvertent PHI transmissions under HIPAA guidelines.
*   **Local Sovereignty:** Generated plans are stored under the browser’s sandboxed `localStorage` profile, giving participants absolute ownership over their data.

### 3. Provenance & ORCID Integration
To ensure academic provenance, this application integrates with the ORCID public API. Connecting your researcher record:
1. Validates your academic credentials via OAuth 2.0.
2. Appends your name and ORCID URI to exported markdown/clipboard plans to sign and trace academic contributions.

### 4. How to Cite
If you use Pivot & Pulse (InsightSpark) in your research, please cite it as:
```text
Gear, P. (2026). Pivot & Pulse (InsightSpark): A Lateral Thinking Workbench and Clinical Care Strategist. GitHub Repository. https://github.com/philgear/InsightSpark
```

<div align="center">
  <img width="800" alt="Testing & Resilience" src="docs/divider-testing.png" />
</div>

### Chaos Test Suite
Pivot & Pulse features a robust chaos testing framework to ensure UI components handle connection issues gracefully. Run the tests using the native Node test runner:
```bash
npx tsx tests/chaos.test.js
```

<div align="center">
  <img width="800" alt="License & Attribution" src="docs/divider-license.png" />
</div>
- Core system designed by **Phil Gear**.
- AI services powered by **Google Gemini**.
- Methodologies inspired by **[Edward de Bono's](https://en.wikipedia.org/wiki/Edward_de_Bono) Lateral Thinking** (CC BY-SA 4.0). Legacy resources available at [debono.com](https://www.debono.com).
  > *"I often go into thrift stores to read their books. I discovered this one on the shelf, bought it, and flipped through it. Still have it..still haven't read it fully."* — Phil Gear, on the project's origin.
