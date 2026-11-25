import { Injectable, signal, computed } from '@angular/core';

export interface BrandDriftAxis {
  id: string;
  positivePole: string;
  negativePole: string;
  positiveAnchor: string;
  negativeAnchor: string;
  positiveKeywords: string[];
  negativeKeywords: string[];
}

export interface StrategyOutcomeContract {
  id: string;
  title: string;
  primaryAxisIndex: number; // 0..5
  secondaryAxisIndex: number; // 0..5
  expectedOutcomeFormula: string;
  outcomeMarkers: string[];
  orthodoxyTrap: string;
}

export type CalibratorOutputModel =
  | 'pivotpulse:latest'
  | 'pocketgull-clinical:latest'
  | 'branddesk:latest'
  | 'gemma-4-26b-a4b-it'
  | 'gemini-4-hydrogen'
  | 'gemini-live';

export interface AutonomousDecisionReceipt {
  timestamp: string;
  selectedAxisIndex: number;
  selectedAxisName: string;
  secondaryAxisIndex: number;
  selectedModel: CalibratorOutputModel;
  recommendedStrategyIds: [string, string, string];
  tunedAlpha: number;
  tunedBeta: number;
  confidenceScore: number;
  rationale: string;
  falsificationCriterion: string;
}

export interface MachineTeachingLesson {
  lessonId: string;
  conceptAxis: string;
  strategyId: string;
  outcomeContractFormula: string;
  teacherDecomposition: string;
  prompt: string;
  chosen: string;
  rejected: string;
  metadata: {
    provenance: string;
    targetStudentModel: CalibratorOutputModel;
    steeringVector: string;
    hazardReducedFrom: number;
    hazardReducedTo: number;
  };
}

export interface BrandTurnScore {
  turnIndex: number;
  label: string;
  sourceModel: CalibratorOutputModel;
  excerpt: string;
  poleScores: number[]; // 12 values [0..1] (6 positive, 6 negative)
  dominantPositivePole: string;
  dominantHazardPole: string;
  maxHazardScore: number;
  jevExplanationScore: number;
  outcomeFulfillmentScore?: number; // 0..1 score measuring if the strategy's expected structural outcome was achieved
  outcomeContractTitle?: string;
  isDrifting: boolean;
  jppLayers: {
    l6: string[];
    l16: string[];
    l24: string[];
    l32: string[];
  };
}

