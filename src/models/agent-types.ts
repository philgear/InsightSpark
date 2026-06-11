// ─── Agentic Pipeline Types ───────────────────────────────────────────
// These types power the multi-agent debate, auto-selection, and
// iterative refinement system built on top of the base CreativeStrategy.

import { InsightResult } from './creative-types';

// ─── Meta-Agent: Auto-Strategy Selection ──────────────────────────────

/** Output from the meta-agent that analyzes a problem and picks strategies. */
export interface StrategySelection {
  selectedIds: string[];
  reasoning: string;
  problemCategory: string;
}

// ─── Debate Round ─────────────────────────────────────────────────────

/** A single critique from one strategy-agent evaluating another's insight. */
export interface DebateEntry {
  agentId: string;
  agentName: string;
  targetInsight: string;
  critique: string;
  strengthens: boolean;
  suggestedRefinement?: string;
}

// ─── Refinement Round ─────────────────────────────────────────────────

/** An insight that has been improved by incorporating debate feedback. */
export interface RefinedInsight {
  original: string;
  refined: string;
  debateInfluences: string[];
  confidence: number;
}

// ─── Full Agentic Result ──────────────────────────────────────────────

/** The complete output of a deep analysis run. */
export interface AgenticResult {
  selection: StrategySelection;
  initialInsights: InsightResult[];
  debate: DebateEntry[];
  refinedInsights: RefinedInsight[];
  consensus: string;
}

// ─── Pipeline Phase Tracking ──────────────────────────────────────────

/** UI progress states for the agentic pipeline. */
export type AgenticPhase =
  | 'selecting'
  | 'generating'
  | 'debating'
  | 'refining'
  | 'synthesizing'
  | 'complete';

/** Phase metadata for progress display. */
export const AGENTIC_PHASES: { phase: AgenticPhase; label: string; icon: string }[] = [
  { phase: 'selecting',    label: 'Selecting Strategies', icon: 'brain' },
  { phase: 'generating',   label: 'Generating Insights',  icon: 'sparkles' },
  { phase: 'debating',     label: 'Cross-Strategy Debate', icon: 'refresh' },
  { phase: 'refining',     label: 'Refining Insights',     icon: 'arrow-up' },
  { phase: 'synthesizing', label: 'Building Consensus',    icon: 'check' },
  { phase: 'complete',     label: 'Analysis Complete',     icon: 'check' },
];
