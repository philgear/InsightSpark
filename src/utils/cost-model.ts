/**
 * Pure Cost & Telemetry Utility for Pivot & Pulse (InsightSpark).
 * Zero Angular DI imports so it can be shared cleanly across browser UI,
 * client services, and Node test runners.
 */

export type BillingTier =
  | 'cloud-default'
  | 'cloud-paid-only'
  | 'cloud-budget'
  | 'cloud-open-free'
  | 'on-device-ram'
  | 'local-vram'
  | 'offline-demo';

export type BillingSource =
  | 'byok'
  | 'hosted'
  | 'local-ollama'
  | 'on-device'
  | 'demo';

export interface ScheduledRateChange {
  effectiveDate: string; // YYYY-MM-DD
  inputPer1M: number;
  outputPer1M: number;
  cachedInputPer1M: number;
}

export interface ModelPricingSpec {
  id: string;
  label: string;
  inputPer1M: number;
  outputPer1M: number;
  cachedInputPer1M: number;
  freeTierAvailable: boolean;
  billingTier: BillingTier;
  scheduledRateChange?: ScheduledRateChange;
  notes?: string;
}

export interface ResolvedModelPricing extends ModelPricingSpec {
  effectiveInputPer1M: number;
  effectiveOutputPer1M: number;
  effectiveCachedInputPer1M: number;
  isScheduledRateActive: boolean;
}

export interface PipelinePhaseUsage {
  phase: string;
  inputTokens: number;
  outputTokens: number;
  thoughtTokens: number;
  cachedTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  estimated: boolean;
}

export interface TokenUsageReceipt {
  endpoint: string;
  model: string;
  billingSource: BillingSource;
  billingTier: BillingTier;
  thinkingLevel?: string;
  inputTokens: number;
  outputTokens: number;
  thoughtTokens: number;
  cachedTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  estimated: boolean;
  callCount: number;
  timestamp: string;
  phases?: PipelinePhaseUsage[];
}

export interface SessionCostSummary {
  callCount: number;
  requestCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalThoughtTokens: number;
  totalCachedTokens: number;
  totalTokens: number;
  totalEstimatedCostUsd: number;
  zeroCostCallCount: number;
  zeroCostPercent: number;
  estimatedCloudSavingsUsd: number;
}

export const THINKING_COST_MULTIPLIERS = {
  minimal: 1.0,
  low: 1.0,
  medium: 1.6,
  high: 2.5,
  xhigh: 4.0,
  none: 1.0,
} as const;

