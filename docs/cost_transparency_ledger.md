# Pivot & Pulse (InsightSpark) — Unit Economics & Cost Transparency Ledger

> Generated reproducibly by `scripts/cost-simulator.mjs` from live prompt constants in `server.js` and verified November 2026 Gemini API rate cards.

## Empirical Prompt Overhead Measured from `server.js`

| System Constant | Measured Characters | Estimated Tokens (~4 chars/tok) | Scope |
|---|---:|---:|---|
| `CIVIC_NEUTRALITY_INSTRUCTION` | 786 | 197 | Creative endpoints |
| `HIPAA_SYSTEM_INSTRUCTION` (incl. Civic) | 3,216 | 804 | Care & structure endpoints |
| `STRATEGY_MAP` (29 strategies) | 5,832 | 1,458 | `/api/agent/select` & pipeline Phase 1 |

---

## 1. Model Pricing Rate Card (USD per 1M Tokens)

> [!WARNING]
> **Scheduled Rate Change (2026-12-01):** `gemini-4-argon` doubles from `$2.00 / $10.00` per 1M tokens (through 2026-11-30) to **`$4.00 / $20.00` per 1M tokens** starting **2026-12-01** and has **no Free Tier**. `gemini-4-hydrogen` (`$1.50 / $7.50`) and `gemma-4-31b-it` (`$0.00`) remain far more cost-effective defaults.

| Model / Engine | Billing Tier | Input / 1M | Output + Thought / 1M | Cached Input / 1M | Free Tier |
|---|---|---:|---:|---:|---|
| `gemini-4-hydrogen` | Cloud Default | $1.50 | $7.50 | $0.075 | Yes (rate-limited) |
| `gemini-4-argon` | Cloud Fast (Nov 2026) | $2.00 | $10.00 | $0.200 | No (Paid only) |
| `gemini-4-argon (Dec 1+)` | Cloud Fast (2x Scheduled) | $4.00 | $20.00 | $0.400 | No (Paid only) |
| `gemini-3.5-flash-lite` | Cloud Budget | $0.30 | $2.50 | $0.030 | Yes (high RPM) |
| `gemma-4-31b-it` | Cloud Open-Weight Free | $0.00 | $0.00 | $0.000 | Yes ($0 Open-Weight) |
| `gemma-4-26b-a4b-it` | Cloud Open-Weight MoE (3.8B Active) | $0.00 | $0.00 | $0.000 | Yes ($0 Open-Weight MoE) |
| `on-device-nano` | On-Device RAM | $0.00 | $0.00 | $0.000 | Yes (0 bytes egress) |
| `ollama:pivotpulse` | Local VRAM | $0.00 | $0.00 | $0.000 | Yes (Self-hosted GPU) |

---

## 2. Per-Action Cost Matrix (Cents USD per Click)

Reasoning (`thoughtTokens`) is billed at each model’s **output token rate**. Default UI thinking level is **`high`** (~2.5× base thought tokens); **`low`** (~1.0×) cuts reasoning overhead by 60%.

| Endpoint | Action | Calls | Est. Tokens (`high`) | Hydrogen (`high`) | Hydrogen (`low`) | Flash-Lite (`low`) | Argon Dec 1+ (`high`) | Gemma 4 31B / Local |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| `/api/structure` | Structure Goal + DSRP | 1 | 2,014 | 0.824¢ | 0.577¢ | 0.169¢ | 2.198¢ | $0.00 |
| `/api/insights` | Stream Insights (3 strategies) | 1 | 3,104 | 1.474¢ | 1.069¢ | 0.328¢ | 3.930¢ | $0.00 |
| `/api/care-plan` | Synthesize Care Plan | 1 | 3,074 | 1.379¢ | 0.997¢ | 0.301¢ | 3.678¢ | $0.00 |
| `/api/creative-plan` | Synthesize Creative Plan | 1 | 2,127 | 1.105¢ | 0.768¢ | 0.240¢ | 2.947¢ | $0.00 |
| `/api/translate` | Translate Plan / Card | 1 | 1,420 | 0.717¢ | 0.582¢ | 0.182¢ | 1.912¢ | $0.00 |
| `/api/agent/pipeline` | 4-Phase Agentic Debate | 4 | 9,266 | 4.120¢ | 3.040¢ | 0.919¢ | 10.986¢ | $0.00 |

---

## 3. Monthly Traffic Scenario Simulator (3 Sessions / Active User / Month)

Session blend modeled per user-month (3 sessions total): `1.0× /api/structure` + `1.0× /api/insights` + `0.5× /api/care-plan` + `0.2× /api/agent/pipeline` + `0.2× /api/translate` per session.

- **100% Cloud Default (`gemini-4-hydrogen`, `high` thinking):** $0.04 / session
- **Optimized Cloud (`gemini-3.5-flash-lite` low/med + Hydrogen med pipeline):** $0.01 / session
- **60% Local-First Hybrid (60% Ollama / `window.ai` / Gemma 4 31B @ $0 + 40% Optimized Cloud):** $0.0058 / session

| Monthly Active Users (MAU) | Monthly Sessions | 100% Cloud Default | Optimized Cloud | 60% Local-First Hybrid | Monthly Savings vs. Default |
|---:|---:|---:|---:|---:|---:|
| 100 | 300 | $11.86 | $4.37 | $1.75 | $10.11 |
| 1,000 | 3,000 | $118.64 | $43.74 | $17.50 | $101.14 |
| 10,000 | 30,000 | $1186.39 | $437.42 | $174.97 | $1011.42 |
| 50,000 | 150,000 | $5931.94 | $2187.09 | $874.84 | $5057.11 |

---

## 4. Cost Containment & Zero-Retention Architecture

- **Scale-to-Zero Serverless Hosting:** Static frontend assets are served from CDN while the stateless Node/Express API proxy scales down to zero idle instances (`$0.00` baseline idle compute).
- **Hosted-Key Guardrails:** Anonymous requests routed through the maintainer-hosted key are constrained to the approved cost-bounded model allowlist (`gemini-4-hydrogen`, `gemini-3.5-flash-lite`, `gemma-4-31b-it`, `gemma-4-26b-a4b-it`), with reasoning capped at `medium` (`low` for 4-phase dialectic debates).
- **BYOK & $0 Local Offload:** Supplying your own Gemini API key or switching to `window.ai` / WebGPU / local Ollama (`pivotpulse`) unlocks unrestricted tiers while shifting cloud cost to `$0.00`.
- **Zero Disk Retention:** All Gemini Interactions calls specify `store: false`, and session token receipts remain strictly in browser memory with zero prompt or PII persistence.
