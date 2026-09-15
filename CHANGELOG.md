# Changelog

All notable changes to the **Pivot & Pulse (InsightSpark)** project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- **ClinicalTriageGuard (Acute Red Flag & Crisis Interceptor)**:
  - Deterministic pre-flight scanner for acute stroke symptoms (FAST), cardiac/respiratory distress, and psychiatric crisis distress.
  - Instantly short-circuits generation and surfaces high-visibility emergency actions: tap-to-call **911** for acute medical emergencies and **988 Suicide & Crisis Lifeline** for mental health distress.
- **HipaaSafeHarborGuard (Deep PII/PHI De-Identification & Auto-Scrubbing)**:
  - Expanded regex coverage to Dates of Birth (DOB), Medical Record Numbers (MRN), and Street Addresses across client and server.
  - Added one-click **"Auto-Scrub Details"** action in the client UI to sanitize sensitive data into safe placeholders (`[dob]`, `[mrn]`, `[street address]`) without manual retyping.

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

## [2.0.0] - 2026-08-20

### Added
- **Multi-Engine Intelligence Architecture**:
  - **Chrome Built-in AI**: On-device Gemini Nano execution via `window.ai` Prompt API with zero network calls and 100% privacy.
  - **Local Gemma (Ollama)**: Localhost bridge (`localhost:11434`) supporting `gemma2`, `gemma3`, and `gemma4`.
  - **Google Gemini Cloud**: Advanced reasoning with Gemini 2.5 Pro and Gemini Flash.
- **Two-Tier Shelf Ideation**:
  - Separated creative provocations from grounding counterbalances (FMEA, Critical Path, PERMA+H, Intergenerational Kinship).
- **Intergenerational Kinship Roles**:
  - Added multi-generational family perspectives: Daughter, Mother, Grandmother, Son, Father, Grandfather, and Kinship Coordinator.
- **Web Speech Living Room Audio**:
  - Browser-native voice dictation and Text-to-Speech playback for multi-generational couch collaboration.
- **Multilingual & Portland Sister Cities Support**:
  - 19 localized target languages including all 9 Portland official Sister Cities.

---

## [1.0.0] - 2026-06-01

### Added
- Initial release of **Pivot & Pulse (InsightSpark)**.
- Angular standalone component architecture with Reactive Signals.
- D3.js force-directed concept graph visualization.
- Positive psychology (PERMA+H) goal structuring.
- Creative lateral thinking provocation generator.