export const MODEL_PRICING_CATALOG: Record<string, ModelPricingSpec> = {
  'gemini-4-hydrogen': {
    id: 'gemini-4-hydrogen',
    label: 'Gemini 4 Hydrogen',
    inputPer1M: 1.50,
    outputPer1M: 7.50,
    cachedInputPer1M: 0.075,
    freeTierAvailable: true,
    billingTier: 'cloud-default',
    notes: 'Default cloud reasoning model via Interactions API; free tier & paid tier.',
  },
  'gemini-4-argon': {
    id: 'gemini-4-argon',
    label: 'Gemini 4 Argon',
    inputPer1M: 2.00,
    outputPer1M: 10.00,
    cachedInputPer1M: 0.20,
    freeTierAvailable: false,
    billingTier: 'cloud-paid-only',
    scheduledRateChange: {
      effectiveDate: '2026-12-01',
      inputPer1M: 4.00,
      outputPer1M: 20.00,
      cachedInputPer1M: 0.40,
    },
    notes: 'Paid tier only; scheduled 2x rate increase on 2026-12-01 ($4/$20 per 1M).',
  },
  'gemini-3.5-flash-lite': {
    id: 'gemini-3.5-flash-lite',
    label: 'Gemini 3.5 Flash-Lite',
    inputPer1M: 0.30,
    outputPer1M: 2.50,
    cachedInputPer1M: 0.03,
    freeTierAvailable: true,
    billingTier: 'cloud-budget',
    notes: 'Budget high-throughput cloud model for rapid structured synthesis.',
  },
  'gemma-4-31b-it': {
    id: 'gemma-4-31b-it',
    label: 'Gemma 4 31B',
    inputPer1M: 0.00,
    outputPer1M: 0.00,
    cachedInputPer1M: 0.00,
    freeTierAvailable: true,
    billingTier: 'cloud-open-free',
    notes: 'Hosted open-weight model via Gemini API with $0 token charges.',
  },
  'gemma-4-26b-a4b-it': {
    id: 'gemma-4-26b-a4b-it',
    label: 'Gemma 4 26B A4B (MoE)',
    inputPer1M: 0.00,
    outputPer1M: 0.00,
    cachedInputPer1M: 0.00,
    freeTierAvailable: true,
    billingTier: 'cloud-open-free',
    notes: '26B Mixture-of-Experts (3.8B active params) hosted via Gemini API with $0 token charges.',
  },
  'on-device-nano': {
    id: 'on-device-nano',
    label: 'In-Browser RAM (window.ai)',
    inputPer1M: 0.00,
    outputPer1M: 0.00,
    cachedInputPer1M: 0.00,
    freeTierAvailable: true,
    billingTier: 'on-device-ram',
    notes: 'Runs locally inside browser RAM/NPU via Prompt API or WebGPU; 0 bytes egress.',
  },
  ollama: {
    id: 'ollama',
    label: 'Workstation Ollama (Local VRAM)',
    inputPer1M: 0.00,
    outputPer1M: 0.00,
    cachedInputPer1M: 0.00,
    freeTierAvailable: true,
    billingTier: 'local-vram',
    notes: 'Runs locally via Ollama daemon (e.g. pivotpulse / Gemma 4); $0 cloud cost.',
  },
  demo: {
    id: 'demo',
    label: 'Offline Demo Mode',
    inputPer1M: 0.00,
    outputPer1M: 0.00,
    cachedInputPer1M: 0.00,
    freeTierAvailable: true,
    billingTier: 'offline-demo',
    notes: 'Deterministic local preview with zero network or token charges.',
  },
};

export function resolveModelPricing(
  modelId: string,
  referenceDateIso?: string
): ResolvedModelPricing {
  const raw = String(modelId || '').trim();
  const lower = raw.toLowerCase();

  let spec: ModelPricingSpec | undefined;
  if (
    lower.startsWith('ollama:') ||
    lower.startsWith('local:') ||
    lower === 'ollama' ||
    lower === 'pivotpulse'
  ) {
    spec = MODEL_PRICING_CATALOG['ollama'];
  } else if (
    lower === 'on-device-nano' ||
    lower === 'window.ai' ||
    lower === 'webgpu' ||
    lower === 'chrome-on-device-builtin' ||
    lower === 'webgpu-active' ||
    lower.startsWith('webgpu:') ||
    lower.startsWith('hf:')
  ) {
    spec = MODEL_PRICING_CATALOG['on-device-nano'];
  } else if (lower === 'demo' || lower === 'demo-key-active') {
    spec = MODEL_PRICING_CATALOG['demo'];
  } else if (MODEL_PRICING_CATALOG[raw]) {
    spec = MODEL_PRICING_CATALOG[raw];
  } else if (MODEL_PRICING_CATALOG[lower]) {
    spec = MODEL_PRICING_CATALOG[lower];
  } else {
    spec = MODEL_PRICING_CATALOG['gemini-4-hydrogen'];
  }

  const refDate = (referenceDateIso || new Date().toISOString()).slice(0, 10);
  const scheduled = spec.scheduledRateChange;
  const isScheduledRateActive = Boolean(scheduled && refDate >= scheduled.effectiveDate);

  return {
    ...spec,
    effectiveInputPer1M: isScheduledRateActive && scheduled ? scheduled.inputPer1M : spec.inputPer1M,
    effectiveOutputPer1M: isScheduledRateActive && scheduled ? scheduled.outputPer1M : spec.outputPer1M,
    effectiveCachedInputPer1M:
      isScheduledRateActive && scheduled ? scheduled.cachedInputPer1M : spec.cachedInputPer1M,
    isScheduledRateActive,
  };
}

