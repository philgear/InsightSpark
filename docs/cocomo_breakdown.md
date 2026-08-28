# COCOMO II Granular File Breakdown (InsightSpark)
**Project Architecture & Development Effort Cost Analysis**

This report details the Constructive Cost Model II (COCOMO II) estimation at the individual source file level. Effort allocation (Person-Hours) is calculated proportionally based on the total codebase size and product complexity.

## 📊 Summary Metrics

| Metric | Estimated Value | Details / Assumptions |
|---|---|---|
| **Total Lines of Code (SLOC)** | **4,184** | Source lines of code excluding comments/blanks across all scanned modules. |
| **Total Size (KSLOC)** | **4.184** | Thousands of Source Lines of Code. |
| **Exponent B** | **1.0887** | Based on scale factors: Precedentedness, Flexibility, Risk Resolution, Team Cohesion, and Process Maturity. |
| **Effort Adjustment Factor (EAF)** | **0.4033** | Based on multipliers: Reliability, Complexity, Time constraints, Personnel experience. |
| **Estimated Effort (Person-Months)** | **5.63 PM** | The total developer months required under standard velocity. |
| **Estimated Effort (Person-Hours)** | **856 hrs** | Based on 152 working hours per person-month. |
| **Estimated Schedule (TDEV)** | **6.14 months** | Recommended calendar schedule for a standard team size. |

---

## 📂 File-by-File Effort Distribution

The table below catalogs analyzed source files, sorted descending by code size.

| File Path | Module | SLOC | Code Share | Effort (Hrs) | Complexity |
|---|---|---|---|---|---|
| [server.js](file:///c:/Users/philg/InsightSpark/InsightSpark/server.js) | Backend API Proxy (Node) | 969 | 23.16% | 198.3 hrs | High |
| [app.component.ts](file:///c:/Users/philg/InsightSpark/InsightSpark/src/app.component.ts) | Web Client (Angular) | 795 | 19.00% | 162.7 hrs | High |
| [gemini.service.ts](file:///c:/Users/philg/InsightSpark/InsightSpark/src/services/gemini.service.ts) | Web Client (Angular) | 582 | 13.91% | 119.1 hrs | High |
| [graph-view.component.ts](file:///c:/Users/philg/InsightSpark/InsightSpark/src/components/ui/graph-view.component.ts) | Web Client (Angular) | 321 | 7.67% | 65.7 hrs | High |
| [help.component.ts](file:///c:/Users/philg/InsightSpark/InsightSpark/src/components/ui/help.component.ts) | Web Client (Angular) | 311 | 7.43% | 63.6 hrs | Nominal |
| [lojong-cleansing.component.ts](file:///c:/Users/philg/InsightSpark/InsightSpark/src/components/ui/lojong-cleansing.component.ts) | Web Client (Angular) | 308 | 7.36% | 63.0 hrs | Nominal |
| [creative-types.ts](file:///c:/Users/philg/InsightSpark/InsightSpark/src/models/creative-types.ts) | Web Client (Angular) | 227 | 5.43% | 46.4 hrs | Nominal |
| [icon.component.ts](file:///c:/Users/philg/InsightSpark/InsightSpark/src/components/ui/icon.component.ts) | Web Client (Angular) | 168 | 4.02% | 34.4 hrs | Nominal |
| [vitals-trend-graph.component.ts](file:///c:/Users/philg/InsightSpark/InsightSpark/src/components/ui/vitals-trend-graph.component.ts) | Web Client (Angular) | 127 | 3.04% | 26.0 hrs | Nominal |
| [medical-data-card.component.ts](file:///c:/Users/philg/InsightSpark/InsightSpark/src/components/ui/medical-data-card.component.ts) | Web Client (Angular) | 124 | 2.96% | 25.4 hrs | Nominal |
| [storage.service.ts](file:///c:/Users/philg/InsightSpark/InsightSpark/src/services/storage.service.ts) | Web Client (Angular) | 60 | 1.43% | 12.3 hrs | Nominal |
| [pocketgull-integration.service.ts](file:///c:/Users/philg/InsightSpark/InsightSpark/src/services/pocketgull-integration.service.ts) | Web Client (Angular) | 50 | 1.20% | 10.2 hrs | Low |
| [agent-types.ts](file:///c:/Users/philg/InsightSpark/InsightSpark/src/models/agent-types.ts) | Web Client (Angular) | 42 | 1.00% | 8.6 hrs | Low |
| [klee-grid.component.ts](file:///c:/Users/philg/InsightSpark/InsightSpark/src/components/ui/klee-grid.component.ts) | Web Client (Angular) | 33 | 0.79% | 6.8 hrs | Nominal |
| [vitals.service.ts](file:///c:/Users/philg/InsightSpark/InsightSpark/src/services/vitals.service.ts) | Web Client (Angular) | 32 | 0.76% | 6.5 hrs | Low |
| [klee-palette.service.ts](file:///c:/Users/philg/InsightSpark/InsightSpark/src/services/klee-palette.service.ts) | Web Client (Angular) | 22 | 0.53% | 4.5 hrs | Low |
| [brush.directive.ts](file:///c:/Users/philg/InsightSpark/InsightSpark/src/directives/brush.directive.ts) | Web Client (Angular) | 13 | 0.31% | 2.7 hrs | Low |

---

*Report generated automatically by `scripts/estimate-effort-detailed.js`. All metrics adhere to the COCOMO II Post-Architecture Model.*
