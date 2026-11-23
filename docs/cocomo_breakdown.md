# COCOMO II Granular File Breakdown (InsightSpark)
**Project Architecture & Development Effort Cost Analysis**

This report details the Constructive Cost Model II (COCOMO II) estimation at the individual source file level. Effort allocation (Person-Hours) is calculated proportionally based on the total codebase size and product complexity.

## 📊 Summary Metrics

| Metric | Estimated Value | Details / Assumptions |
|---|---|---|
| **Total Lines of Code (SLOC)** | **11,758** | Source lines of code excluding comments/blanks across all scanned modules. |
| **Total Size (KSLOC)** | **11.758** | Thousands of Source Lines of Code. |
| **Exponent B** | **1.0887** | Based on scale factors: Precedentedness, Flexibility, Risk Resolution, Team Cohesion, and Process Maturity. |
| **Effort Adjustment Factor (EAF)** | **0.4033** | Based on multipliers: Reliability, Complexity, Time constraints, Personnel experience. |
| **Estimated Effort (Person-Months)** | **17.35 PM** | The total developer months required under standard velocity. |
| **Estimated Effort (Person-Hours)** | **2,637 hrs** | Based on 152 working hours per person-month. |
| **Estimated Schedule (TDEV)** | **8.59 months** | Recommended calendar schedule for a standard team size. |

---

## 📂 File-by-File Effort Distribution

The table below catalogs analyzed source files, sorted descending by code size.

| File Path | Module | SLOC | Code Share | Effort (Hrs) | Complexity |
|---|---|---|---|---|---|
| [server.js](../server.js) | Backend API Proxy (Node) | 2,102 | 17.88% | 471.4 hrs | High |
| [gemini.service.ts](../src/services/gemini.service.ts) | Web Client (Angular) | 1,683 | 14.31% | 377.4 hrs | High |
| [app.component.ts](../src/app.component.ts) | Web Client (Angular) | 1,560 | 13.27% | 349.8 hrs | High |
| [help.component.ts](../src/components/ui/help.component.ts) | Web Client (Angular) | 1,002 | 8.52% | 224.7 hrs | High |
| [brand-drift-calibrator.service.ts](../src/services/brand-drift-calibrator.service.ts) | Web Client (Angular) | 611 | 5.20% | 137.0 hrs | High |
| [translation.service.ts](../src/services/translation.service.ts) | Web Client (Angular) | 589 | 5.01% | 132.1 hrs | High |
| [brand-drift-calibrator.component.ts](../src/components/ui/brand-drift-calibrator.component.ts) | Web Client (Angular) | 558 | 4.75% | 125.1 hrs | High |
| [graph-view.component.ts](../src/components/ui/graph-view.component.ts) | Web Client (Angular) | 481 | 4.09% | 107.9 hrs | High |
| [webgpu-engine.ts](../src/utils/webgpu-engine.ts) | Web Client (Angular) | 442 | 3.76% | 99.1 hrs | High |
| [creative-types.ts](../src/models/creative-types.ts) | Web Client (Angular) | 413 | 3.51% | 92.6 hrs | High |
| [cost-model.ts](../src/utils/cost-model.ts) | Web Client (Angular) | 326 | 2.77% | 73.1 hrs | Nominal |
| [lojong-cleansing.component.ts](../src/components/ui/lojong-cleansing.component.ts) | Web Client (Angular) | 308 | 2.62% | 69.1 hrs | Nominal |
| [synergy-graph.service.ts](../src/services/synergy-graph.service.ts) | Web Client (Angular) | 294 | 2.50% | 65.9 hrs | Nominal |
| [starter-scenarios.ts](../src/models/starter-scenarios.ts) | Web Client (Angular) | 241 | 2.05% | 54.0 hrs | Nominal |
| [icon.component.ts](../src/components/ui/icon.component.ts) | Web Client (Angular) | 235 | 2.00% | 52.7 hrs | Nominal |
| [webmcp-diagnostic.service.ts](../src/services/webmcp-diagnostic.service.ts) | Web Client (Angular) | 130 | 1.11% | 29.2 hrs | High |
| [vitals-trend-graph.component.ts](../src/components/ui/vitals-trend-graph.component.ts) | Web Client (Angular) | 127 | 1.08% | 28.5 hrs | Nominal |
| [safety-guards.ts](../src/utils/safety-guards.ts) | Web Client (Angular) | 126 | 1.07% | 28.3 hrs | Nominal |
| [medical-data-card.component.ts](../src/components/ui/medical-data-card.component.ts) | Web Client (Angular) | 124 | 1.05% | 27.8 hrs | Nominal |
| [storage.service.ts](../src/services/storage.service.ts) | Web Client (Angular) | 109 | 0.93% | 24.4 hrs | Nominal |
| [speech.service.ts](../src/services/speech.service.ts) | Web Client (Angular) | 91 | 0.77% | 20.4 hrs | Low |
| [pocketgull-integration.service.ts](../src/services/pocketgull-integration.service.ts) | Web Client (Angular) | 59 | 0.50% | 13.2 hrs | Low |
| [agent-types.ts](../src/models/agent-types.ts) | Web Client (Angular) | 47 | 0.40% | 10.5 hrs | Low |
| [klee-grid.component.ts](../src/components/ui/klee-grid.component.ts) | Web Client (Angular) | 33 | 0.28% | 7.4 hrs | Nominal |
| [vitals.service.ts](../src/services/vitals.service.ts) | Web Client (Angular) | 32 | 0.27% | 7.2 hrs | Low |
| [klee-palette.service.ts](../src/services/klee-palette.service.ts) | Web Client (Angular) | 22 | 0.19% | 4.9 hrs | Low |
| [brush.directive.ts](../src/directives/brush.directive.ts) | Web Client (Angular) | 13 | 0.11% | 2.9 hrs | Low |

---

*Report generated automatically by `scripts/estimate-effort-detailed.js`. All metrics adhere to the COCOMO II Post-Architecture Model.*