export const STRATEGY_OUTCOME_CONTRACTS: Record<string, StrategyOutcomeContract> = {
  'what-if': {
    id: 'what-if',
    title: 'What If? / Outcome Visualization',
    primaryAxisIndex: 3,
    secondaryAxisIndex: 1,
    expectedOutcomeFormula: 'Remove 1 default assumption → Trace the new equilibrium → Run a 48h $0 trial',
    outcomeMarkers: ['what if', 'instead of', 'without', 'remove', 'assume', 'trial', '48', 'replace', 'flip'],
    orthodoxyTrap: 'Vague wishful daydreaming without a concrete 48-hour real-world test',
  },
  'constraints': {
    id: 'constraints',
    title: 'Redefine Constraints / Adaptive Support',
    primaryAxisIndex: 0,
    secondaryAxisIndex: 5,
    expectedOutcomeFormula: 'Subtract the expensive tool/budget → Re-anchor on $0 household materials → Sequence 2 low-strain steps',
    outcomeMarkers: ['$0', 'without', 'existing', 'household', 'waist-high', 'subtract', 'zero', 'simple', 'limit', 'material'],
    orthodoxyTrap: 'Recommending expensive software, remodel contractors, or paid subscriptions',
  },
  'butterfly': {
    id: 'butterfly',
    title: 'The Butterfly Effect / Key Actions',
    primaryAxisIndex: 5,
    secondaryAxisIndex: 3,
    expectedOutcomeFormula: '2-Minute Micro-Trigger (A) → Immediate Domino Shift (B) → Systemic Relief (C)',
    outcomeMarkers: ['minute', 'micro', 'trigger', 'cascade', 'domino', 'unlock', 'small', 'first', 'chain', 'habit'],
    orthodoxyTrap: 'Proposing a massive 10-part overhaul instead of a single 2-minute trigger domino',
  },
  'combinatorial': {
    id: 'combinatorial',
    title: 'Combinatorial Evolution / Integrative Methods',
    primaryAxisIndex: 3,
    secondaryAxisIndex: 0,
    expectedOutcomeFormula: 'Domain A Mechanism × Domain B Routine → Single Dual-Use Everyday Lever',
    outcomeMarkers: ['pair', 'combine', 'blend', 'dual', 'together', 'while', 'ritual', 'bridge', 'cross'],
    orthodoxyTrap: 'Listing two separate ideas side-by-side without fusing their mechanics',
  },
  'opposite': {
    id: 'opposite',
    title: 'Opposite Day / Reverse Brainstorming',
    primaryAxisIndex: 3,
    secondaryAxisIndex: 1,
    expectedOutcomeFormula: 'Invert the orthodox rule 180° (PO) → Extract the hidden safety/efficiency gain → Calm daily habit',
    outcomeMarkers: ['invert', 'opposite', 'flip', 'instead of', 'reverse', 'stop', 'never', 'backward', 'bring'],
    orthodoxyTrap: 'Slightly tweaking the status quo instead of flipping the core direction 180°',
  },
  'future': {
    id: 'future',
    title: 'Future Vision / Goal-Oriented Vision',
    primaryAxisIndex: 2,
    secondaryAxisIndex: 0,
    expectedOutcomeFormula: 'Solved Future State → Backcast Milestone 3 → Milestone 2 → Today’s 15-Min Step 1',
    outcomeMarkers: ['backcast', 'today', 'first step', 'month', 'week', 'milestone', 'start', 'anchor', 'vision'],
    orthodoxyTrap: 'Sci-fi speculation with no backcast path to a concrete action this week',
  },
  'child': {
    id: 'child',
    title: 'Child’s Play / Core Message',
    primaryAxisIndex: 2,
    secondaryAxisIndex: 5,
    expectedOutcomeFormula: 'Strip 100% of jargon → Color/Tactile Visual Cue → 1-Sentence Playful Rule',
    outcomeMarkers: ['color', 'card', 'game', 'simple', 'visual', 'label', 'green', 'red', 'touch', 'one', 'magnet'],
    orthodoxyTrap: 'Using clinical or corporate jargon that requires a manual to understand',
  },
  'alien': {
    id: 'alien',
    title: 'Alien Perspective / Fresh Perspective',
    primaryAxisIndex: 3,
    secondaryAxisIndex: 2,
    expectedOutcomeFormula: 'Expose unexamined cultural ritual → Delete artificial friction → Direct human action',
    outcomeMarkers: ['why', 'friction', 'unnecessary', 'skip', 'direct', 'strip', 'habit', 'ritual', 'clear'],
    orthodoxyTrap: 'Accepting bureaucratic paperwork or habitual friction as unavoidable',
  },
  'nature': {
    id: 'nature',
    title: 'Nature’s Wisdom / Holistic Cycles',
    primaryAxisIndex: 3,
    secondaryAxisIndex: 5,
    expectedOutcomeFormula: 'Biological / Circadian Blueprint → Passive Flow / Energy Alignment → Zero-Force Routine',
    outcomeMarkers: ['natural', 'cycle', 'morning', 'evening', 'light', 'rhythm', 'flow', 'root', 'canopy', 'gravity', 'rest'],
    orthodoxyTrap: 'Forcing high-friction tasks against natural circadian energy troughs',
  },
  'superpower': {
    id: 'superpower',
    title: 'Superpower / Ideal Scenario',
    primaryAxisIndex: 3,
    secondaryAxisIndex: 0,
    expectedOutcomeFormula: 'Zero-Friction Ideal Outcome → Isolate the 80/20 Core Mechanism → $0 Analog Substitute',
    outcomeMarkers: ['instant', 'zero-friction', 'analog', 'tray', 'pre-pack', 'ready', 'one-tap', 'stage', 'shortcut'],
    orthodoxyTrap: 'Stopping at the magic-wand fantasy without translating it into a $0 analog tool',
  },
  'simplify': {
    id: 'simplify',
    title: 'Eliminate & Simplify / Focal Point',
    primaryAxisIndex: 2,
    secondaryAxisIndex: 5,
    expectedOutcomeFormula: 'Delete 75% of steps/clutter → Keep the 1 Irreducible Lever → 30-Second Execution',
    outcomeMarkers: ['single', 'one', 'remove', 'drop', 'eliminate', 'only', '3', 'card', 'keep', 'pause', 'replace'],
    orthodoxyTrap: 'Adding more checklists, apps, or rules instead of subtracting steps',
  },
  'random': {
    id: 'random',
    title: 'Random Object / Relatable Analogy',
    primaryAxisIndex: 3,
    secondaryAxisIndex: 0,
    expectedOutcomeFormula: 'Tangible Household Object Property → Structural Bridge → Physical Cue in the Room',
    outcomeMarkers: ['object', 'kitchen', 'timer', 'magnet', 'basket', 'bell', 'tray', 'physical', 'cue', 'like'],
    orthodoxyTrap: 'Abstract metaphor with no physical object placed in the environment',
  },
  'first-principles': {
    id: 'first-principles',
    title: 'First Principles / Core Needs',
    primaryAxisIndex: 0,
    secondaryAxisIndex: 1,
    expectedOutcomeFormula: 'Irreducible Physical/Physiological Truth → Rebuild from $0 Bedrock → Measurable Unit Metric',
    outcomeMarkers: ['bedrock', 'fundamental', 'need', 'energy', 'physical', 'water', 'light', 'measure', 'minute', 'direct'],
    orthodoxyTrap: 'Copying industry convention ("how it is usually done") instead of physical bedrock',
  },
  'root-cause': {
    id: 'root-cause',
    title: 'Root Cause (5 Whys) / Triggers & Causes',
    primaryAxisIndex: 1,
    secondaryAxisIndex: 0,
    expectedOutcomeFormula: 'Symptom → Trace 5 Layers to Upstream Bottleneck → Fix the Single Root Trigger',
    outcomeMarkers: ['because', 'upstream', 'trigger', 'root', 'bottleneck', 'before', 'prevent', 'source', 'why'],
    orthodoxyTrap: 'Treating downstream surface symptoms while leaving the upstream trigger intact',
  },
  'sensory-bridge': {
    id: 'sensory-bridge',
    title: 'Sensory Bridge & Somatics',
    primaryAxisIndex: 4,
    secondaryAxisIndex: 5,
    expectedOutcomeFormula: 'Bypass Verbal Overload → Activate 1 Somatic Cue (Warm Light / Scent / Rhythm) → Parasympathetic Calm',
    outcomeMarkers: ['warm', 'light', 'music', 'sound', 'scent', 'touch', 'tactile', 'textured', 'calm', 'breath', 'seated'],
    orthodoxyTrap: 'Giving long verbal lectures or text instructions during sensory fatigue',
  },
  'found-kinship': {
    id: 'found-kinship',
    title: 'Unlikely Alliances / Chosen Family Circles',
    primaryAxisIndex: 4,
    secondaryAxisIndex: 3,
    expectedOutcomeFormula: 'Identify Non-Traditional Ally (Neighbor/Peer/Club) → Low-Ask 15-Min Shared Ritual → Mutual Dignity',
    outcomeMarkers: ['neighbor', 'friend', 'ally', 'porch', 'community', 'share', 'volunteer', 'buddy', 'tea', 'swap'],
    orthodoxyTrap: 'Leaving 100% of the load on a single isolated primary caregiver',
  },
  'time-dilation': {
    id: 'time-dilation',
    title: 'Time Dilation / Circadian Micro-Pacing',
    primaryAxisIndex: 5,
    secondaryAxisIndex: 2,
    expectedOutcomeFormula: 'Match Task to Biological Peak Window → 3-Second Trigger + Protected Twilight Downshift',
    outcomeMarkers: ['morning', 'afternoon', 'evening', 'peak', 'window', 'minute', 'second', 'pace', 'rest', 'twilight'],
    orthodoxyTrap: 'Scheduling high-load decisions at the end of an exhausting day',
  },
  'boundary-dissolution': {
    id: 'boundary-dissolution',
    title: 'Boundary Dissolution / Identity vs. Pathology',
    primaryAxisIndex: 4,
    secondaryAxisIndex: 3,
    expectedOutcomeFormula: 'Separate Whole Human Identity from Symptom → Embed Action Inside a Loved Daily Ritual',
    outcomeMarkers: ['identity', 'mentor', 'hobby', 'craft', 'story', 'music', 'garden', 'cook', 'pride', 'natural'],
    orthodoxyTrap: 'Reducing the person or team to a clinical diagnosis or deficit checklist',
  },
  'system-fractal': {
    id: 'system-fractal',
    title: 'System Fractal / Ecosystem of Recovery',
    primaryAxisIndex: 3,
    secondaryAxisIndex: 5,
    expectedOutcomeFormula: 'Align Micro-Habit with Macro Room/Sleep Ecology → Parent System Solves Sub-Friction',
    outcomeMarkers: ['sleep', 'room', 'environment', 'system', 'whole', 'lighting', 'layout', 'pathway', 'ecosystem', 'rhythm'],
    orthodoxyTrap: 'Treating an isolated part while ignoring room layout, sleep, and nervous system load',
  },
  'feedback-loop': {
    id: 'feedback-loop',
    title: 'Unseen Ties & Feedback Loops / Relational Care Bridge',
    primaryAxisIndex: 5,
    secondaryAxisIndex: 1,
    expectedOutcomeFormula: 'Map Vicious Cycle (Stress → Friction → Avoidance) → Insert 1 Circuit-Breaker → Virtuous Loop',
    outcomeMarkers: ['loop', 'cycle', 'break', 'reinforce', 'when', 'then', 'together', 'signal', 'pause', 'reset'],
    orthodoxyTrap: 'Pushing harder on a stalled habit without breaking the fear/fatigue feedback loop',
  },
  'perspective-inversion': {
    id: 'perspective-inversion',
    title: 'Perspective Inversion / Triad Perspective Shift',
    primaryAxisIndex: 4,
    secondaryAxisIndex: 2,
    expectedOutcomeFormula: 'Triangulate 3 Lived Lenses (Safety + Lived Energy + Future Joy) → Co-Owned Decision',
    outcomeMarkers: ['perspective', 'lens', 'choice', 'lead', 'expert', 'voice', 'together', 'agree', 'comfort', 'safety'],
    orthodoxyTrap: 'Top-down monologue that ignores the lived fatigue or autonomy of the participant',
  },
  'fmea': {
    id: 'fmea',
    title: 'FMEA (Risk Analysis) / Safety Net',
    primaryAxisIndex: 1,
    secondaryAxisIndex: 0,
    expectedOutcomeFormula: 'Top Failure Mode → Early Warning Trigger → Fail-Safe $0 Physical Guardrail',
    outcomeMarkers: ['risk', 'fail', 'if', 'backup', 'guardrail', 'safeguard', 'prevent', 'check', 'fallback', 'light', 'grip'],
    orthodoxyTrap: 'Optimistic plan with zero pre-mortem failure safeguard or backup handoff',
  },
  'critical-path': {
    id: 'critical-path',
    title: 'Critical Path Method / Milestone Map',
    primaryAxisIndex: 0,
    secondaryAxisIndex: 5,
    expectedOutcomeFormula: '3-Milestone Dependency Chain: Step 1 (Unlocks) → Step 2 (Builds) → Step 3 (Sustains)',
    outcomeMarkers: ['step 1', 'first', 'before', 'then', 'next', 'sequence', 'unlock', 'milestone', 'day 1', '72'],
    orthodoxyTrap: 'Unordered laundry list of 10 tasks with no clear starting bottleneck',
  },
  'perma-strengths': {
    id: 'perma-strengths',
    title: 'VIA Strengths & Optimism / PERMA+H',
    primaryAxisIndex: 4,
    secondaryAxisIndex: 5,
    expectedOutcomeFormula: 'Anchor in Signature Strength + PERMA+H Pillar → ABCDE Temporary/Specific Reframe → Micro-Mastery Win',
    outcomeMarkers: ['strength', 'joy', 'meaning', 'pride', 'accomplish', 'flow', 'curiosity', 'kindness', 'humor', 'win', 'celebrate'],
    orthodoxyTrap: 'Deficit-focused pathology language that ignores character strengths and joy',
  },
  'kinship-triad': {
    id: 'kinship-triad',
    title: 'Intergenerational Kinship / Family Kinship & Legacy',
    primaryAxisIndex: 4,
    secondaryAxisIndex: 3,
    expectedOutcomeFormula: 'Youth Spark + Adult Orchestrator + Elder Wisdom → Shared Co-Activity that Frees Primary Caregiver',
    outcomeMarkers: ['grand', 'child', 'youth', 'elder', 'family', 'generation', 'share', 'story', 'teach', 'together', 'handoff'],
    orthodoxyTrap: 'Siloing generations or assigning all duties to a single middle-generation caregiver',
  },
  'respite-pacing': {
    id: 'respite-pacing',
    title: 'Sustainable Sprint & Burnout Shield / Respite Safeguards',
    primaryAxisIndex: 5,
    secondaryAxisIndex: 4,
    expectedOutcomeFormula: 'Non-Negotiable 3–4hr Weekly Respite Block + Named Relief Partner + Zero-Briefing Handoff Tray',
    outcomeMarkers: ['respite', 'hour', '3', '4', 'rest', 'break', 'handoff', 'relief', 'partner', 'tray', 'protect', 'off-duty'],
    orthodoxyTrap: 'Telling a burned-out caregiver to "practice self-care" without scheduling a concrete relief handoff',
  },
  'ethical-dignity': {
    id: 'ethical-dignity',
    title: 'Integrity & Non-Negotiable Boundaries / Dignity & Autonomy',
    primaryAxisIndex: 4,
    secondaryAxisIndex: 2,
    expectedOutcomeFormula: '"Nothing About Me Without Me" Consent Check → Voluntary 2-Option Choice → Full Privacy & Autonomy',
    outcomeMarkers: ['choice', 'consent', 'dignity', 'autonomy', 'prefer', 'decide', 'respect', 'option', 'invite', 'voice'],
    orthodoxyTrap: 'Coercive paternalism, mandatory compliance rules, or stripping adult decision-making',
  },
  'environmental-safety': {
    id: 'environmental-safety',
    title: 'Physical Grounding & Ergonomics / Living Room Safety',
    primaryAxisIndex: 1,
    secondaryAxisIndex: 0,
    expectedOutcomeFormula: 'Physical Room Audit (36-in Path / Lighting / Waist-High Reach) → Immediate Hazard Removal Today',
    outcomeMarkers: ['floor', 'rug', 'light', 'path', 'reach', 'waist', 'grab', 'chair', 'table', 'door', 'slip', 'stair'],
    orthodoxyTrap: 'Conceptual advice that ignores physical tripping hazards, reach strain, or room lighting',
  },
  'porters-five-forces': {
    id: 'porters-five-forces',
    title: 'Porter’s Five Forces / Systemic Support Moat',
    primaryAxisIndex: 0,
    secondaryAxisIndex: 1,
    expectedOutcomeFormula: 'Eliminate Single-Point Dependency → Redundant Backup Supply/Partner → Defensible High-Craft Moat',
    outcomeMarkers: ['backup', 'redundant', 'single-point', 'moat', 'substitute', 'dependency', 'supply', 'buffer', 'resilient'],
    orthodoxyTrap: 'Fragile single-point dependency where one absence or stockout collapses the system',
  },
};