export function estimateUsageCostUsd(
  modelId: string,
  usage: {
    inputTokens: number;
    outputTokens: number;
    thoughtTokens?: number;
    cachedTokens?: number;
  },
  referenceDateIso?: string
): number {
  const rate = resolveModelPricing(modelId, referenceDateIso);
  const inputTokens = Math.max(0, Number(usage.inputTokens) || 0);
  const outputTokens = Math.max(0, Number(usage.outputTokens) || 0);
  const thoughtTokens = Math.max(0, Number(usage.thoughtTokens) || 0);
  const cachedTokens = Math.max(0, Math.min(inputTokens, Number(usage.cachedTokens) || 0));

  const uncachedInput = Math.max(0, inputTokens - cachedTokens);
  const billableOutput = outputTokens + thoughtTokens;

  const cost =
    (uncachedInput * rate.effectiveInputPer1M +
      cachedTokens * rate.effectiveCachedInputPer1M +
      billableOutput * rate.effectiveOutputPer1M) /
    1_000_000;

  return Math.round(cost * 1e8) / 1e8;
}

export function estimateTokensFromText(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  return Math.max(0, Math.ceil(text.length / 4));
}

export function summarizeSessionUsage(
  entries: TokenUsageReceipt[],
  referenceDateIso?: string
): SessionCostSummary {
  if (!Array.isArray(entries) || entries.length === 0) {
    return {
      callCount: 0,
      requestCount: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalThoughtTokens: 0,
      totalCachedTokens: 0,
      totalTokens: 0,
      totalEstimatedCostUsd: 0,
      zeroCostCallCount: 0,
      zeroCostPercent: 0,
      estimatedCloudSavingsUsd: 0,
    };
  }

  let callCount = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalThoughtTokens = 0;
  let totalCachedTokens = 0;
  let totalTokens = 0;
  let totalEstimatedCostUsd = 0;
  let zeroCostCallCount = 0;
  let estimatedCloudSavingsUsd = 0;

  for (const entry of entries) {
    if (!entry) continue;
    const calls = Math.max(1, Number(entry.callCount) || 1);
    const input = Math.max(0, Number(entry.inputTokens) || 0);
    const output = Math.max(0, Number(entry.outputTokens) || 0);
    const thought = Math.max(0, Number(entry.thoughtTokens) || 0);
    const cached = Math.max(0, Number(entry.cachedTokens) || 0);
    const total = Math.max(0, Number(entry.totalTokens) || input + output + thought);
    const cost = Math.max(0, Number(entry.estimatedCostUsd) || 0);

    callCount += calls;
    totalInputTokens += input;
    totalOutputTokens += output;
    totalThoughtTokens += thought;
    totalCachedTokens += cached;
    totalTokens += total;
    totalEstimatedCostUsd += cost;

    if (cost === 0) {
      zeroCostCallCount += calls;
      const baselineCloudCost = estimateUsageCostUsd(
        'gemini-4-hydrogen',
        {
          inputTokens: input,
          outputTokens: output,
          thoughtTokens: thought,
          cachedTokens: cached,
        },
        referenceDateIso
      );
      estimatedCloudSavingsUsd += baselineCloudCost;
    }
  }

  const zeroCostPercent = callCount > 0 ? Math.round((zeroCostCallCount / callCount) * 100) : 0;

  return {
    callCount,
    requestCount: entries.length,
    totalInputTokens,
    totalOutputTokens,
    totalThoughtTokens,
    totalCachedTokens,
    totalTokens,
    totalEstimatedCostUsd: Math.round(totalEstimatedCostUsd * 1e8) / 1e8,
    zeroCostCallCount,
    zeroCostPercent,
    estimatedCloudSavingsUsd: Math.round(estimatedCloudSavingsUsd * 1e8) / 1e8,
  };
}

export function formatUsd(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '$0.00';
  if (amount < 0.0001) return '< $0.0001';
  if (amount < 0.1) return `$${amount.toFixed(4)}`;
  return `$${amount.toFixed(2)}`;
}
