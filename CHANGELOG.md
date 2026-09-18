# Changelog

All notable changes to the **Pivot & Pulse (InsightSpark)** project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.1] - 2026-09-18

### Security & Hardening
- **Zero-Vulnerability Milestone**: Updated overrides for `fast-uri` (^3.1.8), `hono` (^4.13.8), and `qs` (^6.16.0), and bumped `morgan` (^1.12.1), driving `npm audit` to **0 vulnerabilities**.
- **Iframe & PostMessage Defense (CWE-345)**: Hardened [`PocketgullIntegrationService`](src/services/pocketgull-integration.service.ts) to strictly track and dispatch to verified parent origins instead of wildcard (`*`) targetOrigins.
- **Dead File & Ghost Artifact Purge**:
  - Removed orphaned `env-config.js` files that referenced non-existent `entrypoint.sh` scripts.
  - Pruned temporary `fix-tailwind.ps1` script containing local workstation absolute paths.
  - Untracked Playwright `.last-run.json` and ephemeral `scratch/` test scripts from git tracking.
  - Hardened `.gitignore` with comprehensive OS and test coverage exclusion rules.

### Performance & AI Models
- **Upgraded Default Flash Model to Gemini 3.8 Flash**:
  - Promoted Google's latest `gemini-3.8-flash` (released September 2026) as the default free-tier model across backend proxy and client settings.
  - Enhanced model selector UI with Gemini 3.8 Flash flagship capabilities.

### Legal & Compliance
- **Attribution Disentanglement**: Clarified export attributions so that `CC BY-SA 4.0` attaches cleanly to generated insights and care plans rather than misrepresenting Edward de Bono's proprietary works.
- **Trademark Pruning**: Removed references to "6 Thinking Hats" from `public/llms.txt`.
- **License Synchronization**: Aligned `CITATION.cff` and `package.json` with the repository root `CC-BY-NC-SA-4.0` license.

---

## [2.1.0] - 2026-09-15

### Added
- **6 New Ideation & Rigor Strategies Across Both Shelves**:
  - **Divergent Provocations**:
    - `sensory-bridge` (*Sensory Bridge & Somatics* / *Sensory Bridging & De-escalation*): Bypasses intellectual blocks by tuning into auditory, olfactory, tactile, and kinetic comforts to alleviate anxiety and agitation in dementia and post-stroke care.
    - `found-kinship` (*Unlikely Alliances & Outsiders* / *Chosen Family & Community Circles*): Partners with cross-industry disciplines or weaves chosen family, trusted neighbors, faith volunteers, and companion animals when bloodlines are absent or strained.
    - `time-dilation` (*Time Dilation & Century Lens* / *Circadian Micro-Pacing*): Explores extreme timescales (3 seconds vs 300 years) and harmonizes care activities with natural human circadian energy rhythms (morning momentum, sundowning mitigation).
  - **Systems Rigor & Kinship Anchors (Counterbalances)**:
    - `respite-pacing` (*Sustainable Sprint & Burnout Shield* / *Respite Safeguards & Caregiver Pacing*): Mandates non-negotiable weekly respite windows (3–4 hrs minimum), guilt-free handoffs, and sustainable energy pacing to prevent caregiver burnout cliffs.
    - `ethical-dignity` (*Integrity & Non-Negotiable Boundaries* / *Dignity, Autonomy & Values Alignment*): Enforces user privacy, advance directives, living wills, and self-determination (*"Nothing about me without me"*).
    - `environmental-safety` (*Physical Grounding & Ergonomics* / *Living Room Safety & Hazard Pre-Mortem*): Closes loop on physical room hazards (throw rugs, shower grab bars, medication locks, clear transit paths).
- **Critical Period Closure Checklists in Care Plans**:
  - **72-Hour / 30-Day Transition Checklist**: Concrete handoffs for post-acute hospital-to-home transitions (medication reconciliation, physical fall hazards, emergency contacts).
  - **Weekly Caregiver Respite Checklist**: Explicit scheduling of primary caregiver breaks with designated relief partners.
  - **Printable Refrigerator Plan**: Formatted with physical pen-and-paper checkbox indicators (`[ ]`) for family living room walls.
- **HL7 FHIR R4 Bundle Mapping**:
  - Automatically translates transition and respite checklists into standard FHIR `ServiceRequest` resource entries with intent `plan` and status `active`.
- **Multi-Agent Dialectical Synthesis Closure**:
  - Upgraded 5-phase debate pipeline with structured `synthesisActionBridge` outputs:
    - `divergentLeap`: The most promising non-linear innovation.
    - `groundingGuardrail`: The primary safety, ethical, or logistical counterbalance.
    - `immediateTractionStep`: The concrete first action to execute within 24 hours.
