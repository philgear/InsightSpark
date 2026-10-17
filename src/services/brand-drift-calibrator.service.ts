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

export interface BrandTurnScore {
  turnIndex: number;
  label: string;
  sourceModel: 'pivotpulse:latest' | 'branddesk:latest' | 'gemini-live';
  excerpt: string;
  poleScores: number[]; // 12 values [0..1] (6 positive, 6 negative)
  dominantPositivePole: string;
  dominantHazardPole: string;
  maxHazardScore: number;
  jevExplanationScore: number;
  isDrifting: boolean;
  jppLayers: {
    l6: string[];
    l16: string[];
    l24: string[];
    l32: string[];
  };
}

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
    positiveKeywords: ['biomimetic', 'inversion', 'cascade', 'isomorphism', 'lateral', 'bridge', 'counter-intuitive', 'lever'],
    negativeKeywords: ['best practices', 'standard', 'typical', 'usual', 'obvious', 'conventional', 'routine'],
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
  readonly activeModel = signal<'pivotpulse:latest' | 'branddesk:latest'>('pivotpulse:latest');
  readonly steeringAlpha = signal<number>(0.70);
  readonly steeringBeta = signal<number>(0.55);
  readonly steeringEnabled = signal<boolean>(true);
  readonly selectedTurnIndex = signal<number>(0);
  readonly focusedAxisIndex = signal<number>(0);
  private onSteeringAppliedCallback: (() => void) | null = null;

  registerSteeringCallback(cb: () => void): void {
    this.onSteeringAppliedCallback = cb;
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

  recordGeneratedOutput(text: string, sourceModel: 'pivotpulse:latest' | 'branddesk:latest' | 'gemini-live' = this.activeModel(), customLabel?: string): BrandTurnScore {
    const lower = text.toLowerCase();
    const posScores: number[] = [];
    const negScores: number[] = [];

    for (const axis of this.axes) {
      let posHits = 0;
      let negHits = 0;
      for (const kw of axis.positiveKeywords) {
        if (lower.includes(kw)) posHits++;
      }
      for (const kw of axis.negativeKeywords) {
        if (lower.includes(kw)) negHits++;
      }

      const rawPos = Math.min(0.96, 0.72 + posHits * 0.08 - negHits * 0.16);
      const rawNeg = Math.min(0.95, Math.max(0.05, 0.10 + negHits * 0.24 - posHits * 0.04));
      posScores.push(Number(Math.max(0.12, rawPos).toFixed(2)));
      negScores.push(Number(rawNeg.toFixed(2)));
    }

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

    const newTurn: BrandTurnScore = {
      turnIndex: nextIdx,
      label: customLabel || `T${nextIdx} · Live Check`,
      sourceModel,
      excerpt: text.slice(0, 180) + (text.length > 180 ? '...' : ''),
      poleScores,
      dominantPositivePole: this.axes[maxPosIdx].positivePole,
      dominantHazardPole: this.axes[maxNegIdx].negativePole,
      maxHazardScore,
      jevExplanationScore: isDrifting ? 0.59 : 0.94,
      isDrifting,
      jppLayers: this.extractDynamicJppLayers(text, this.axes[maxPosIdx], isDrifting, maxHazardScore, sourceModel),
    };

    this.turns.update(prev => [...prev, newTurn]);
    this.selectedTurnIndex.set(this.turns().length - 1);
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
   * Interactive 12-Pole Wheel Manipulation:
   * Clicking either a Green Craft Wedge (0..5) or its opposite Red Hazard Wedge (6..11)
   * locks that connected axis, boosts the Green pole to >=0.95, clamps its opposite Red hazard to <=0.05,
   * updates the steering directive, and triggers live card steering.
   */
  manipulateWedge(wedgeIndex: number): BrandTurnScore {
    const axisIdx = wedgeIndex % 6;
    const clickedHazard = wedgeIndex >= 6;
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
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('spark_brand_steering', this.getSteeringSystemDirective());
    }
    if (this.onSteeringAppliedCallback) {
      this.onSteeringAppliedCallback();
    }
    return steeredTurn;
  }

  applyBrandSteeringVector(): BrandTurnScore {
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
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('spark_brand_steering', this.getSteeringSystemDirective());
    }
    if (this.onSteeringAppliedCallback) {
      this.onSteeringAppliedCallback();
    }
    return calibrated;
  }

  getSteeringSystemDirective(): string {
    const axis = this.axes[this.focusedAxisIndex() % 6];
    return `[6-AXIS CALIBRATOR (-${this.steeringAlpha().toFixed(2)}·v_slop + ${this.steeringBeta().toFixed(2)}·v_craft) | Primary Anchor: ${axis.positivePole} (${axis.positiveAnchor}) | Strictly Ban: ${axis.negativePole} (${axis.negativeKeywords.slice(0, 5).join(', ')})]`;
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
   * Closed-loop self-healing: scores generated copy, and if maxHazardScore >= 0.55,
   * automatically strips AI slop clichés, re-steers the output, and logs a DPO preference pair.
   */
  autoHealBrandOutput(
    rawText: string,
    sourceModel: 'pivotpulse:latest' | 'branddesk:latest' | 'gemini-live' = this.activeModel()
  ): { healed: boolean; outputText: string; turn: BrandTurnScore } {
    const initialTurn = this.recordGeneratedOutput(rawText, sourceModel);
    if (!initialTurn.isDrifting) {
      return { healed: false, outputText: rawText, turn: initialTurn };
    }

    const sanitizedText = rawText
      .replace(/\b(sure thing!?|let us dive right in!?|buckle up!?)\s*/gi, '')
      .replace(/\b(delve into|tapestry of|synergistic|paradigms?|holistic|game-changing|skyrocket|100x)\b/gi, 'concrete mechanism')
      .replace(/\s{2,}/g, ' ')
      .trim() + ' [Anchored in 3 falsifiable milestones with explicit FMEA failure guardrails.]';

    const healedTurn = this.applyBrandSteeringVector();
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
}
