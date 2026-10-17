import { Injectable, signal } from '@angular/core';
import { StrategyId } from '../models/creative-types';

export interface SynergyTriadRecommendation {
  strategyIds: [StrategyId, StrategyId, StrategyId];
  axisIndex: number;
  axisName: string;
  bridgeTitle: string;
  bridgeMechanism: string;
  score: number;
}

interface AxisSynergyTriad {
  axisIndex: number;
  axisName: string;
  creativeTriads: {
    ids: [StrategyId, StrategyId, StrategyId];
    keywords: string[];
    bridgeTitle: string;
    bridgeMechanism: string;
  }[];
  careTriads: {
    ids: [StrategyId, StrategyId, StrategyId];
    keywords: string[];
    bridgeTitle: string;
    bridgeMechanism: string;
    roles: [string, string, string];
  }[];
}

/**
 * 6-Axis Contextual Triad Graph Model:
 * Maps each of the 6 Calibrator Axes (0..5) + Problem Context to high-leverage
 * 3-Strategy Collisions (1 Divergent Spark + 1 Human/System Bridge + 1 Grounding Anchor).
 */
export const AXIS_SYNERGY_GRAPH: AxisSynergyTriad[] = [
  {
    axisIndex: 0,
    axisName: 'High-Craft Precision',
    creativeTriads: [
      {
        ids: ['first-principles', 'constraints', 'critical-path'],
        keywords: ['budget', 'cost', 'build', 'material', 'tool', 'repair', 'workshop', 'hardware'],
        bridgeTitle: 'Zero-Waste Practical Build',
        bridgeMechanism: 'Strip the challenge to its basic physical requirements, use low-cost everyday materials, and sequence the build into 2 simple steps.',
      },
      {
        ids: ['simplify', 'nature', 'fmea'],
        keywords: ['water', 'flood', 'drain', 'park', 'wind', 'roof', 'garden', 'soil'],
        bridgeTitle: 'Low-Maintenance Natural Mechanics',
        bridgeMechanism: 'Use passive gravity/soil mechanics instead of complex pumps, keep upkeep simple for volunteers, and add a basic clog/weather safeguard.',
      },
    ],
    careTriads: [
      {
        ids: ['constraints', 'environmental-safety', 'critical-path'],
        keywords: ['fall', 'hip', 'walk', 'stairs', 'reach', 'kitchen', 'garden', 'joint'],
        bridgeTitle: 'Waist-High Ergonomic Sequence',
        bridgeMechanism: 'Remove bending/lifting strain with waist-high tools, clear safe 36-inch pathways first, and pace recovery in small daily steps.',
        roles: ['Physical Therapist', 'Son', 'Grandmother'],
      },
      {
        ids: ['simplify', 'first-principles', 'respite-pacing'],
        keywords: ['med', 'schedule', 'routine', 'tired', 'morning', 'discharge'],
        bridgeTitle: 'Friction-Free Daily Routine',
        bridgeMechanism: 'Simplify the daily care checklist to the 3 most important habits and lock in a protected 3-hour weekly caregiver rest window.',
        roles: ['Bedside Nurse', 'Daughter', 'Mother'],
      },
    ],
  },
  {
    axisIndex: 1,
    axisName: 'Falsifiable Thesis (H₀)',
    creativeTriads: [
      {
        ids: ['what-if', 'root-cause', 'fmea'],
        keywords: ['risk', 'test', 'fail', 'storm', 'safety', 'winter', 'traffic'],
        bridgeTitle: 'Pre-Mortem Stress-Tested Spark',
        bridgeMechanism: 'Explore a bold "What If" improvement, trace the #1 root bottleneck, and pre-test how it handles bad weather or heavy use.',
      },
      {
        ids: ['opposite', 'first-principles', 'fmea'],
        keywords: ['crowd', 'waste', 'noise', 'energy', 'light'],
        bridgeTitle: 'Falsifiable Assumption Flip',
        bridgeMechanism: 'Flip the usual delivery assumption on its head and verify safety with a small 48-hour real-world trial.',
      },
    ],
    careTriads: [
      {
        ids: ['root-cause', 'environmental-safety', 'fmea'],
        keywords: ['dizzy', 'balance', 'night', 'bathroom', 'slip', 'hospital'],
        bridgeTitle: '72-Hour Safety & Root-Cause Shield',
        bridgeMechanism: 'Identify the exact time-of-day fatigue or lighting trigger and put a simple non-slip / night-light safeguard in place today.',
        roles: ['Physical Therapist', 'Patient Advocate', 'Father'],
      },
      {
        ids: ['what-if', 'fmea', 'respite-pacing'],
        keywords: ['anxious', 'fear', 'pain', 'overwhelmed', 'burnout'],
        bridgeTitle: 'Safe Micro-Trial with Respite Backup',
        bridgeMechanism: 'Test a gentle 10-minute version of the activity during peak energy hours while keeping a backup rest plan ready.',
        roles: ['Positive Psychologist', 'Mother', 'Best Friend'],
      },
    ],
  },
  {
    axisIndex: 2,
    axisName: 'Caslon Editorial Authority',
    creativeTriads: [
      {
        ids: ['simplify', 'first-principles', 'critical-path'],
        keywords: ['sign', 'guide', 'community', 'rule', 'library', 'school', 'shared'],
        bridgeTitle: 'Subtract-Then-Sequence Clarity',
        bridgeMechanism: 'Remove 50% of the steps and rules so any neighbor or visitor can understand and use the system in 30 seconds.',
      },
      {
        ids: ['child', 'simplify', 'constraints'],
        keywords: ['learn', 'kid', 'family', 'park', 'trail', 'display'],
        bridgeTitle: 'Intuitive Everyday Design',
        bridgeMechanism: 'Make how the space works immediately visible and welcoming without needing a manual or complex instructions.',
      },
    ],
    careTriads: [
      {
        ids: ['simplify', 'sensory-bridge', 'critical-path'],
        keywords: ['memory', 'confusion', 'evening', 'sundown', 'calm', 'music', 'light'],
        bridgeTitle: 'Calm Sensory & Visual Clarity',
        bridgeMechanism: 'Declutter the room, use warm indirect lighting and familiar music, and keep communication to one calm invitation at a time.',
        roles: ['Occupational Therapist', 'Daughter', 'Grandmother'],
      },
      {
        ids: ['simplify', 'kinship-triad', 'respite-pacing'],
        keywords: ['handoff', 'family', 'nurse', 'notes', 'check'],
        bridgeTitle: 'Single-Card Family Handoff',
        bridgeMechanism: 'Use one simple fridge/table checklist so family helpers and clinicians share the exact same calm daily plan.',
        roles: ['Kinship Coordinator', 'Mother', 'Son'],
      },
    ],
  },
  {
    axisIndex: 3,
    axisName: 'Combinatorial Synthesis',
    creativeTriads: [
      {
        ids: ['combinatorial', 'nature', 'kinship-triad'],
        keywords: ['garden', 'park', 'food', 'tree', 'compost', 'bench', 'craft'],
        bridgeTitle: 'Biomimetic Community Fusion',
        bridgeMechanism: 'Combine natural water/soil cycles with cross-generational neighborhood craft so infrastructure doubles as a gathering spot.',
      },
      {
        ids: ['combinatorial', 'butterfly', 'simplify'],
        keywords: ['street', 'bike', 'market', 'repair', 'coffee', 'tool'],
        bridgeTitle: 'Everyday Dual-Use Hub',
        bridgeMechanism: 'Pair two existing neighborhood habits (like morning coffee and tool repair) in one shared space for zero extra overhead.',
      },
    ],
    careTriads: [
      {
        ids: ['kinship-triad', 'sensory-bridge', 'perma-strengths'],
        keywords: ['grandchild', 'story', 'cook', 'music', 'plant', 'art', 'lonely'],
        bridgeTitle: '3-Generation Sensory & Strengths Mesh',
        bridgeMechanism: 'Pair youth curiosity with elder wisdom around a hands-on sensory hobby while giving the primary caregiver a restful break.',
        roles: ['Daughter', 'Mother', 'Grandmother'],
      },
      {
        ids: ['found-kinship', 'butterfly', 'perma-strengths'],
        keywords: ['neighbor', 'friend', 'club', 'tea', 'walk', 'porch'],
        bridgeTitle: 'Neighborhood Micro-Social Bridge',
        bridgeMechanism: 'Connect a small weekly porch or hobby ritual with neighbors so social joy grows naturally outside clinical settings.',
        roles: ['Kinship Coordinator', 'Best Friend', 'Grandfather'],
      },
    ],
  },
  {
    axisIndex: 4,
    axisName: 'Dignity & Agency',
    creativeTriads: [
      {
        ids: ['perspective-inversion', 'kinship-triad', 'perma-strengths'],
        keywords: ['elder', 'accessible', 'wheelchair', 'bench', 'shade', 'mentor'],
        bridgeTitle: 'Co-Designed Community Stewardship',
        bridgeMechanism: 'Design from the perspective of elders and kids first, turning passive visitors into proud mentors and co-creators.',
      },
      {
        ids: ['boundary-dissolution', 'found-kinship', 'simplify'],
        keywords: ['volunteer', 'neighbor', 'share', 'free', 'open'],
        bridgeTitle: 'Open-Invitation Neighborhood Commons',
        bridgeMechanism: 'Replace rigid gatekeeping with simple "take a little, tend a little" invitations that honor everyone’s contribution.',
      },
    ],
    careTriads: [
      {
        ids: ['ethical-dignity', 'perma-strengths', 'kinship-triad'],
        keywords: ['independent', 'pride', 'choice', 'refuse', 'dignity', 'mentor'],
        bridgeTitle: '"Nothing About Me Without Me" Autonomy Plan',
        bridgeMechanism: 'Center the person as the expert decision-maker and mentor, adapting tasks around their lifelong strengths and choices.',
        roles: ['Patient Advocate', 'Grandmother', 'Daughter'],
      },
      {
        ids: ['perspective-inversion', 'boundary-dissolution', 'respite-pacing'],
        keywords: ['therapy', 'exercise', 'rehab', 'stiff', 'bored'],
        bridgeTitle: 'Joyful Hobby Over Clinical Drill',
        bridgeMechanism: 'Replace sterile rehab exercises with a meaningful real-world hobby (like potting herbs or sorting family photos) at their own pace.',
        roles: ['Positive Psychologist', 'Physical Therapist', 'Son'],
      },
    ],
  },
  {
    axisIndex: 5,
    axisName: '4-Slot Cognitive Calm',
    creativeTriads: [
      {
        ids: ['butterfly', 'simplify', 'critical-path'],
        keywords: ['overwhelm', 'start', 'small', 'quick', 'easy', 'first'],
        bridgeTitle: '15-Minute First-Step Domino',
        bridgeMechanism: 'Pick the single smallest 15-minute physical adjustment that unlocks momentum, and ignore everything else until Step 1 works.',
      },
      {
        ids: ['constraints', 'simplify', 'feedback-loop'],
        keywords: ['habit', 'daily', 'maintain', 'upkeep', 'clean'],
        bridgeTitle: 'Self-Sustaining 3-Step Loop',
        bridgeMechanism: 'Cap the design at 3 simple elements that naturally tidy or replenish themselves without daily management.',
      },
    ],
    careTriads: [
      {
        ids: ['butterfly', 'respite-pacing', 'critical-path'],
        keywords: ['exhausted', 'fatigue', 'overwhelmed', 'sleep', 'caregiver', 'stress'],
        bridgeTitle: '4-Slot Calm & Caregiver Respite First',
        bridgeMechanism: 'Pause non-essential tasks, lock in a 3-hour caregiver rest handoff first, and focus on just 1 gentle 10-minute daily win.',
        roles: ['Kinship Coordinator', 'Mother', 'Best Friend'],
      },
      {
        ids: ['sensory-bridge', 'simplify', 'respite-pacing'],
        keywords: ['pain', 'tremor', 'ataxia', 'nervous', 'rest', 'evening'],
        bridgeTitle: 'Low-Tremor Parasympathetic Pacing',
        bridgeMechanism: 'Pair 20-minute seated activity windows with warm lighting, zero-bending ergonomics, and scheduled rest intervals.',
        roles: ['Occupational Therapist', 'Positive Psychologist', 'Daughter'],
      },
    ],
  },
];