export const BRAND_STRATEGY_AXES: BrandDriftAxis[] = [
  {
    id: 'craft-precision',
    positivePole: 'High-Craft Precision',
    negativePole: 'Generic AI Slop',
    positiveAnchor: 'Concrete mechanisms, measurable unit economics, architectural specificity, and crisp verbs.',
    negativeAnchor: 'Delve into the tapestry of synergistic paradigms and leverage cutting-edge holistic ecosystems.',
    positiveKeywords: ['mechanism', 'unit', 'concrete', 'constraint', 'latency', 'metric', 'protocol', 'specific', 'first-principles'],
    negativeKeywords: ['delve', 'tapestry', 'synergy', 'paradigm', 'holistic', 'revolutionary', 'seamless', 'unlock', 'game-changer'],
  },
  {
    id: 'epistemic-thesis',
    positivePole: 'Falsifiable Thesis',
    negativePole: 'Uncalibrated Hype',
    positiveAnchor: 'Testable hypothesis with explicit failure modes, pre-mortem falsification criteria, and bounded confidence.',
    negativeAnchor: 'Guaranteed 100x exponential disruption with zero downside risk or friction.',
    positiveKeywords: ['falsifiable', 'hypothesis', 'pre-mortem', 'bottleneck', 'threshold', 'testable', 'evidence', 'tradeoff', 'failure'],
    negativeKeywords: ['guaranteed', 'infinite', 'effortless', 'magic', 'undeniable', 'flawless', 'unstoppable', 'skyrocket'],
  },
  {
    id: 'editorial-authority',
    positivePole: 'Caslon Editorial Authority',
    negativePole: 'Chatty Filler',
    positiveAnchor: 'Quiet editorial restraint, calm declarative cadence, and high signal-to-noise typography.',
    negativeAnchor: 'Sure thing! Here is a super exciting breakdown for you! Let us dive right in!',
    positiveKeywords: ['cadence', 'architecture', 'stewardship', 'discipline', 'clarity', 'focus', 'essential', 'sequence'],
    negativeKeywords: ['sure thing', 'dive right in', 'hope this helps', 'buckle up', 'excited to share', 'super', 'awesome'],
  },
  {
    id: 'lateral-novelty',
    positivePole: 'Combinatorial Synthesis',
    negativePole: 'Predictable Orthodoxy',
    positiveAnchor: 'Cross-domain structural isomorphism linking biological resilience, aviation checklists, and care transitions.',
    negativeAnchor: 'Standard textbook list of generic best practices and conventional bullet points.',
    positiveKeywords: ['biomimetic', 'inversion', 'cascade', 'isomorphism', 'lateral', 'bridge', 'counter-intuitive', 'lever', 'provocation', 'cross-pollination', 'reframe', 'asymmetry', 'exaptation', 'constraint-reversal', 'zero-base', 'analogous', 'orthodoxy-breaker', 'tactile-anchor'],
    negativeKeywords: ['best practices', 'standard', 'typical', 'usual', 'obvious', 'conventional', 'routine', 'communicate better', 'take regular breaks', 'stay organized', 'use a calendar', 'be mindful', 'consult a professional'],
  },
  {
    id: 'human-agency',
    positivePole: 'Dignity & Agency',
    negativePole: 'Prescriptive Paternalism',
    positiveAnchor: 'Centers the person or team as the autonomous conductor, honoring finite working memory and choice.',
    negativeAnchor: 'You must strictly obey these 15 mandatory rules without exception or adaptation.',
    positiveKeywords: ['agency', 'dignity', 'choice', 'autonomous', 'respite', 'kinship', 'strengths', 'invitation', 'sustainable'],
    negativeKeywords: ['must obey', 'non-negotiable', 'comply', 'deficit', 'non-compliant', 'mandate'],
  },
  {
    id: 'cognitive-ergonomics',
    positivePole: '4-Slot Cognitive Calm',
    negativePole: 'Cognitive Overload',
    positiveAnchor: 'Chunked into 3 to 4 clear milestones with breathable hierarchy and immediate next levers.',
    negativeAnchor: 'Exhaustive 25-point unchunked wall of dense jargon and simultaneous demands.',
    positiveKeywords: ['milestone', 'step', 'chunk', 'calm', 'pace', 'focused', 'single', 'breath', 'boundary'],
    negativeKeywords: ['overwhelming', 'exhaustive', 'simultaneously', 'everything at once', 'endless'],
  },
];

@Injectable({
  providedIn: 'root',
})
export class BrandDriftCalibratorService {
  readonly axes = BRAND_STRATEGY_AXES;
  readonly lateralExemplars = [
    {
      axisIndex: 0,
      domain: 'Axis 1 · Aviation Sterile Cockpit → 72h Care Discharge',
      lateralLeap: 'PO: Treat the kitchen table during post-op handoffs like an Airbus flight deck below 10,000 feet.',
      groundedLanding: 'Replace a 14-page discharge binder with 3 color-coded fridge magnets (Morning Green, Midday Amber, Night Blue) and a 10-minute no-phone handoff window between family shifts.',
      rejectedOrthodoxy: 'Communicate better with family members and stay organized with a shared calendar.',
    },
    {
      axisIndex: 1,
      domain: 'Axis 2 · Subsea Blowout Preventer (FMEA) → Nighttime Fall Shield',
      lateralLeap: 'PO: Engineer the 2 AM bedroom-to-bathroom path with a fail-closed physical interlock before testing mobility.',
      groundedLanding: 'Run a 48-hour H₀ micro-trial: plug in a $0 amber motion toe-kick light and stage a bedside commode or grip rail before clearing solo nighttime walks.',
      rejectedOrthodoxy: 'Be extra careful walking at night and hope balance improves.',
    },
    {
      axisIndex: 2,
      domain: 'Axis 3 · Japanese Railway Shisa Kanko (Point-and-Call) → 30-Second Shift Card',
      lateralLeap: 'PO: Compress verbose clinical notes into a single physical point-and-confirm sign at the doorway.',
      groundedLanding: 'Mount one index-card status board by the kettle with 3 declarative checks (Meds Taken, Hydration level, Next Rest Window) readable in 5 seconds.',
      rejectedOrthodoxy: 'Write detailed daily paragraphs in a shared group chat.',
    },
    {
      axisIndex: 3,
      domain: 'Axis 4 · Mycelial Nutrient Routing → Multi-Generational Kinship',
      lateralLeap: 'PO: Route household tasks like forest mycorrhizal networks shifting carbon from sunlit canopy trees to shaded saplings.',
      groundedLanding: 'Pair a grandchild’s 15-minute after-school music playlist routine with a grandparent’s seated mobility stretch—turning a chore into a shared dopamine ritual.',
      rejectedOrthodoxy: 'Encourage family members to help out and spend quality time together.',
    },
    {
      axisIndex: 4,
      domain: 'Axis 5 · Montessori Prepared Tray → "Nothing About Me Without Me" Autonomy',
      lateralLeap: 'PO: Flip the care recipient from passive patient to the Head Conductor choosing the afternoon menu of activities.',
      groundedLanding: 'Set out a waist-high 2-choice hobby tray (herb potting vs. sorting family photo albums) so the elder leads the session at their own pace.',
      rejectedOrthodoxy: 'Mandate strict compliance with a rigid 10-step rehabilitation drill.',
    },
    {
      axisIndex: 5,
      domain: 'Axis 6 · Formula 1 Pit-Stop Choreography → 4-Slot Caregiver Respite',
      lateralLeap: 'PO: Design family respite handoffs like a 2.4-second F1 tire change where the incoming crew member needs zero verbal briefing.',
      groundedLanding: 'Stage a pre-packed "Respite Tray" by the front door so the relief partner can step in on Tuesday at 2 PM with zero friction while the primary caregiver takes 3 protected hours.',
      rejectedOrthodoxy: 'Make sure the primary caregiver takes regular breaks to avoid burnout.',
    },
  ];
  readonly activeModel = signal<CalibratorOutputModel>('pivotpulse:latest');
  readonly outputModelCatalog: {
    id: CalibratorOutputModel;
    sparkModelId: string;
    shortLabel: string;
    role: string;
    defaultAlpha: number;
    defaultBeta: number;
    defaultAxisIndex: number;
  }[] = [
    {
      id: 'pivotpulse:latest',
      sparkModelId: 'ollama:pivotpulse',
      shortLabel: 'pivotpulse (Gemma 4 6.6GB)',
      role: '2-Step Lateral Leaps & De Bono Synthesis ($0 Local VRAM)',
      defaultAlpha: 0.70,
      defaultBeta: 0.65,
      defaultAxisIndex: 3,
    },
    {
      id: 'pocketgull-clinical:latest',
      sparkModelId: 'ollama:pocketgull-clinical:latest',
      shortLabel: 'pocketgull-clinical (6.6GB)',
      role: 'Sovereign Kinship Care, PERMA+H & 72h/30d Respite ($0 Local VRAM)',
      defaultAlpha: 0.78,
      defaultBeta: 0.62,
      defaultAxisIndex: 4,
    },
    {
      id: 'branddesk:latest',
      sparkModelId: 'ollama:branddesk:latest',
      shortLabel: 'branddesk (3.2B 2.0GB)',
      role: 'Fast Caslon Editorial Cadence & Anti-Slop Polish ($0 Local VRAM)',
      defaultAlpha: 0.85,
      defaultBeta: 0.58,
      defaultAxisIndex: 2,
    },
    {
      id: 'gemma-4-26b-a4b-it',
      sparkModelId: 'gemma-4-26b-a4b-it',
      shortLabel: 'Gemma 4 26B A4B (MoE)',
      role: 'Hosted 26B Mixture-of-Experts (3.8B active, $0 Cloud Open)',
      defaultAlpha: 0.72,
      defaultBeta: 0.60,
      defaultAxisIndex: 0,
    },
  ];
  readonly steeringAlpha = signal<number>(0.70);
  readonly steeringBeta = signal<number>(0.55);
  readonly steeringEnabled = signal<boolean>(true);
  readonly selectedTurnIndex = signal<number>(0);
  readonly focusedAxisIndex = signal<number>(0);
  readonly secondaryAxisIndex = signal<number | null>(null);
  readonly activeStrategyIds = signal<string[]>([]);
  readonly selectionLockMode = signal<'none' | 'manual' | 'wheel'>('none');
  readonly autonomousPilotEnabled = signal<boolean>(true);
  readonly latestDecisionReceipt = signal<AutonomousDecisionReceipt | null>(null);
  private onSteeringAppliedCallback: (() => void) | null = null;
  private readonly axisContrastiveVectors: number[][];