- **Direct Preference Optimization (DPO) Dataset Export**:
  - Pairwise `.jsonl` export format compatible with Hugging Face TRL fine-tuning.
  - Aligns models toward asset-based, hopeful, and kinship-balanced recommendations ($\mathbf{y_w}$) over deficit-based or paternalistic language ($\mathbf{y_l}$).
  - Embedded metadata with ORCID researcher attribution ([`0009-0008-1372-5381`](https://orcid.org/0009-0008-1372-5381)).
- **In-App "What's New in v2.1" Showcase**:
  - Interactive release notes card directly accessible in the website Settings & Guide view (`app-help`).
- **Dignity-First & Non-Alarmist Safety Companion (Chill UX)**:
  - **Calm Presence over Crisis Strobe**: Replaced harsh crimson borders, warning sirens (`🚨`), and punitive terminology (`BLOCKED`, `INTERCEPT`) with warm, earth-toned sage, slate, and amber accents (`Quiet & Private 🌿`, `Privacy Shield 🛡️`).
  - **Ongoing Recovery & User Autonomy Override**: Distinguishes active emergencies from historical recovery reflections (e.g. past stroke or cardiac rehabilitation) via a one-click acknowledgement (*"This is for ongoing recovery, continue →"*), honoring user agency and bypassing blocks without 400 errors.
  - **Empowering One-Click Privacy Tidying**: Replaced scolding PII warnings with a compassionate helper flow: a single tap on *"✨ Tidy details for me"* deterministically replaces sensitive contact details with anonymized placeholders (`[phone]`, `[street address]`, `[email]`).
  - **Compassionate Respite Framing for 988**: Elevated the 988 Suicide & Crisis Lifeline as unconditional emotional support and caregiver respite guidance (*"You don't have to carry this alone"*).
- **ClinicalTriageGuard (Acute Medical & Crisis Guidance)**:
  - Deterministic pre-flight scanner for acute stroke symptoms (FAST), cardiac/respiratory distress, and psychiatric crisis distress.
  - Surfaces high-visibility, calm emergency actions: tap-to-call **911** for acute medical emergencies and **988 Suicide & Crisis Lifeline** for caregiver distress.
- **HipaaSafeHarborGuard (Deep PII/PHI De-Identification & Auto-Scrubbing)**:
  - Expanded regex coverage to Dates of Birth (DOB), Medical Record Numbers (MRN), and Street Addresses across client and server.
  - Sanitizes sensitive data into safe placeholders (`[date of birth]`, `[mrn]`, `[street address]`) without requiring manual retyping.

### Changed
- Expanded `STRATEGY_MAP` in `server.js` and `STRATEGIES` in `src/models/creative-types.ts` from 18 to 24 models.
- Updated `styles.css` with responsive theme tokens for all new strategies.
- Upgraded repository hygiene rules in `AGENTS.md` and pruned legacy data-engineering skills in favor of dedicated clinical, lateral thinking, and on-device skills.

### Security & Compliance
- **Zero-Disk Retention Proxy**: Express 5 backend streams all generation without storing prompts, responses, or PHI on disk.
- **Clinical Triage Circuit-Breaker**: Prevents acute emergencies from triggering creative LLMs.
- **HIPAA Safe Harbor Guard**: Pre-flight de-identification blocking 7 direct identifier categories with local auto-scrubbing.
- **Strong Sandboxing Protocol**: Enforced `.sandbox.json` policy and hardened container scripts.

---

## [2.0.0] - 2026-06-10

### Added
- **Evolution to Pivot & Pulse**:
  - Rebranded from Insight Spark to **Pivot & Pulse (InsightSpark)**.
- **Multi-Agent Dialectical Debate Architecture**:
  - 5-phase structured debate pipeline: strategy selection, multi-perspective debate, and synthesis action bridge.
- **ORCID Researcher Authentication**:
  - Secure OAuth integration attributing research and community care plans directly to researcher ORCID records ([`0009-0008-1372-5381`](https://orcid.org/0009-0008-1372-5381)).
- **Confidential Multi-Engine Intelligence Ladder**:
  - **Chrome Built-in AI**: Zero-network on-device Gemini Nano execution via `window.ai` Prompt API.
  - **Local Gemma (Ollama)**: Localhost bridge (`localhost:11434`) supporting `gemma2`, `gemma3`, and `gemma4`.
  - **Google Gemini Cloud**: Advanced reasoning with Gemini 2.5 Pro and Gemini Flash.
- **Two-Tier Shelf Ideation**:
  - Separated creative provocations from grounding counterbalances (FMEA, Critical Path, PERMA+H, Intergenerational Kinship).
- **Intergenerational Kinship Roles**:
  - Multi-generational family perspectives: Daughter, Mother, Grandmother, Son, Father, Grandfather, and Kinship Coordinator.
- **Web Speech Living Room Audio**:
  - Native voice dictation and synthesized Text-to-Speech playback for living room couch collaboration.
- **Multilingual & Portland Sister Cities Support**:
  - 19 localized target languages including all 9 Portland official Sister Cities.

---

## [1.5.0] - 2026-05-04

### Added
- **Google Cloud & Production Containerization**:
  - Provisioned dedicated Google Cloud project `insightspark-82c75` (Number: `828814350875`).
  - Containerized production deployment via Dockerfile and Google Cloud Run (`insight-spark` in `us-west1`).
  - Configured Firebase Hosting with custom caching headers and reverse-proxy rewrites.
  - Added stateless Express 5 streaming middleware proxy (`server.js`) ensuring zero disk retention of prompts or PII.

---

## [1.0.0] - 2026-02-12

### Added
- **Initial Genesis of Insight Spark (Google AI Studio Origin)**:
  - Conceived in **Google AI Studio** inspired by a thrift store copy of Edward de Bono's lateral thinking book:
    *"I often go into thrift stores to read their books. I discovered this one on the shelf, bought it, and flipped through it..."* — Phil Gear.
  - 3,257-line initial standalone architecture across 34 core files:
    - Angular Standalone component architecture with modern Zoneless Change Detection (`provideZonelessChangeDetection`).
    - The original 14 lateral thinking strategies grounded in de Bono's divergent provocations.
    - D3.js force-directed concept graph with real-time physics and node repulsion (`graph-view.component.ts`).
    - Gemini AI integration service with pre-flight PII data masking (`gemini.service.ts`).
    - Generative Paul Klee Bauhaus color palette engine (`klee-palette.service.ts`).
    - Medical data card and vitals trend visualizer (`medical-data-card.component.ts`, `vitals-trend-graph.component.ts`).
    - Progressive Web App (PWA) manifest and service worker configuration.
