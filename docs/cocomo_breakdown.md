# COCOMO II Granular File Breakdown (InsightSpark)
**Project Architecture & Development Effort Cost Analysis**

This report details the Constructive Cost Model II (COCOMO II) estimation at the individual source file level. Effort allocation (Person-Hours) is calculated proportionally based on the total codebase size and product complexity.

## 📊 Summary Metrics

| Metric | Estimated Value | Details / Assumptions |
|---|---|---|
| **Total Lines of Code (SLOC)** | **3,171** | Source lines of code excluding comments/blanks across all scanned modules. |
| **Total Size (KSLOC)** | **3.171** | Thousands of Source Lines of Code. |
| **Exponent B** | **1.0887** | Based on scale factors: Precedentedness, Flexibility, Risk Resolution, Team Cohesion, and Process Maturity. |
| **Effort Adjustment Factor (EAF)** | **0.4033** | Based on multipliers: Reliability, Complexity, Time constraints, Personnel experience. |
| **Estimated Effort (Person-Months)** | **4.16 PM** | The total developer months required under standard velocity. |
| **Estimated Effort (Person-Hours)** | **633 hrs** | Based on 152 working hours per person-month. |
| **Estimated Schedule (TDEV)** | **5.61 months** | Recommended calendar schedule for a standard team size. |

---

## 📂 File-by-File Effort Distribution

The table below catalogs analyzed source files, sorted descending by code size.

| File Path | Module | SLOC | Code Share | Effort (Hrs) | Complexity |
|---|---|---|---|---|---|
| [app.component.ts](file:///C:/Users/philg/InsightSpark/InsightSpark/src/app.component.ts) | Web Client (Angular) | 613 | 19.33% | 122.4 hrs | High |
| [server.js](file:///C:/Users/philg/InsightSpark/InsightSpark/server.js) | Backend API Proxy (Node) | 451 | 14.22% | 90.0 hrs | High |
| [gemini.service.ts](file:///C:/Users/philg/InsightSpark/InsightSpark/src/services/gemini.service.ts) | Web Client (Angular) | 443 | 13.97% | 88.4 hrs | High |
| [graph-view.component.ts](file:///C:/Users/philg/InsightSpark/InsightSpark/src/components/ui/graph-view.component.ts) | Web Client (Angular) | 321 | 10.12% | 64.1 hrs | High |
| [lojong-cleansing.component.ts](file:///C:/Users/philg/InsightSpark/InsightSpark/src/components/ui/lojong-cleansing.component.ts) | Web Client (Angular) | 308 | 9.71% | 61.5 hrs | Nominal |
| [help.component.ts](file:///C:/Users/philg/InsightSpark/InsightSpark/src/components/ui/help.component.ts) | Web Client (Angular) | 246 | 7.76% | 49.1 hrs | Nominal |
| [creative-types.ts](file:///C:/Users/philg/InsightSpark/InsightSpark/src/models/creative-types.ts) | Web Client (Angular) | 210 | 6.62% | 41.9 hrs | Nominal |
| [icon.component.ts](file:///C:/Users/philg/InsightSpark/InsightSpark/src/components/ui/icon.component.ts) | Web Client (Angular) | 168 | 5.30% | 33.5 hrs | Nominal |
| [vitals-trend-graph.component.ts](file:///C:/Users/philg/InsightSpark/InsightSpark/src/components/ui/vitals-trend-graph.component.ts) | Web Client (Angular) | 127 | 4.01% | 25.4 hrs | Nominal |
| [medical-data-card.component.ts](file:///C:/Users/philg/InsightSpark/InsightSpark/src/components/ui/medical-data-card.component.ts) | Web Client (Angular) | 124 | 3.91% | 24.8 hrs | Nominal |
| [storage.service.ts](file:///C:/Users/philg/InsightSpark/InsightSpark/src/services/storage.service.ts) | Web Client (Angular) | 60 | 1.89% | 12.0 hrs | Nominal |
| [klee-grid.component.ts](file:///C:/Users/philg/InsightSpark/InsightSpark/src/components/ui/klee-grid.component.ts) | Web Client (Angular) | 33 | 1.04% | 6.6 hrs | Nominal |
| [vitals.service.ts](file:///C:/Users/philg/InsightSpark/InsightSpark/src/services/vitals.service.ts) | Web Client (Angular) | 32 | 1.01% | 6.4 hrs | Low |
| [klee-palette.service.ts](file:///C:/Users/philg/InsightSpark/InsightSpark/src/services/klee-palette.service.ts) | Web Client (Angular) | 22 | 0.69% | 4.4 hrs | Low |
| [brush.directive.ts](file:///C:/Users/philg/InsightSpark/InsightSpark/src/directives/brush.directive.ts) | Web Client (Angular) | 13 | 0.41% | 2.6 hrs | Low |

---

*Report generated automatically by `scripts/estimate-effort-detailed.js`. All metrics adhere to the COCOMO II Post-Architecture Model.*