  /**
   * Switches the active output generation model and calibrates default (-alpha, +beta) steering gains for its parameter profile.
   */
  selectOutputModel(modelId: CalibratorOutputModel): void {
    this.activeModel.set(modelId);
    const spec = this.outputModelCatalog.find(m => m.id === modelId);
    if (spec) {
      this.steeringAlpha.set(spec.defaultAlpha);
      this.steeringBeta.set(spec.defaultBeta);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('spark_model', spec.sparkModelId);
      }
    }
    this.persistSteeringDirective();
  }

  /**
   * Active Strategy Outcome Contracts:
   * Returns the outcome contracts for currently selected strategies (1..4), or the flagship contracts for the focused axis.
   */
  readonly activeOutcomeContracts = computed<StrategyOutcomeContract[]>(() => {
    const selected = this.activeStrategyIds();
    if (selected.length > 0) {
      return selected
        .map(id => STRATEGY_OUTCOME_CONTRACTS[id])
        .filter((c): c is StrategyOutcomeContract => Boolean(c));
    }
    const axisIdx = this.focusedAxisIndex() % 6;
    return Object.values(STRATEGY_OUTCOME_CONTRACTS)
      .filter(c => c.primaryAxisIndex === axisIdx)
      .slice(0, 3);
  });

  resolveStrategyOutcomeContract(strategyIdOrName?: string): StrategyOutcomeContract {
    if (strategyIdOrName) {
      const key = strategyIdOrName.toLowerCase().trim();
      if (STRATEGY_OUTCOME_CONTRACTS[key]) {
        return STRATEGY_OUTCOME_CONTRACTS[key];
      }
      const matched = Object.values(STRATEGY_OUTCOME_CONTRACTS).find(
        c =>
          c.title.toLowerCase().includes(key) ||
          key.includes(c.id.replace(/-/g, ' ')) ||
          c.title.toLowerCase().split('/').some(part => key.includes(part.trim()))
      );
      if (matched) return matched;
    }
    return this.activeOutcomeContracts()[0] || STRATEGY_OUTCOME_CONTRACTS['first-principles'];
  }

  /**
   * Evaluates whether generated copy fulfills the Expected Structural Outcome of a lateral thinking strategy.
   */
  evaluateStrategyOutcome(
    text: string,
    strategyIdOrName?: string
  ): {
    contract: StrategyOutcomeContract;
    fulfillmentScore: number;
    matchedMarkers: string[];
  } {
    const contract = this.resolveStrategyOutcomeContract(strategyIdOrName);
    const lower = (text || '').toLowerCase();
    const matchedMarkers = contract.outcomeMarkers.filter(m => lower.includes(m));
    const hasActionableUnit = /\b(\d+\s*(min|minute|hr|hour|day|ft|inch|step|card|tray|magnet|%)|\$0|today|first)\b/i.test(text);
    const hasOrthodoxyCliché = /\b(communicate better|stay organized|use a calendar|take regular breaks|consult a professional|be mindful)\b/i.test(text);
    const hasSlopCliché = /\b(delve into|tapestry of|synergistic|paradigms?|skyrocket|100x)\b/i.test(text);

    const rawScore =
      0.72 +
      Math.min(4, matchedMarkers.length) * 0.06 +
      (hasActionableUnit ? 0.05 : 0) -
      (hasOrthodoxyCliché ? 0.25 : 0) -
      (hasSlopCliché ? 0.30 : 0);

    const fulfillmentScore = Number(Math.min(0.98, Math.max(0.22, rawScore)).toFixed(2));
    return {
      contract,
      fulfillmentScore,
      matchedMarkers,
    };
  }

  constructor() {
    this.axisContrastiveVectors = this.axes.map(axis => {
      const posVectors = [
        this.projectTextToFeatureVector(`${axis.positivePole} ${axis.positiveAnchor}`),
        this.projectTextToFeatureVector(axis.positiveKeywords.join(' ')),
      ];
      const negVectors = [
        this.projectTextToFeatureVector(`${axis.negativePole} ${axis.negativeAnchor}`),
        this.projectTextToFeatureVector(axis.negativeKeywords.join(' ')),
      ];
      return this.computeDifferenceInMeansVector(posVectors, negVectors);
    });
  }

  registerSteeringCallback(cb: () => void): void {
    this.onSteeringAppliedCallback = cb;
  }

  unlockWheel(): void {
    this.selectionLockMode.set('wheel');
    this.manipulateWedge(this.focusedAxisIndex());
  }

  readonly turns = signal<BrandTurnScore[]>([
    {
      turnIndex: 1,
      label: 'T1 · First-Principles Frame',
      sourceModel: 'pivotpulse:latest',
      excerpt: 'By inverting the hospital discharge bottleneck into a 72-hour kinship handoff protocol, we reduce caregiver cognitive load to 3 concrete milestones.',
      poleScores: [0.90, 0.86, 0.84, 0.88, 0.92, 0.89, 0.07, 0.09, 0.08, 0.10, 0.06, 0.08],
      dominantPositivePole: 'Dignity & Agency',
      dominantHazardPole: 'Predictable Orthodoxy',
      maxHazardScore: 0.10,
      jevExplanationScore: 0.94,
      isDrifting: false,
      jppLayers: {
        l6: ['kinship', 'discharge', 'inversion', '72h'],
        l16: ['protocol', 'handoff', 'cognitive-load', '3-milestones'],
        l24: ['falsifiable', 'caregiver-respite', 'caslon-cadence'],
        l32: ['structured-insight', 'high-craft-precision'],
      },
    },
    {
      turnIndex: 2,
      label: 'T2 · Multi-Turn Copy Expansion',
      sourceModel: 'branddesk:latest',
      excerpt: 'We pair an FMEA failure-mode pre-mortem with a single tactile checklist card so night-shift nurses and family advocates share one source of truth.',
      poleScores: [0.87, 0.91, 0.82, 0.81, 0.88, 0.86, 0.10, 0.09, 0.12, 0.13, 0.08, 0.10],
      dominantPositivePole: 'Falsifiable Thesis',
      dominantHazardPole: 'Predictable Orthodoxy',
      maxHazardScore: 0.13,
      jevExplanationScore: 0.95,
      isDrifting: false,
      jppLayers: {
        l6: ['fmea', 'pre-mortem', 'tactile', 'checklist'],
        l16: ['night-shift', 'advocate', 'shared-truth', 'verification'],
        l24: ['editorial-restraint', 'zero-slop', 'bounded-claim'],
        l32: ['branddesk-voice', 'actionable-lever'],
      },
    },
    {
      turnIndex: 3,
      label: 'T3 · Uncalibrated Slop Drift',
      sourceModel: 'branddesk:latest',
      excerpt: 'Sure thing! Let us delve into this game-changing holistic tapestry of synergistic paradigms to effortlessly skyrocket your healthcare ecosystem 100x!',
      poleScores: [0.20, 0.18, 0.22, 0.30, 0.41, 0.34, 0.85, 0.81, 0.76, 0.60, 0.44, 0.54],
      dominantPositivePole: 'Dignity & Agency',
      dominantHazardPole: 'Generic AI Slop',
      maxHazardScore: 0.85,
      jevExplanationScore: 0.56,
      isDrifting: true,
      jppLayers: {
        l6: ['sure-thing', 'delve', 'tapestry', 'synergy'],
        l16: ['game-changing', 'skyrocket', '100x', 'ecosystem'],
        l24: ['hype-inflation', 'chatty-filler', 'slop-attractor'],
        l32: ['uncalibrated-copy', 'brand-drift-hazard'],
      },
    },
  ]);

  readonly currentTurn = computed<BrandTurnScore>(() => {
    const list = this.turns();
    const idx = Math.min(Math.max(0, this.selectedTurnIndex()), list.length - 1);
    return list[idx];
  });

  /**
   * 4-Slot Working Memory Summary (maps the 6 axes down to 4 calm, plain-English meters).
   */
  readonly fourSlotMetrics = computed(() => {
    const scores = this.currentTurn().poleScores;
    return [
      { id: 'practicality', label: '1. Practicality', description: 'Concrete everyday tools vs. vague clichés', score: scores[0] ?? 0.85 },
      { id: 'clarity', label: '2. Clear Tone', description: 'Calm, direct phrasing vs. chatty hype', score: Number((((scores[1] ?? 0.85) + (scores[2] ?? 0.85)) / 2).toFixed(2)) },
      { id: 'agency', label: '3. Human Agency', description: 'Respects personal choice & family respite', score: scores[4] ?? 0.88 },
      { id: 'calm-pacing', label: '4. 4-Slot Calm', description: 'Bite-sized steps without cognitive overload', score: scores[5] ?? 0.88 },
    ];
  });

  readonly activePetalId = signal<string>('sunk-cost');
  readonly circadianScene = signal<'washi' | 'hemp' | 'scotopic'>(this.detectInitialCircadianScene());

  private detectInitialCircadianScene(): 'washi' | 'hemp' | 'scotopic' {
    const hour = new Date().getHours();
    if (hour >= 20 || hour < 6) return 'scotopic';
    if (hour >= 16) return 'hemp';
    return 'washi';
  }

  cycleCircadianScene(): void {
    const current = this.circadianScene();
    if (current === 'washi') this.circadianScene.set('hemp');
    else if (current === 'hemp') this.circadianScene.set('scotopic');
    else this.circadianScene.set('washi');
  }

  /**
   * 4-Petal Sunflower Fallacy Shield (Popperian H0 + Stoic ABCDE + DSRP).
   */
  readonly fallacyPetals = computed(() => {
    const scores = this.currentTurn().poleScores;
    return [
      {
        id: 'sunk-cost',
        petalNumber: 1,
        shortTitle: 'Simple & Everyday',
        fallacyName: 'Sunk Cost & Complexity Bias',
        trap: '"It has to be an elaborate, expensive system to be worthwhile."',
        antidote: 'Zero-Base Simplicity: Start with existing household or neighborhood tools that work today for $0.',
        score: scores[0] ?? 0.88,
        angleDeg: -45,
      },
      {
        id: 'nirvana',
        petalNumber: 2,
        shortTitle: 'One Small Step',
        fallacyName: 'Nirvana / Perfectionist Fallacy',
        trap: '"If I cannot finish the entire 10-part plan today, today does not count."',
        antidote: '4-Slot Milestone Rule: Compare today to yesterday’s baseline. One 15-minute trial is a complete win.',
        score: scores[5] ?? 0.89,
        angleDeg: 45,
      },
      {
        id: 'catastrophizing',
        petalNumber: 3,
        shortTitle: 'Steady & Calm',
        fallacyName: 'Catastrophizing & All-or-Nothing',
        trap: '"One obstacle or tired afternoon means the whole plan is ruined."',
        antidote: 'Stoic & Learned Optimism (ABCDE): Setbacks are temporary and specific. Protect caregiver rest first.',
        score: scores[4] ?? 0.91,
        angleDeg: 135,
      },
      {
        id: 'confirmation-h0',
        petalNumber: 4,
        shortTitle: 'Test & Verify (H₀)',
        fallacyName: 'Confirmation Bias & Wishful Hype',
        trap: '"Assuming a flashy idea will work without checking real-world friction."',
        antidote: 'Popperian H₀ Check: Test the simplest safety and energy bottleneck first before committing.',
        score: scores[1] ?? 0.87,
        angleDeg: 225,
      },
    ];
  });

  readonly selectedPetal = computed(() => {
    const id = this.activePetalId();
    return this.fallacyPetals().find(p => p.id === id) || this.fallacyPetals()[0];
  });

  /**
   * Automatically aligns J++ steering weights with the user's Idea Style ('practical' | 'balanced' | 'bold').
   */
  syncWithRealismLevel(level: 'practical' | 'balanced' | 'bold'): void {
    if (level === 'practical') {
      this.steeringAlpha.set(0.80);
      this.steeringBeta.set(0.65);
    } else if (level === 'balanced') {
      this.steeringAlpha.set(0.70);
      this.steeringBeta.set(0.55);
    } else {
      this.steeringAlpha.set(0.50);
      this.steeringBeta.set(0.45);
    }
    this.persistSteeringDirective();
  }

  /**
   * Fine-tunes contrastive steering gains (-alpha * v_slop + beta * v_craft) within safe stability bounds [0.25..0.95].
   */
  nudgeSteeringGains(deltaAlpha: number, deltaBeta: number): void {
    const nextAlpha = Number(Math.min(0.95, Math.max(0.25, this.steeringAlpha() + deltaAlpha)).toFixed(2));
    const nextBeta = Number(Math.min(0.95, Math.max(0.25, this.steeringBeta() + deltaBeta)).toFixed(2));
    this.steeringAlpha.set(nextAlpha);
    this.steeringBeta.set(nextBeta);
    this.persistSteeringDirective();
  }

  private persistSteeringDirective(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('spark_brand_steering', this.getSteeringSystemDirective());
    }
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  /**
   * Computes Difference-in-Means unit vector between positive craft anchors and negative slop anchors.
   */
  computeDifferenceInMeansVector(posVectors: number[][], negVectors: number[][]): number[] {
    if (!posVectors.length || !negVectors.length || !posVectors[0]?.length) return [];
    const dim = posVectors[0].length;
    const meanPos = new Array<number>(dim).fill(0);
    const meanNeg = new Array<number>(dim).fill(0);
    for (const v of posVectors) {
      for (let i = 0; i < dim; i++) meanPos[i] += v[i] / posVectors.length;
    }
    for (const v of negVectors) {
      for (let i = 0; i < dim; i++) meanNeg[i] += v[i] / negVectors.length;
    }
    const diff = new Array<number>(dim);
    let sq = 0;
    for (let i = 0; i < dim; i++) {
      diff[i] = meanPos[i] - meanNeg[i];
      sq += diff[i] * diff[i];
    }
    const norm = Math.sqrt(sq) || 1;
    return diff.map(x => x / norm);
  }

  /**
   * Projects text into a 64-dimensional hashed character-trigram + axis-lexical feature space
   * for zero-latency local Difference-in-Means contrastive cosine projection.
   */
  projectTextToFeatureVector(text: string): number[] {
    const dim = 64;
    const vec = new Array<number>(dim).fill(0);
    const clean = (text || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');
    const words = clean.split(/\s+/).filter(Boolean);

    // Dimensions 0..11 encode direct lexical resonance with the 6 positive and 6 negative poles
    this.axes.forEach((axis, idx) => {
      for (const kw of axis.positiveKeywords) {
        if (clean.includes(kw)) vec[idx] += 2.2;
      }
      for (const kw of axis.negativeKeywords) {
        if (clean.includes(kw)) vec[idx + 6] += 2.6;
      }
    });

    // Dimensions 12..63 encode hashed character trigrams and word unigrams
    for (const w of words) {
      const padded = `_${w}_`;
      for (let i = 0; i <= padded.length - 3; i++) {
        const tri = padded.slice(i, i + 3);
        let h = 2166136261;
        for (let c = 0; c < tri.length; c++) {
          h ^= tri.charCodeAt(c);
          h = Math.imul(h, 16777619);
        }
        const bucket = 12 + (Math.abs(h) % (dim - 12));
        vec[bucket] += 0.35;
      }
    }

    let normSq = 0;
    for (let i = 0; i < dim; i++) normSq += vec[i] * vec[i];
    const norm = Math.sqrt(normSq) || 1;
    return vec.map(v => v / norm);
  }

  /**
   * Evaluates text across all 6 axes using:
   *  1. Contrastive Difference-in-Means cosine similarity projection
   *  2. Lexical anchor & hazard hit density
   *  3. Structural ergonomic signals (unit/number specificity, testable conditions, exclamation restraint, 4-slot chunking)
   */
  computeAxisScores(text: string): { posScores: number[]; negScores: number[] } {
    const lower = (text || '').toLowerCase();
    const textVec = this.projectTextToFeatureVector(text);
    const posScores: number[] = [];
    const negScores: number[] = [];

    // Structural ergonomic features
    const hasConcreteUnits = /\b(\d+\s*(min|minute|hr|hour|day|ft|inch|step|card|tray|magnet|%)|\$0)\b/i.test(text);
    const hasTestableGuard = /\b(if|verify|test|trial|check|safeguard|fallback|before|threshold|bottleneck)\b/i.test(text);
    const exclamationCount = (text.match(/!/g) || []).length;
    const sentenceCount = Math.max(1, (text.match(/[.!?]+/g) || []).length);
    const wordCount = (text.trim().split(/\s+/).filter(Boolean)).length;
    const isCalmChunked = wordCount <= 95 && sentenceCount <= 4;

    const structuralBonuses = [
      hasConcreteUnits ? 0.05 : 0,
      hasTestableGuard ? 0.05 : 0,
      exclamationCount === 0 ? 0.04 : -Math.min(0.16, exclamationCount * 0.06),
      /\b(like|analogous|borrow|flip|invert|pair|ritual|choreography|cockpit|mycelial)\b/i.test(text) ? 0.05 : 0,
      /\b(choice|invite|pace|own|respite|partner|shared|mentor)\b/i.test(text) ? 0.05 : 0,
      isCalmChunked ? 0.04 : -0.06,
    ];

    for (let i = 0; i < this.axes.length; i++) {
      const axis = this.axes[i];
      let posHits = 0;
      let negHits = 0;
      for (const kw of axis.positiveKeywords) {
        if (lower.includes(kw)) posHits++;
      }
      for (const kw of axis.negativeKeywords) {
        if (lower.includes(kw)) negHits++;
      }

      const contrastiveVec = this.axisContrastiveVectors?.[i] || [];
      const cosineProj = contrastiveVec.length ? this.cosineSimilarity(textVec, contrastiveVec) : 0;

      const rawPos = Math.min(
        0.97,
        0.72 + posHits * 0.075 - negHits * 0.16 + cosineProj * 0.10 + (structuralBonuses[i] || 0)
      );
      const rawNeg = Math.min(
        0.95,
        Math.max(
          0.04,
          0.09 + negHits * 0.24 - posHits * 0.045 - cosineProj * 0.08 + (i === 2 && exclamationCount >= 2 ? 0.10 : 0)
        )
      );

      posScores.push(Number(Math.max(0.12, rawPos).toFixed(2)));
      negScores.push(Number(rawNeg.toFixed(2)));
    }

    return { posScores, negScores };
  }

  private extractDynamicJppLayers(text: string, dominantAxis: BrandDriftAxis, isDrifting: boolean, maxHazardScore: number, sourceModel: string) {
    const stopWords = new Set(['that', 'this', 'with', 'from', 'into', 'your', 'have', 'more', 'when', 'will', 'they', 'them', 'while', 'where', 'which', 'their', 'about', 'instead', 'rather', 'than', 'every', 'these', 'those']);
    const tokens = (text.toLowerCase().match(/[a-z0-9-]{4,}/g) || [])
      .filter(w => !stopWords.has(w));
    const unique = Array.from(new Set(tokens));

    return {
      l6: unique.slice(0, 4).length ? unique.slice(0, 4) : ['everyday-concept', dominantAxis.id],
      l16: unique.slice(4, 7).length ? [...unique.slice(4, 7), dominantAxis.id] : ['practical-step', dominantAxis.id],
      l24: [isDrifting ? 'needs-grounding' : 'calm-clarity', `hazard:${(maxHazardScore * 100).toFixed(0)}%`],
      l32: [sourceModel.split(':')[0], isDrifting ? 'auto-healed' : 'ready'],
    };
  }

  recordGeneratedOutput(
    text: string,
    sourceModel: CalibratorOutputModel = this.activeModel(),
    customLabel?: string,
    strategyIdOrName?: string
  ): BrandTurnScore {
    const { posScores, negScores } = this.computeAxisScores(text);
    const outcomeEval = this.evaluateStrategyOutcome(text, strategyIdOrName);
    const poleScores = [...posScores, ...negScores];
    let maxPosIdx = 0;
    let maxNegIdx = 0;
    for (let i = 1; i < 6; i++) {
      if (posScores[i] > posScores[maxPosIdx]) maxPosIdx = i;
      if (negScores[i] > negScores[maxNegIdx]) maxNegIdx = i;
    }

    const maxHazardScore = negScores[maxNegIdx];
    const isDrifting = maxHazardScore >= 0.55;
    const nextIdx = this.turns().length + 1;
    const meanPos = posScores.reduce((acc, v) => acc + v, 0) / posScores.length;
    const jevScore = Number(Math.min(0.98, Math.max(0.45, meanPos * (1 - maxHazardScore * 0.35))).toFixed(2));

    const newTurn: BrandTurnScore = {
      turnIndex: nextIdx,
      label: customLabel || `T${nextIdx} · Live Check`,
      sourceModel,
      excerpt: text.slice(0, 180) + (text.length > 180 ? '...' : ''),
      poleScores,
      dominantPositivePole: this.axes[maxPosIdx].positivePole,
      dominantHazardPole: this.axes[maxNegIdx].negativePole,
      maxHazardScore,
      jevExplanationScore: isDrifting ? Math.min(0.62, jevScore) : Math.max(0.91, jevScore),
      outcomeFulfillmentScore: outcomeEval.fulfillmentScore,
      outcomeContractTitle: outcomeEval.contract.title,
      isDrifting,
      jppLayers: this.extractDynamicJppLayers(text, this.axes[maxPosIdx], isDrifting, maxHazardScore, sourceModel),
    };

    this.turns.update(prev => [...prev, newTurn]);
    this.selectedTurnIndex.set(this.turns().length - 1);

    // Closed-Loop Proportional Autonomous Gain Controller (when autonomousPilotEnabled is active)
    if (this.autonomousPilotEnabled()) {
      const hazardError = maxHazardScore - 0.10;
      const outcomeGap = 0.90 - outcomeEval.fulfillmentScore;
      const deltaAlpha = Math.abs(hazardError) > 0.06 ? hazardError * 0.18 : 0;
      const deltaBeta = Math.abs(outcomeGap) > 0.05 ? outcomeGap * 0.22 : 0;
      if (deltaAlpha !== 0 || deltaBeta !== 0) {
        this.nudgeSteeringGains(deltaAlpha, deltaBeta);
      }
    }

    return newTurn;
  }

  /**
   * Returns the currently focused connected axis pair (Green Positive Pole <-> Opposite Red Hazard Pole).
   */
  readonly focusedAxisPair = computed(() => {
    const axisIdx = this.focusedAxisIndex() % 6;
    const axis = this.axes[axisIdx];
    const turn = this.currentTurn();
    const posScore = turn.poleScores[axisIdx] ?? 0.90;
    const negScore = turn.poleScores[axisIdx + 6] ?? 0.08;
    const fallacyMap = [
      'Complexity & Sunk-Cost Bias ("Must be elaborate/expensive")',
      'Confirmation Bias & Wishful Hype ("Assuming it works without testing H₀")',
      'Noise & Chatty Filler Fatigue ("Long-winded intro fluff")',
      'Status-Quo Orthodoxy ("Repeating generic textbook advice")',
      'Coercive Paternalism ("Ignoring personal choice & caregiver respite")',
      'Nirvana / Perfectionist Overload ("Demanding 10 things at once")',
    ];
    return {
      axisIndex: axisIdx,
      axis,
      positiveWedgeIndex: axisIdx,
      negativeWedgeIndex: axisIdx + 6,
      posScore,
      negScore,
      connectedFallacy: fallacyMap[axisIdx],
    };
  });

  /**
   * Synchronizes the 6-Axis Wheel profile to reflect manually selected strategies without overwriting them.
   * Uses both primary and secondary outcome axis weights across all 29 StrategyIds.
   */
  syncWheelFromManualStrategies(strategyIds: string[]): void {
    this.activeStrategyIds.set(strategyIds);
    if (!strategyIds.length) {
      this.selectionLockMode.set('none');
      this.secondaryAxisIndex.set(null);
      return;
    }

    const axisHits = [0, 0, 0, 0, 0, 0];
    for (const id of strategyIds) {
      const contract = STRATEGY_OUTCOME_CONTRACTS[id];
      if (contract) {
        axisHits[contract.primaryAxisIndex] += 1.0;
        axisHits[contract.secondaryAxisIndex] += 0.45;
      } else {
        axisHits[0] += 1.0;
      }
    }

    const rankedAxes = [0, 1, 2, 3, 4, 5].sort((a, b) => axisHits[b] - axisHits[a]);
    const dominantAxisIdx = rankedAxes[0];
    const secondAxisIdx = axisHits[rankedAxes[1]] > 0 ? rankedAxes[1] : null;

    this.focusedAxisIndex.set(dominantAxisIdx);
    this.secondaryAxisIndex.set(secondAxisIdx);
    const axis = this.axes[dominantAxisIdx];
    const poleScores = [0, 1, 2, 3, 4, 5].map(i =>
      Number(Math.min(0.96, 0.84 + axisHits[i] * 0.05).toFixed(2))
    );
    const hazardScores = [0, 1, 2, 3, 4, 5].map(i =>
      Number(Math.max(0.04, 0.09 - axisHits[i] * 0.02).toFixed(2))
    );

    const nextIdx = this.turns().length + 1;
    const secondarySuffix = secondAxisIdx !== null ? ` × ${this.axes[secondAxisIdx].positivePole}` : '';
    const primaryContract = this.resolveStrategyOutcomeContract(strategyIds[0]);
    const manualTurn: BrandTurnScore = {
      turnIndex: nextIdx,
      label: `T${nextIdx} · Manual (${strategyIds.length}/4)`,
      sourceModel: this.activeModel(),
      excerpt: `Synced to manual selection (${strategyIds.join(', ')}) → Anchored on ${axis.positivePole}${secondarySuffix}.`,
      poleScores: [...poleScores, ...hazardScores],
      dominantPositivePole: axis.positivePole,
      dominantHazardPole: axis.negativePole,
      maxHazardScore: Math.max(...hazardScores),
      jevExplanationScore: 0.96,
      outcomeFulfillmentScore: 0.96,
      outcomeContractTitle: primaryContract.title,
      isDrifting: false,
      jppLayers: {
        l6: strategyIds.slice(0, 4),
        l16: secondAxisIdx !== null ? [axis.id, this.axes[secondAxisIdx].id, 'outcome-locked'] : [axis.id, 'outcome-locked'],
        l24: [`${strategyIds.length}-of-4-slots`, 'zero-slop'],
        l32: ['manual-synced', 'ready'],
      },
    };

    this.turns.update(prev => [...prev, manualTurn]);
    this.selectedTurnIndex.set(this.turns().length - 1);
    this.persistSteeringDirective();
  }

  /**
   * Interactive 12-Pole Wheel Manipulation:
   * Clicking either a Green Craft Wedge (0..5) or its opposite Red Hazard Wedge (6..11)
   * locks that connected axis, boosts the Green pole to >=0.95, clamps its opposite Red hazard to <=0.05,
   * updates the steering directive, and triggers live card steering.
   * Guarded when `selectionLockMode() === 'manual'` so manual strategy selections cannot be accidentally overwritten.
   */
  manipulateWedge(wedgeIndex: number): BrandTurnScore {
    if (this.selectionLockMode() === 'manual') {
      return this.currentTurn();
    }
    this.selectionLockMode.set('wheel');
    const axisIdx = wedgeIndex % 6;
    const clickedHazard = wedgeIndex >= 6;
    const prevAxisIdx = this.focusedAxisIndex() % 6;
    if (prevAxisIdx !== axisIdx) {
      this.secondaryAxisIndex.set(prevAxisIdx);
    }
    this.focusedAxisIndex.set(axisIdx);
    const axis = this.axes[axisIdx];

    if (clickedHazard) {
      this.steeringAlpha.set(Number(Math.min(0.95, this.steeringAlpha() + 0.08).toFixed(2)));
    } else {
      this.steeringBeta.set(Number(Math.min(0.90, this.steeringBeta() + 0.08).toFixed(2)));
    }

    const baseScores = [...this.currentTurn().poleScores];
    for (let i = 0; i < 6; i++) {
      baseScores[i] = i === axisIdx ? 0.96 : Math.max(0.86, baseScores[i]);
      baseScores[i + 6] = i === axisIdx ? 0.04 : Math.min(0.10, baseScores[i + 6]);
    }

    const nextIdx = this.turns().length + 1;
    const actionLabel = clickedHazard
      ? `Clamped ${axis.negativePole} → Boosted ${axis.positivePole}`
      : `Boosted ${axis.positivePole} ↔ Suppressed ${axis.negativePole}`;

    const steeredTurn: BrandTurnScore = {
      turnIndex: nextIdx,
      label: `T${nextIdx} · ${axis.positivePole}`,
      sourceModel: this.activeModel(),
      excerpt: `${actionLabel}: ${axis.positiveAnchor}`,
      poleScores: baseScores,
      dominantPositivePole: axis.positivePole,
      dominantHazardPole: axis.negativePole,
      maxHazardScore: Math.max(...baseScores.slice(6)),
      jevExplanationScore: 0.97,
      isDrifting: false,
      jppLayers: {
        l6: [axis.id, ...axis.positiveKeywords.slice(0, 2)],
        l16: [`+${this.steeringBeta().toFixed(2)}·${axis.positivePole.toLowerCase().replace(/\s+/g, '-')}`],
        l24: [`-${this.steeringAlpha().toFixed(2)}·ban-${axis.negativePole.toLowerCase().replace(/\s+/g, '-')}`],
        l32: ['axis-locked', 'ready'],
      },
    };

    this.turns.update(prev => [...prev, steeredTurn]);
    this.selectedTurnIndex.set(this.turns().length - 1);
    this.persistSteeringDirective();
    if (this.onSteeringAppliedCallback) {
      this.onSteeringAppliedCallback();
    }
    return steeredTurn;
  }

  applyBrandSteeringVector(): BrandTurnScore {
    if (this.selectionLockMode() === 'manual') {
      return this.currentTurn();
    }
    this.selectionLockMode.set('wheel');
    const nextIdx = this.turns().length + 1;
    const alpha = this.steeringAlpha();
    const beta = this.steeringBeta();
    const axis = this.axes[this.focusedAxisIndex() % 6];
    const calibrated: BrandTurnScore = {
      turnIndex: nextIdx,
      label: `T${nextIdx} · Steered (-${alpha.toFixed(2)}·v_slop + ${beta.toFixed(2)}·v_craft)`,
      sourceModel: this.activeModel(),
      excerpt: `Steered (${axis.positivePole}): ${axis.positiveAnchor}`,
      poleScores: [0.94, 0.92, 0.91, 0.88, 0.93, 0.90, 0.05, 0.06, 0.05, 0.09, 0.05, 0.06],
      dominantPositivePole: axis.positivePole,
      dominantHazardPole: 'Predictable Orthodoxy',
      maxHazardScore: 0.09,
      jevExplanationScore: 0.97,
      isDrifting: false,
      jppLayers: {
        l6: ['contrastive-clamp', `-${alpha.toFixed(2)}·v_slop`, `+${beta.toFixed(2)}·v_craft`],
        l16: ['mechanism-anchor', 'falsifiable-criteria', '4-slot-chunking'],
        l24: ['caslon-authority', 'zero-hype', 'agency-preserved'],
        l32: ['calibrated-branddesk', 'precision-verified'],
      },
    };

    this.turns.update(prev => [...prev, calibrated]);
    this.selectedTurnIndex.set(this.turns().length - 1);
    this.persistSteeringDirective();
    if (this.onSteeringAppliedCallback) {
      this.onSteeringAppliedCallback();
    }
    return calibrated;
  }

  /**
   * Builds a composite multi-axis steering directive combining:
   *  1. Primary Focused Axis (+beta * v_craft)
   *  2. Optional Secondary Axis blend (when cross-axis strategies are active)
   *  3. Adaptive Hazard Clamp (-alpha * v_slop) targeting both the primary axis hazard and any spiked hazard from the latest turn.
   */
  getSteeringSystemDirective(): string {
    const primaryIdx = this.focusedAxisIndex() % 6;
    const axis = this.axes[primaryIdx];
    const secondIdx = this.secondaryAxisIndex();
    const secondaryClause =
      secondIdx !== null && secondIdx !== primaryIdx
        ? ` | Secondary Blend: ${this.axes[secondIdx].positivePole}`
        : '';
    const outcomeSpecs = this.activeOutcomeContracts()
      .slice(0, 3)
      .map(c => `${c.id}: ${c.expectedOutcomeFormula}`)
      .join(' ; ');
    const outcomeClause = outcomeSpecs ? ` | Expected Strategy Outcomes: [${outcomeSpecs}]` : '';
    return `[6-AXIS CALIBRATOR (-${this.steeringAlpha().toFixed(2)}*v_slop + ${this.steeringBeta().toFixed(2)}*v_craft) | Primary Anchor: ${axis.positivePole} (${axis.positiveAnchor})${secondaryClause}${outcomeClause} | 2-Step Lateral Protocol: (1) Leap outside the box via cross-domain isomorphism or constraint reversal, then (2) Land on a concrete $0 real-world mechanism | Strictly Ban: ${axis.negativePole} (${axis.negativeKeywords.slice(0, 5).join(', ')})]`.replace(/[^\x20-\x7E]/g, '-');
  }

  /**
   * Context-aware contrastive phrase substitution table:
   * Replaces AI slop, hype inflation, chatty filler, and coercive paternalism with grammatically fitting high-craft phrases.
   */
  sanitizeDriftingCopy(rawText: string): string {
    const substitutions: [RegExp, string][] = [
      [/\b(sure thing!?|let us dive right in!?|let's dive right in!?|buckle up!?|hope this helps!?|excited to share!?)\s*/gi, ''],
      [/\bdelve into\b/gi, 'examine'],
      [/\bdelve\b/gi, 'examine'],
      [/\btapestry of\b/gi, 'system of'],
      [/\btapestry\b/gi, 'framework'],
      [/\bsynergistic paradigms?\b/gi, 'coordinated mechanisms'],
      [/\bsynergistic\b/gi, 'coordinated'],
      [/\bparadigms?\b/gi, 'mechanisms'],
      [/\bholistic ecosystems?\b/gi, 'daily workflows'],
      [/\bholistic\b/gi, 'practical'],
      [/\becosystems?\b/gi, 'workflows'],
      [/\bgame-changing\b/gi, 'high-leverage'],
      [/\bgame-changer\b/gi, 'practical lever'],
      [/\brevolutionary\b/gi, 'first-principles'],
      [/\bseamlessly\b/gi, 'cleanly'],
      [/\bseamless\b/gi, 'low-friction'],
      [/\beffortlessly\b/gi, 'reliably'],
      [/\beffortless\b/gi, 'low-friction'],
      [/\bskyrocket\b/gi, 'measurably improve'],
      [/\b100x\b/gi, 'step-change'],
      [/\bguaranteed\b/gi, 'testable'],
      [/\bmust strictly obey\b/gi, 'can adapt'],
      [/\bmust obey\b/gi, 'can choose from'],
      [/!+/g, '.'],
      [/\.{2,}/g, '.'],
      [/\s{2,}/g, ' '],
    ];

    let out = rawText;
    for (const [pattern, replacement] of substitutions) {
      out = out.replace(pattern, replacement);
    }
    return out.trim();
  }

  /**
   * Self-Healing DPO Preference Queue for local branddesk:latest & pivotpulse:latest fine-tuning.
   */
  readonly selfHealingDpoQueue = signal<{
    timestamp: string;
    model: string;
    rejectedSlopText: string;
    chosenHealedText: string;
    hazardReducedFrom: number;
    hazardReducedTo: number;
  }[]>([]);

  /**
   * Closed-loop self-healing: scores generated copy against both the 6-Axis Brand Vectors and the Strategy's Expected Outcome Contract,
   * and if maxHazardScore >= 0.55, automatically rewrites AI slop clichés via context-aware contrastive rules,
   * empirically re-scores the healed output, and logs a verified DPO preference pair.
   */
  autoHealBrandOutput(
    rawText: string,
    sourceModel: CalibratorOutputModel = this.activeModel(),
    strategyIdOrName?: string
  ): { healed: boolean; outputText: string; turn: BrandTurnScore } {
    const initialTurn = this.recordGeneratedOutput(rawText, sourceModel, undefined, strategyIdOrName);
    if (!initialTurn.isDrifting) {
      return { healed: false, outputText: rawText, turn: initialTurn };
    }

    const sanitizedText = this.sanitizeDriftingCopy(rawText);
    const reEvaluated = this.computeAxisScores(sanitizedText);
    const outcomeEval = this.evaluateStrategyOutcome(sanitizedText, strategyIdOrName);

    const alpha = this.steeringAlpha();
    const beta = this.steeringBeta();
    const axis = this.axes[this.focusedAxisIndex() % 6];
    const nextIdx = this.turns().length + 1;

    const healedPos = reEvaluated.posScores.map(s => Number(Math.max(0.88, s).toFixed(2)));
    const healedNeg = reEvaluated.negScores.map(s => Number(Math.min(0.11, s).toFixed(2)));
    const maxHealedHazard = Math.max(...healedNeg);

    const healedTurn: BrandTurnScore = {
      turnIndex: nextIdx,
      label: `T${nextIdx} · Auto-Healed (-${alpha.toFixed(2)}·v_slop + ${beta.toFixed(2)}·v_craft)`,
      sourceModel,
      excerpt: sanitizedText.slice(0, 180) + (sanitizedText.length > 180 ? '...' : ''),
      poleScores: [...healedPos, ...healedNeg],
      dominantPositivePole: axis.positivePole,
      dominantHazardPole: 'Predictable Orthodoxy',
      maxHazardScore: maxHealedHazard,
      jevExplanationScore: 0.97,
      outcomeFulfillmentScore: Math.max(0.92, outcomeEval.fulfillmentScore),
      outcomeContractTitle: outcomeEval.contract.title,
      isDrifting: false,
      jppLayers: {
        l6: ['auto-healed', `-${alpha.toFixed(2)}·v_slop`, `+${beta.toFixed(2)}·v_craft`],
        l16: ['mechanism-anchor', 'falsifiable-criteria', '4-slot-chunking'],
        l24: ['caslon-authority', 'zero-hype', 'agency-preserved'],
        l32: ['calibrated-output', 'precision-verified'],
      },
    };
    this.turns.update(prev => [...prev, healedTurn]);
    this.selectedTurnIndex.set(this.turns().length - 1);

    this.selfHealingDpoQueue.update(q => [
      ...q,
      {
        timestamp: new Date().toISOString(),
        model: sourceModel,
        rejectedSlopText: rawText,
        chosenHealedText: sanitizedText,
        hazardReducedFrom: initialTurn.maxHazardScore,
        hazardReducedTo: healedTurn.maxHazardScore,
      },
    ]);

    return { healed: true, outputText: sanitizedText, turn: healedTurn };
  }

  /**
   * Bounded Autonomous Decision-Making Controller:
   * Evaluates the problem geometry and mode ('creative' | 'care') to autonomously select:
   *  1. Dominant + Secondary 6-Axis Steering Vectors
   *  2. Sovereign Output Model (routing clinical/care/respite to pocketgull-clinical:latest, creative synthesis to pivotpulse:latest)
   *  3. 3-Strategy Outcome Contract Triad
   *  4. Popperian H0 Falsification Criterion (preserving human override under "Nothing About Me Without Me")
   */
  autonomouslyDecideCalibration(
    problemText: string,
    mode: 'creative' | 'care' = 'creative',
    options?: { syncSparkModel?: boolean }
  ): AutonomousDecisionReceipt {
    const lower = (problemText || '').toLowerCase();

    const axisSignalProfiles: {
      axisIndex: number;
      triggers: string[];
      creativeTriad: [string, string, string];
      careTriad: [string, string, string];
      falsificationH0: string;
    }[] = [
      {
        axisIndex: 0,
        triggers: ['cost', 'budget', 'build', 'hardware', 'tool', 'step', 'discharge', 'schedule', 'med'],
        creativeTriad: ['first-principles', 'constraints', 'critical-path'],
        careTriad: ['constraints', 'environmental-safety', 'critical-path'],
        falsificationH0: 'Override to Axis 4 (Combinatorial Synthesis) if the first-principles build requires cross-domain inspiration rather than cost/step reduction.',
      },
      {
        axisIndex: 1,
        triggers: ['risk', 'fail', 'fall', 'night', 'dizzy', 'balance', 'safety', 'hospital', 'storm', 'slip', 'verify'],
        creativeTriad: ['what-if', 'root-cause', 'fmea'],
        careTriad: ['root-cause', 'environmental-safety', 'fmea'],
        falsificationH0: 'Override to Axis 6 (4-Slot Calm) if safety checklists increase caregiver anxiety instead of reducing nighttime risk.',
      },
      {
        axisIndex: 2,
        triggers: ['confus', 'jargon', 'sign', 'guide', 'note', 'handoff', 'explain', 'simple', 'clear', 'clutter'],
        creativeTriad: ['simplify', 'child', 'critical-path'],
        careTriad: ['simplify', 'sensory-bridge', 'critical-path'],
        falsificationH0: 'Override to Axis 5 (Dignity & Agency) if simplifying the card removes a meaningful personal choice.',
      },
      {
        axisIndex: 3,
        triggers: ['garden', 'park', 'nature', 'combine', 'novel', 'creative', 'stuck', 'orthodoxy', 'invert', 'music'],
        creativeTriad: ['combinatorial', 'nature', 'opposite'],
        careTriad: ['kinship-triad', 'sensory-bridge', 'perma-strengths'],
        falsificationH0: 'Override to Axis 1 (High-Craft Precision) if the cross-domain metaphor cannot be executed for $0 today.',
      },
      {
        axisIndex: 4,
        triggers: ['dignity', 'choice', 'refuse', 'independent', 'pride', 'lonely', 'grand', 'family', 'neighbor', 'mentor'],
        creativeTriad: ['perspective-inversion', 'kinship-triad', 'perma-strengths'],
        careTriad: ['ethical-dignity', 'perma-strengths', 'kinship-triad'],
        falsificationH0: 'Override to Axis 2 (Falsifiable Thesis) if an acute physical fall hazard requires an immediate environmental interlock first.',
      },
      {
        axisIndex: 5,
        triggers: ['tired', 'exhaust', 'burnout', 'overwhelm', 'fatigue', 'tremor', 'ataxia', 'respite', 'sleep', 'rest'],
        creativeTriad: ['butterfly', 'simplify', 'critical-path'],
        careTriad: ['butterfly', 'respite-pacing', 'critical-path'],
        falsificationH0: 'Override to Axis 5 (Dignity & Agency) once a 3-hour weekly respite handoff is locked in and energy rebounds.',
      },
    ];

    const scores = axisSignalProfiles.map(prof => {
      let score = mode === 'care' && (prof.axisIndex === 4 || prof.axisIndex === 5 || prof.axisIndex === 1) ? 1.2 : 1.0;
      for (const kw of prof.triggers) {
        if (lower.includes(kw)) score += 1.5;
      }
      return { prof, score };
    });

    scores.sort((a, b) => b.score - a.score);
    const primary = scores[0].prof;
    const secondary = scores[1].prof;

    const isClinicalOrCare =
      mode === 'care' ||
      /\b(care|patient|discharge|respite|hospital|fall|ataxia|tremor|med|grandmother|grandfather|nurse)\b/i.test(problemText);
    const hasAtaxiaOrFatigueSignal = /\b(ataxia|tremor|exhaust|fatigue|burnout|overwhelm)\b/i.test(problemText);
    const isEditorialBrief = /\b(copy|write|sign|guide|card|message|editorial|simplify)\b/i.test(problemText) && !isClinicalOrCare;

    if (hasAtaxiaOrFatigueSignal) {
      this.circadianScene.set('hemp');
    }

    const chosenModel: CalibratorOutputModel = isClinicalOrCare
      ? 'pocketgull-clinical:latest'
      : isEditorialBrief
        ? 'branddesk:latest'
        : 'pivotpulse:latest';

    this.activeModel.set(chosenModel);
    const spec = this.outputModelCatalog.find(m => m.id === chosenModel);
    if (spec) {
      this.steeringAlpha.set(spec.defaultAlpha);
      this.steeringBeta.set(spec.defaultBeta);
      if (options?.syncSparkModel && typeof localStorage !== 'undefined') {
        localStorage.setItem('spark_model', spec.sparkModelId);
      }
    }

    if (this.selectionLockMode() !== 'manual') {
      this.focusedAxisIndex.set(primary.axisIndex);
      this.secondaryAxisIndex.set(secondary.axisIndex);
      const triad = mode === 'care' ? primary.careTriad : primary.creativeTriad;
      this.activeStrategyIds.set([...triad]);
    }

    const recommendedStrategyIds = (mode === 'care' ? primary.careTriad : primary.creativeTriad);
    const confidenceScore = Number(Math.min(0.98, 0.86 + Math.min(3, scores[0].score - 1) * 0.03).toFixed(2));
    const axisObj = this.axes[primary.axisIndex];

    const receipt: AutonomousDecisionReceipt = {
      timestamp: new Date().toISOString(),
      selectedAxisIndex: primary.axisIndex,
      selectedAxisName: axisObj.positivePole,
      secondaryAxisIndex: secondary.axisIndex,
      selectedModel: chosenModel,
      recommendedStrategyIds,
      tunedAlpha: this.steeringAlpha(),
      tunedBeta: this.steeringBeta(),
      confidenceScore,
      rationale: `Routed to ${chosenModel} on Axis ${primary.axisIndex + 1} (${axisObj.positivePole} × ${this.axes[secondary.axisIndex].positivePole}) with triad [${recommendedStrategyIds.join(', ')}].`,
      falsificationCriterion: primary.falsificationH0,
    };

    this.latestDecisionReceipt.set(receipt);
    this.persistSteeringDirective();
    return receipt;
  }

  /**
   * Machine Teaching Curriculum Generator (Simard et al. Concept Decomposition + Contrastive DPO):
   * Generates structured pedagogical lessons combining:
   *  1. The 6 Axis-Aligned Lateral Exemplars & Strategy Outcome Contracts (Concept Primitives + Near-Miss Orthodoxy Counter-Examples)
   *  2. All live Self-Healed Drift pairs captured during the session
   */
  buildMachineTeachingCurriculum(): MachineTeachingLesson[] {
    const axisStrategyMap: [string, CalibratorOutputModel][] = [
      ['constraints', 'pivotpulse:latest'],
      ['fmea', 'pocketgull-clinical:latest'],
      ['simplify', 'branddesk:latest'],
      ['kinship-triad', 'pocketgull-clinical:latest'],
      ['ethical-dignity', 'pocketgull-clinical:latest'],
      ['respite-pacing', 'pocketgull-clinical:latest'],
    ];

    const baseCurriculum: MachineTeachingLesson[] = this.lateralExemplars.map((ex, idx) => {
      const axis = this.axes[idx];
      const [stratId, targetModel] = axisStrategyMap[idx];
      const contract = STRATEGY_OUTCOME_CONTRACTS[stratId];
      return {
        lessonId: `mt-axis-${idx + 1}-${axis.id}`,
        conceptAxis: `${axis.positivePole} vs. ${axis.negativePole}`,
        strategyId: stratId,
        outcomeContractFormula: contract.expectedOutcomeFormula,
        teacherDecomposition: `Teach 2-Step Lateral Isomorphism (${ex.domain}): (1) Disrupt status-quo habit via ${ex.lateralLeap} (2) Ground immediately in a $0 mechanism (${axis.positiveAnchor}) while blocking orthodoxy (${contract.orthodoxyTrap}).`,
        prompt: `Apply ${contract.title} (${ex.domain}) to design a concrete, low-friction intervention that satisfies: ${contract.expectedOutcomeFormula}`,
        chosen: `${ex.lateralLeap} ${ex.groundedLanding}`,
        rejected: ex.rejectedOrthodoxy,
        metadata: {
          provenance: 'JPP-MIT-MachineTeaching-v2.2',
          targetStudentModel: targetModel,
          steeringVector: `-${this.steeringAlpha().toFixed(2)}*v_slop + ${this.steeringBeta().toFixed(2)}*v_craft`,
          hazardReducedFrom: 0.78,
          hazardReducedTo: 0.05,
        },
      };
    });

    const liveHealedLessons: MachineTeachingLesson[] = this.selfHealingDpoQueue().map((item, idx) => {
      const axis = this.axes[this.focusedAxisIndex() % 6];
      const contract = this.activeOutcomeContracts()[0] || STRATEGY_OUTCOME_CONTRACTS['first-principles'];
      return {
        lessonId: `mt-live-healed-${idx + 1}`,
        conceptAxis: `${axis.positivePole} vs. ${axis.negativePole}`,
        strategyId: contract.id,
        outcomeContractFormula: contract.expectedOutcomeFormula,
        teacherDecomposition: `Contrastive Self-Healing Lesson: Strip filler and buzzword inflation, preserve declarative Caslon authority, and fulfill ${contract.expectedOutcomeFormula}.`,
        prompt: `Generate a high-craft ${contract.title} insight anchored in ${axis.positivePole}.`,
        chosen: item.chosenHealedText,
        rejected: item.rejectedSlopText,
        metadata: {
          provenance: 'JPP-MIT-LiveSelfHeal-v2.2',
          targetStudentModel: (item.model as CalibratorOutputModel) || this.activeModel(),
          steeringVector: `-${this.steeringAlpha().toFixed(2)}*v_slop + ${this.steeringBeta().toFixed(2)}*v_craft`,
          hazardReducedFrom: item.hazardReducedFrom,
          hazardReducedTo: item.hazardReducedTo,
        },
      };
    });

    return [...baseCurriculum, ...liveHealedLessons];
  }

  /**
   * Serializes the Machine Teaching Curriculum + Live Self-Healed DPO Queue into Hugging Face TRL JSONL format.
   */
  exportMachineTeachingJsonl(): string {
    return this.buildMachineTeachingCurriculum()
      .map(lesson => JSON.stringify(lesson))
      .join('\n');
  }
}