@Injectable({
  providedIn: 'root',
})
export class SynergyGraphService {
  readonly activeRecommendation = signal<SynergyTriadRecommendation | null>(null);
  private rotationCounter = 0;

  /**
   * Computes the optimal 3-Strategy Synergy Triad (Spark + Bridge + Anchor)
   * given the user's problem text, mode ('creative' | 'care'), and active 6-Axis Wheel index (0..5).
   */
  recommendTriad(
    problem: string,
    mode: 'creative' | 'care',
    focusedAxisIndex: number
  ): {
    recommendation: SynergyTriadRecommendation;
    roles?: [string, string, string];
  } {
    const axisIdx = ((focusedAxisIndex % 6) + 6) % 6;
    const axisEntry = AXIS_SYNERGY_GRAPH[axisIdx] || AXIS_SYNERGY_GRAPH[0];
    const lower = (problem || '').toLowerCase();

    const candidates = mode === 'care' ? axisEntry.careTriads : axisEntry.creativeTriads;
    let bestIdx = 0;
    let bestHits = -1;

    candidates.forEach((cand, idx) => {
      let hits = 0;
      for (const kw of cand.keywords) {
        if (lower.includes(kw)) hits++;
      }
      if (hits > bestHits) {
        bestHits = hits;
        bestIdx = idx;
      }
    });

    // If no specific keywords matched or user clicks Roll Smart Synergy repeatedly, alternate cleanly
    if (bestHits === 0) {
      bestIdx = this.rotationCounter % candidates.length;
      this.rotationCounter++;
    } else {
      this.rotationCounter++;
      if (this.rotationCounter % 2 === 0 && candidates.length > 1) {
        bestIdx = (bestIdx + 1) % candidates.length;
      }
    }

    const chosen = candidates[bestIdx];
    const recommendation: SynergyTriadRecommendation = {
      strategyIds: chosen.ids,
      axisIndex: axisEntry.axisIndex,
      axisName: axisEntry.axisName,
      bridgeTitle: chosen.bridgeTitle,
      bridgeMechanism: chosen.bridgeMechanism,
      score: Number(Math.min(0.98, 0.88 + Math.max(0, bestHits) * 0.03).toFixed(2)),
    };

    this.activeRecommendation.set(recommendation);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        'spark_synergy_bridge',
        `[SMART SYNERGY TRIAD (${chosen.bridgeTitle} — Axis: ${axisEntry.axisName}): ${chosen.bridgeMechanism}]`
      );
    }

    return {
      recommendation,
      roles: 'roles' in chosen ? (chosen as { roles: [string, string, string] }).roles : undefined,
    };
  }
}
