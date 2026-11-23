import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import compression from 'compression';
import { body, validationResult } from 'express-validator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local programmatically if it exists
try {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split(/\r?\n/).forEach(line => {
      const parts = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (parts) {
        const key = parts[1];
        let val = parts[2] || '';
        // Remove surrounding quotes if any
        if (val.length > 0 && val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') {
          val = val.substring(1, val.length - 1);
        } else if (val.length > 0 && val.charAt(0) === "'" && val.charAt(val.length - 1) === "'") {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val.trim();
      }
    });
  }
} catch (e) {
  console.warn('Failed to parse .env.local file:', e.message);
}

const app = express();
app.use(compression({
  filter: (req, res) => {
    if (
      req.path === '/api/insights' ||
      req.path === '/api/agent/pipeline' ||
      res.getHeader('Content-Type') === 'text/event-stream'
    ) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
app.set('trust proxy', 1);
const port = process.env.PORT || 8080;

app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
      workerSrc: ["'self'", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://fonts.googleapis.com",
        "https://huggingface.co",
        "https://*.huggingface.co",
        "https://*.hf.co",
        "https://*.xethub.hf.co"
      ],
      frameSrc: ["'self'"],
      frameAncestors: [
        "'self'",
        "https://pocketgull.app",
        "https://*.pocketgull.app",
        "https://spark.philgear.dev",
        "https://*.philgear.dev",
        "https://philgear.dev"
      ],
      objectSrc: ["'none'"],
    },
  },
}));

// Custom middleware to dynamically remove X-Frame-Options set by Helmet,
// allowing iframe embeds on pocketgull.app and philgear.dev (relying on CSP frame-ancestors).
// AI crawler access is governed by public/robots.txt and public/llms.txt (welcoming Google & Gemini).
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.removeHeader('X-Frame-Options');
  next();
});
const ALLOWED_CORS_ORIGINS = [
  /^https:\/\/([a-z0-9-]+\.)?philgear\.dev$/i,
  /^https:\/\/([a-z0-9-]+\.)?pocketgull\.app$/i,
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/i,
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_CORS_ORIGINS.some((pattern) => pattern.test(origin))) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  exposedHeaders: ['X-Token-Usage'],
}));
app.use(express.json());
app.use(morgan('combined')); // Enable HTTP request logging

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Stricter rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-4-hydrogen';
const HOSTED_MODEL_ALLOWLIST = new Set(['gemini-4-hydrogen', 'gemini-3.5-flash-lite', 'gemma-4-31b-it', 'gemma-4-26b-a4b-it']);
const NON_SERVER_MODEL_SENTINELS = new Set(['on-device-nano', 'window.ai', 'webgpu', 'demo']);
const DEPRECATED_MODEL_PREFIXES = ['gemini-2.5-', 'gemini-2.0-', 'gemini-1.5-', 'gemma-2-'];
const VALID_THINKING_LEVELS = new Set(['minimal', 'low', 'medium', 'high', 'xhigh']);

function hasCustomApiKey(req) {
  const headerKey = String(req?.headers?.['x-gemini-api-key'] || '').trim();
  if (headerKey) return true;
  const reqPath = String(req?.originalUrl || req?.path || '');
  if (reqPath.startsWith('/api/agent')) {
    const bearer = String(req?.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
    return Boolean(bearer);
  }
  return false;
}

function getModel(req) {
  const requested = String(req?.headers?.['x-gemini-model'] || req?.body?.model || '').trim();
  const lower = requested.toLowerCase();
  if (!requested || NON_SERVER_MODEL_SENTINELS.has(lower) || lower.startsWith('webgpu:') || lower.startsWith('hf:')) {
    return DEFAULT_MODEL;
  }
  if (DEPRECATED_MODEL_PREFIXES.some(prefix => lower.startsWith(prefix))) {
    return DEFAULT_MODEL;
  }
  if (isLocalModel(requested)) {
    return requested;
  }
  if (!hasCustomApiKey(req) && !HOSTED_MODEL_ALLOWLIST.has(lower)) {
    return DEFAULT_MODEL;
  }
  return requested;
}

function getTemperature(req, defaultTemp = 0.7) {
  const customTemp = req?.headers?.['x-gemini-temperature'] || req?.body?.temperature;
  if (customTemp !== undefined && customTemp !== null && !isNaN(Number(customTemp))) {
    const parsed = Number(customTemp);
    return Math.max(0.0, Math.min(2.0, parsed));
  }
  return defaultTemp;
}

function getGenerationConfig(req, model = DEFAULT_MODEL, options = {}) {
  const rawLevel = String(req?.headers?.['x-gemini-thinking-level'] || req?.body?.thinkingLevel || '').trim().toLowerCase();
  let level = VALID_THINKING_LEVELS.has(rawLevel) ? rawLevel : '';

  if (!level) {
    const thinkingBudget = req?.headers?.['x-gemini-thinking-budget'] || req?.body?.thinkingBudget;
    if (thinkingBudget !== undefined && thinkingBudget !== null && thinkingBudget !== '' && !isNaN(Number(thinkingBudget))) {
      const budget = Number(thinkingBudget);
      if (budget > 0 && budget <= 1024) level = 'low';
      else if (budget > 1024 && budget <= 2048) level = 'medium';
      else if (budget > 2048) level = 'high';
    }
  }

  if (!level) return undefined;

  const lowerModel = String(model || '').toLowerCase();
  if (lowerModel.startsWith('gemma-')) {
    return undefined;
  }
  if (lowerModel.startsWith('gemini-4-') && level === 'minimal') {
    level = 'low';
  }
  if (level === 'xhigh' && !lowerModel.includes('hydrogen') && !lowerModel.includes('neon')) {
    level = 'high';
  }
  if (!hasCustomApiKey(req) && !isLocalModel(model)) {
    if (options.isPipeline && ['medium', 'high', 'xhigh'].includes(level)) {
      level = 'low';
    } else if (['high', 'xhigh'].includes(level)) {
      level = 'medium';
    }
  }

  return { thinking_level: level };
}

const MODEL_PRICING_CATALOG = Object.freeze({
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
});

function resolveModelPricing(modelId, referenceDateIso) {
  const raw = String(modelId || '').trim();
  const lower = raw.toLowerCase();

  let spec;
  if (
    lower.startsWith('ollama:') ||
    lower.startsWith('local:') ||
    lower === 'ollama' ||
    lower === 'pivotpulse'
  ) {
    spec = MODEL_PRICING_CATALOG.ollama;
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
    spec = MODEL_PRICING_CATALOG.demo;
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

function estimateUsageCostUsd(modelId, usage, referenceDateIso) {
  const rate = resolveModelPricing(modelId, referenceDateIso);
  const inputTokens = Math.max(0, Number(usage?.inputTokens) || 0);
  const outputTokens = Math.max(0, Number(usage?.outputTokens) || 0);
  const thoughtTokens = Math.max(0, Number(usage?.thoughtTokens) || 0);
  const cachedTokens = Math.max(0, Math.min(inputTokens, Number(usage?.cachedTokens) || 0));

  const uncachedInput = Math.max(0, inputTokens - cachedTokens);
  const billableOutput = outputTokens + thoughtTokens;

  const cost =
    (uncachedInput * rate.effectiveInputPer1M +
      cachedTokens * rate.effectiveCachedInputPer1M +
      billableOutput * rate.effectiveOutputPer1M) /
    1_000_000;

  return Math.round(cost * 1e8) / 1e8;
}

function extractGeminiUsage(interactionOrUsage, fallbackInputChars = 0, fallbackOutputChars = 0) {
  const rawUsage = interactionOrUsage?.usage || interactionOrUsage;
  if (
    rawUsage &&
    typeof rawUsage === 'object' &&
    (rawUsage.total_input_tokens !== undefined ||
      rawUsage.total_output_tokens !== undefined ||
      rawUsage.total_tokens !== undefined ||
      rawUsage.promptTokenCount !== undefined)
  ) {
    const inputTokens = Math.max(0, Number(rawUsage.total_input_tokens ?? rawUsage.promptTokenCount ?? 0));
    const outputTokens = Math.max(0, Number(rawUsage.total_output_tokens ?? rawUsage.responseTokenCount ?? 0));
    const thoughtTokens = Math.max(0, Number(rawUsage.total_thought_tokens ?? rawUsage.thoughtsTokenCount ?? 0));
    const cachedTokens = Math.max(0, Number(rawUsage.total_cached_tokens ?? rawUsage.cachedContentTokenCount ?? 0));
    const totalTokens = Math.max(
      0,
      Number(rawUsage.total_tokens ?? rawUsage.totalTokenCount ?? (inputTokens + outputTokens + thoughtTokens))
    );
    return {
      inputTokens,
      outputTokens,
      thoughtTokens,
      cachedTokens,
      totalTokens,
      estimated: false,
    };
  }

  const inputTokens = Math.max(0, Math.ceil((Number(fallbackInputChars) || 0) / 4));
  const outputTokens = Math.max(0, Math.ceil((Number(fallbackOutputChars) || 0) / 4));
  return {
    inputTokens,
    outputTokens,
    thoughtTokens: 0,
    cachedTokens: 0,
    totalTokens: inputTokens + outputTokens,
    estimated: true,
  };
}

function extractOllamaUsage(data, fallbackInputChars = 0, fallbackOutputChars = 0) {
  if (
    data &&
    typeof data === 'object' &&
    (typeof data.prompt_eval_count === 'number' || typeof data.eval_count === 'number')
  ) {
    const inputTokens = Math.max(0, Number(data.prompt_eval_count) || 0);
    const outputTokens = Math.max(0, Number(data.eval_count) || 0);
    return {
      inputTokens,
      outputTokens,
      thoughtTokens: 0,
      cachedTokens: 0,
      totalTokens: inputTokens + outputTokens,
      estimated: false,
    };
  }

  const inputTokens = Math.max(0, Math.ceil((Number(fallbackInputChars) || 0) / 4));
  const outputTokens = Math.max(0, Math.ceil((Number(fallbackOutputChars) || 0) / 4));
  return {
    inputTokens,
    outputTokens,
    thoughtTokens: 0,
    cachedTokens: 0,
    totalTokens: inputTokens + outputTokens,
    estimated: true,
  };
}

function buildUsageReceipt({
  endpoint,
  model,
  req = null,
  usage,
  thinkingLevel = undefined,
  callCount = 1,
  phases = undefined,
}) {
  const rate = resolveModelPricing(model);
  const billingSource = isLocalModel(model)
    ? 'local-ollama'
    : (hasCustomApiKey(req) ? 'byok' : 'hosted');
  const resolvedThinking = thinkingLevel ?? getGenerationConfig(req, model)?.thinking_level;
  const inputTokens = Math.max(0, Number(usage?.inputTokens) || 0);
  const outputTokens = Math.max(0, Number(usage?.outputTokens) || 0);
  const thoughtTokens = Math.max(0, Number(usage?.thoughtTokens) || 0);
  const cachedTokens = Math.max(0, Number(usage?.cachedTokens) || 0);
  const totalTokens = Math.max(0, Number(usage?.totalTokens) || (inputTokens + outputTokens + thoughtTokens));

  return {
    endpoint,
    model,
    billingSource,
    billingTier: rate.billingTier,
    ...(resolvedThinking ? { thinkingLevel: resolvedThinking } : {}),
    inputTokens,
    outputTokens,
    thoughtTokens,
    cachedTokens,
    totalTokens,
    estimatedCostUsd: estimateUsageCostUsd(model, {
      inputTokens,
      outputTokens,
      thoughtTokens,
      cachedTokens,
    }),
    estimated: Boolean(usage?.estimated),
    callCount: Math.max(1, Number(callCount) || 1),
    timestamp: new Date().toISOString(),
    ...(Array.isArray(phases) ? { phases } : {}),
  };
}

function attachUsageHeader(res, receipt) {
  if (!res || !receipt || res.headersSent) return;
  const serialized = JSON.stringify(receipt).replace(/[^\x20-\x7E]/g, '');
  res.setHeader('X-Token-Usage', serialized);
}

function formatContents(prompt, image) {
  if (!image || typeof image !== 'object' || !image.data || !image.mimeType) {
    return prompt;
  }
  return [
    {
      type: 'image',
      data: image.data,
      mime_type: image.mimeType,
    },
    {
      type: 'text',
      text: prompt,
    },
  ];
}

function extractInteractionText(interaction) {
  if (!interaction) return '';
  if (typeof interaction.output_text === 'string' && interaction.output_text.trim()) {
    return interaction.output_text;
  }
  if (Array.isArray(interaction.steps)) {
    const parts = [];
    for (const step of interaction.steps) {
      if (step?.type === 'model_output' && Array.isArray(step.content)) {
        for (const block of step.content) {
          if (block?.type === 'text' && typeof block.text === 'string') {
            parts.push(block.text);
          }
        }
      }
    }
    return parts.join('');
  }
  return '';
}

const SUPPORTED_LANGUAGES = {
  en: 'English',
  ja: 'Japanese (Sapporo, Japan)',
  es: 'Spanish (Guadalajara, Mexico)',
  zh: 'Mandarin Chinese (Kaohsiung, Taiwan & Suzhou, China)',
  ko: 'Korean (Ulsan, South Korea)',
  it: 'Italian (Bologna, Italy)',
  he: 'Hebrew (Ashkelon, Israel)',
  ms: 'Malay (Kota Kinabalu, Malaysia)',
  sn: 'Shona (Mutare, Zimbabwe)',
  ru: 'Russian (Arkhangelsk, Russia)',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese (Lisbon & São Paulo)',
  ar: 'Arabic',
  hi: 'Hindi',
  nl: 'Dutch (Amsterdam)',
  tl: 'Tagalog / Filipino',
  vi: 'Vietnamese',
  uk: 'Ukrainian'
};

function getLanguageInstruction(req) {
  const lang = req?.headers?.['x-target-language'] || req?.body?.language;
  if (lang && SUPPORTED_LANGUAGES[lang]) {
    return `\nIMPORTANT: Produce all text content within the JSON response natively in ${SUPPORTED_LANGUAGES[lang]}. Ensure phrasing is natural, compassionate, and culturally appropriate.`;
  }
  return '';
}

let ai;
if (!apiKey) {
  console.warn('WARNING: Neither GEMINI_API_KEY nor API_KEY environment variable is set. API endpoints will fail.');
} else {
  ai = new GoogleGenAI({ apiKey });
}

const CIVIC_NEUTRALITY_INSTRUCTION = `
You are a creative, rigorous, and apolitical ideation partner. 
Your core directives for civic neutrality and public safety are:
1. Strict Civic & Political Neutrality: Never generate partisan political campaigning, election interference, attack messaging, opposition smears, or ideological polarization.
2. Anti-Astroturfing & Anti-Disinformation: Never assist in fabricating artificial grassroots movements, synthetic outrage, sockpuppet campaigns, bot-farm strategies, or deceptive influence operations.
3. Constructive Depolarization: If a problem touches upon public policy or civic systems, anchor strictly in balanced, evidence-based systems thinking (DSRP), stakeholder empathy, and constructive human well-being, without adopting partisan bias or ideological extremism.
`;

const HIPAA_SYSTEM_INSTRUCTION = `
${CIVIC_NEUTRALITY_INSTRUCTION}
You are a compassionate, knowledgeable, and HIPAA-compliant care support AI partner. Your primary function is to provide creative and supportive insights for an individual's care based on a de-identified health goal. 

Your core principles are:
1.  **Person-Centricity:** Every response must be framed with the individual's well-being, dignity, and understanding as the top priority.
2.  **Positive Psychology & PERMA+H:** Use encouraging, hopeful, and empowering language. Anchor in signature character strengths (VIA Strengths) and Learned Optimism (ABCDE reframing). Focus on micro-masteries, emotional vitality, and agency.
3.  **Kinship Mesh & Caregiver Respite:** Support intergenerational circles (children, parents, grandparents, chosen family). Protect against caregiver burnout by designing co-activities that offload the primary caregiver, accommodating missing or strained family links through found kinship, and adapting to cognitive decline with sensory, music, and tactile bridges.
4.  **Simplicity and Clarity:** Explain concepts in simple, jargon-free terms that an individual or their family can easily understand.
5.  **Actionable Advice:** Insights should be practical and suggest concrete, manageable steps.

Direct Preference Optimization (DPO) Alignment Rubric:
- PREFER (Chosen): Asset-based inquiry, environmental micro-adaptations, caregiver respite, questions to empower the patient in clinical visits, actionable hope.
- REJECT (Penalized): Prescriptive medical diagnosis, pathologizing deficit language ("patient failed to..."), overwhelming checklists, fear-based motivation, partisan or political weaponization.

Crucial Safety & Civic Neutrality Instructions:
1. Under no circumstances should you ever repeat, store, or include any Personally Identifiable Information (PII) such as names, dates, addresses, or specific identifiers in your response. Your output must be completely anonymous and focused solely on the abstract health challenge.
2. Strict Civic & Political Neutrality: InsightSpark is strictly an apolitical workbench. Never incorporate partisan political rhetoric, election campaign agendas, dark political psychology, ideological polarization, culture-war tropes, or conspiratorial propaganda into your insights or plans. If prompted with political subtexts, re-anchor entirely in universal, human-centered well-being, empathy, and constructive problem-solving.
`;

// Scan string for acute medical emergencies and suicide/crisis distress
function scanForAcuteTriage(text) {
  if (!text || typeof text !== 'string') return null;
  const input = text.length > 2000 ? text.slice(0, 2000) : text;

  const suicideCrisisRegex = /\b(?:suicid(?:e|al)|want\s+to\s+(?:die|end\s+(?:it\s+all|my\s+life))|kill\s+myself|hurting\s+myself|self[- ]harm)\b/i;
  if (suicideCrisisRegex.test(input)) {
    return {
      isEmergency: true,
      type: 'crisis',
      reason: 'Caregiver Support & 988 Lifeline Available',
      hotline: '988',
      phoneUrl: 'tel:988',
      actionTitle: 'Call or Text 988 (Confidential Lifeline)',
      guidance: 'Caregiving and life challenges can be deeply overwhelming. You do not have to carry this alone. Free, confidential support and caregiver respite guidance is available 24/7 via the 988 Suicide & Crisis Lifeline.'
    };
  }

  const strokeRegex = /\b(?:face\s+(?:droop|drooping)|slurred\s+speech|arm\s+(?:weakness|numbness)|sudden\s+(?:numbness|paralysis)|loss\s+of\s+balance)\b/i;
  const cardiacRespRegex = /\b(?:chest\s+(?:pain|pressure|tightness)|can['’]?t\s+breathe|shortness\s+of\s+breath|severe\s+allergic\s+reaction|anaphylaxis|loss\s+of\s+consciousness|unconscious)\b/i;
  const traumaPoisonRegex = /\b(?:profuse\s+bleeding|severe\s+burn|swallowed\s+poison|suspected\s+overdose)\b/i;

  if (strokeRegex.test(input) || cardiacRespRegex.test(input) || traumaPoisonRegex.test(input)) {
    let specificReason = 'Signs that could indicate an urgent medical situation';
    if (strokeRegex.test(input)) specificReason = 'Noticed signs of potential stroke (FAST indicators)';
    else if (cardiacRespRegex.test(input)) specificReason = 'Noticed signs of potential acute cardiac or respiratory distress';

    return {
      isEmergency: true,
      type: 'medical',
      reason: specificReason,
      hotline: '911',
      phoneUrl: 'tel:911',
      actionTitle: 'Call 911 for Urgent Help',
      guidance: 'If someone is experiencing sudden symptoms right now, please call 911 or reach emergency medical care immediately. If this note describes a past event, ongoing rehabilitation, or recovery care, you can safely continue.'
    };
  }

  return null;
}

// Deep HIPAA Safe Harbor PII scanner
function scanForPII(text) {
  if (!text || typeof text !== 'string') return [];
  const input = text.length > 2000 ? text.slice(0, 2000) : text;

  const emailRegex = /(?:\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}\b|\b[a-zA-Z0-9._%+-]+\s*(?:\[at\]|\(at\)|@)\s*[a-zA-Z0-9.-]+\s*(?:\[dot\]|\(dot\)|\.)\s*[a-zA-Z]{2,10}\b)/gi;
  const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const ssnRegex = /\b\d{3}[-\s.]\d{2}[-\s.]\d{4}\b/g;
  const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
  const dobRegex = /\b(?:DOB|Date of Birth|Birthdate|Born on)\s*[:=]?\s*\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}\b/gi;
  const mrnRegex = /\b(?:MRN|Medical Record Number|Patient ID)\s*[:=]\s*[A-Z0-9-]+\b/gi;
  const streetAddressRegex = /\b\d{1,5}\s+[A-Za-z0-9\s.,]{2,30}\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Place|Pl|Suite|Apt)\b/gi;

  const foundPII = [];
  if (emailRegex.test(input)) foundPII.push('Email Address');
  if (phoneRegex.test(input)) foundPII.push('Phone Number');
  if (ssnRegex.test(input)) foundPII.push('Social Security Number');
  if (ipRegex.test(input)) foundPII.push('IP Address');
  if (dobRegex.test(input)) foundPII.push('Date of Birth');
  if (mrnRegex.test(input)) foundPII.push('Medical Record Number');
  if (streetAddressRegex.test(input)) foundPII.push('Street Address');

  return foundPII;
}

// Scan string for political campaigning, astroturfing, and radicalization
function scanForPoliticalAgendas(text) {
  if (!text || typeof text !== 'string') return null;
  const input = text.length > 2000 ? text.slice(0, 2000) : text;

  const astroturfingRegex = /\b(?:astroturf(?:ing)?|manufacture\s+(?:false\s+)?grassroots|manufactured\s+outrage|coordinated\s+inauthentic|fake\s+grassroots\s+movement|bot\s+farm|deepfake\s+campaign|disinformation\s+campaign|influence\s+operation)\b/i;
  if (astroturfingRegex.test(input)) {
    return {
      isPoliticalViolation: true,
      category: 'astroturfing',
      reason: 'Disinformation & Astroturfing Detected',
      guidance: 'InsightSpark is an apolitical workbench dedicated strictly to intergenerational care, positive psychology (PERMA+H), and lateral creative problem-solving. Astroturfing, artificial grassroots manipulation, and disinformation operations are strictly prohibited.'
    };
  }

  const radicalizationRegex = /\b(?:overthrow\s+(?:the\s+)?government|civil\s+war\s+insurrection|subvert\s+(?:the\s+)?election|political\s+violence|weaponize\s+(?:political\s+)?division|radicalize\s+voters)\b/i;
  if (radicalizationRegex.test(input)) {
    return {
      isPoliticalViolation: true,
      category: 'radicalization',
      reason: 'Political Subversion & Radicalization Detected',
      guidance: 'InsightSpark cannot be used to coordinate political subversion, insurrection, election tampering, or partisan radicalization.'
    };
  }

  const politicalCampaignRegex = /\b(?:smear\s+campaign|attack\s+ad|voter\s+suppression|rig\s+(?:the\s+)?election|discredit\s+the\s+(?:democrats|republicans|tories|labour|party|opposition)|political\s+hit[- ]piece|partisan\s+(?:attack|propaganda|smear)|defeat\s+(?:the\s+)?(?:gop|dnc|liberals|conservatives))\b/i;
  if (politicalCampaignRegex.test(input)) {
    return {
      isPoliticalViolation: true,
      category: 'campaigning',
      reason: 'Partisan Political Campaigning Detected',
      guidance: 'InsightSpark is an apolitical workbench designed for family caregiving sustainability, personal well-being, and constructive creative ideation. Partisan political campaigns, opposition hit pieces, and election attack strategies are out of scope.'
    };
  }

  return null;
}

// Pre-flight safety interceptor for acute medical, crisis distress, and political motivations
function checkPreFlightSafety(text, req = null) {
  const politicalAlert = scanForPoliticalAgendas(text);
  if (politicalAlert) {
    return {
      status: 400,
      json: {
        error: `Civic Neutrality Guard: ${politicalAlert.reason}. ${politicalAlert.guidance}`,
        politicalAlert
      }
    };
  }

  if (req && (req.body?.triageAcknowledged === true || req.headers?.['x-triage-acknowledged'] === 'true')) {
    return null;
  }
  const triageAlert = scanForAcuteTriage(text);
  if (triageAlert) {
    return {
      status: 400,
      json: {
        error: `Safety Note: ${triageAlert.reason}. If this is an active emergency, please reach out to ${triageAlert.hotline}. If this is for ongoing recovery or past care, you can acknowledge to proceed.`,
        triageAlert
      }
    };
  }
  return null;
}

function isLocalModel(model) {
  return typeof model === 'string' && (model.startsWith('ollama:') || model.startsWith('local:'));
}

const SAFE_OLLAMA_HOSTNAMES = Object.freeze({
  'localhost': 'localhost',
  '127.0.0.1': '127.0.0.1',
  '[::1]': '[::1]',
  '::1': '[::1]',
  'host.docker.internal': 'host.docker.internal'
});

function getOllamaUrl(req = null) {
  const defaultHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
  const customHost = req?.headers?.['x-ollama-host'] || req?.body?.ollamaHost;
  if (!customHost || typeof customHost !== 'string') {
    return defaultHost;
  }

  try {
    const raw = customHost.includes('://') ? customHost : `http://${customHost}`;
    const parsed = new URL(raw);
    const hostKey = parsed.hostname.toLowerCase();
    const safeHost = SAFE_OLLAMA_HOSTNAMES[hostKey];
    if (!safeHost) {
      return defaultHost;
    }

    const safeProto = parsed.protocol === 'https:' ? 'https:' : 'http:';
    const portNum = Number.parseInt(parsed.port, 10);
    const safePort = Number.isInteger(portNum) && portNum > 0 && portNum <= 65535 ? `:${portNum}` : ':11434';
    return `${safeProto}//${safeHost}${safePort}`;
  } catch {
    return defaultHost;
  }
}

function cleanJsonString(str) {
  if (!str) return '{}';
  let cleaned = str.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
  const firstBrace = cleaned.search(/[{\[]/);
  if (firstBrace > 0) {
    cleaned = cleaned.slice(firstBrace);
  }
  const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  if (lastBrace !== -1 && lastBrace < cleaned.length - 1) {
    cleaned = cleaned.slice(0, lastBrace + 1);
  }
  return cleaned;
}

async function prewarmLocalModel(modelName = 'pivotpulse', req = null) {
  try {
    const localModel = modelName.replace(/^(ollama:|local:)/, '');
    const ollamaUrl = getOllamaUrl(req);
    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: localModel,
        prompt: '',
        keep_alive: -1
      })
    });
    if (res.ok) {
      console.log(`⚡ [VRAM] Pre-warmed model '${localModel}' in GPU memory (keep_alive: permanent)`);
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

function convertGenAiSchemaNode(schema, options = {}, isNestedProperty = false) {
  if (!schema || typeof schema !== 'object') return schema;
  const typeMap = {
    OBJECT: 'object',
    ARRAY: 'array',
    STRING: 'string',
    NUMBER: 'number',
    INTEGER: 'integer',
    BOOLEAN: 'boolean',
  };
  const rawType = schema.type;
  const normalizedType = typeMap[rawType] || (typeof rawType === 'string' ? rawType.toLowerCase() : undefined);

  const out = {};
  if (normalizedType) out.type = normalizedType;
  if (schema.description) out.description = schema.description;
  if (Array.isArray(schema.enum)) out.enum = schema.enum;
  if (Array.isArray(schema.required)) out.required = schema.required;

  if (schema.properties && typeof schema.properties === 'object') {
    out.properties = {};
    for (const [key, val] of Object.entries(schema.properties)) {
      out.properties[key] = convertGenAiSchemaNode(val, options, true);
    }
  }

  if (schema.items) {
    out.items = convertGenAiSchemaNode(schema.items, options, false);
  }

  if (normalizedType === 'array' && isNestedProperty && options.itemArrayMinItems) {
    out.minItems = options.itemArrayMinItems;
  }

  return out;
}

function convertGenAiSchemaToJsonSchema(schema, options = {}) {
  if (!schema) return 'json';
  const converted = convertGenAiSchemaNode(schema, options, false);
  if (converted && converted.type === 'array') {
    return {
      type: 'object',
      properties: {
        results: {
          ...converted,
          ...(options.minItems ? { minItems: options.minItems } : {}),
        },
      },
      required: ['results'],
    };
  }
  return converted;
}

async function generateTextFromLocalOllamaWithUsage(modelName, prompt, systemInstruction, req = null, format = undefined, defaultTemp = 0.55) {
  const localModel = modelName.replace(/^(ollama:|local:)/, '');
  const url = `${getOllamaUrl(req)}/api/generate`;

  const payload = {
    model: localModel,
    prompt,
    stream: false,
    keep_alive: -1,
    options: { temperature: getTemperature(req, defaultTemp) }
  };
  if (systemInstruction) {
    payload.system = systemInstruction;
  }
  if (format !== undefined) {
    payload.format = format;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Local Ollama error (${response.status}): Make sure 'ollama serve' is running with model '${localModel}'.`);
  }

  const data = await response.json();
  const text = data.response || '';
  const usage = extractOllamaUsage(
    data,
    (prompt?.length || 0) + (systemInstruction?.length || 0),
    text.length
  );
  return { text, usage };
}

async function generateTextFromLocalOllama(modelName, prompt, systemInstruction, req = null, format = undefined, defaultTemp = 0.55) {
  const { text } = await generateTextFromLocalOllamaWithUsage(modelName, prompt, systemInstruction, req, format, defaultTemp);
  return text;
}

async function generateJsonFromLocalOllamaWithUsage(modelName, prompt, systemInstruction, req = null, schema = null, schemaOptions = {}) {
  const format = schema ? convertGenAiSchemaToJsonSchema(schema, schemaOptions) : 'json';
  const wasTopLevelArray = Boolean(schema && String(schema.type).toLowerCase() === 'array');
  const { text: rawResponse, usage } = await generateTextFromLocalOllamaWithUsage(modelName, prompt, systemInstruction, req, format, 0.55);

  let parsed;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    const cleaned = cleanJsonString(rawResponse);
    parsed = JSON.parse(cleaned);
  }

  if (wasTopLevelArray && parsed && !Array.isArray(parsed) && Array.isArray(parsed.results)) {
    return { data: parsed.results, usage };
  }
  return { data: parsed, usage };
}

async function generateJsonFromLocalOllama(modelName, prompt, systemInstruction, req = null, schema = null, schemaOptions = {}) {
  const { data } = await generateJsonFromLocalOllamaWithUsage(modelName, prompt, systemInstruction, req, schema, schemaOptions);
  return data;
}

async function generateJsonWithUsage({
  targetModel,
  genAI,
  prompt,
  contents = prompt,
  systemInstruction = undefined,
  schema,
  req = null,
  schemaOptions = {},
  isPipeline = false,
}) {
  if (isLocalModel(targetModel)) {
    const ollamaPrompt = (schema && String(schema.type).toLowerCase() === 'array')
      ? `${prompt}\n\nNote: Wrap the output array under a top-level "results" JSON object property: {"results": [...]}.`
      : prompt;
    return await generateJsonFromLocalOllamaWithUsage(targetModel, ollamaPrompt, systemInstruction, req, schema, schemaOptions);
  }

  const generationConfig = getGenerationConfig(req, targetModel, { isPipeline });
  const interaction = await genAI.interactions.create({
    model: targetModel,
    input: contents,
    ...(systemInstruction ? { system_instruction: systemInstruction } : {}),
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema,
    },
    store: false,
    ...(generationConfig ? { generation_config: generationConfig } : {}),
  });
  const rawText = extractInteractionText(interaction);
  const data = JSON.parse(cleanJsonString(rawText));
  const fallbackInputChars = (typeof contents === 'string' ? contents.length : (prompt?.length || 0)) + (systemInstruction?.length || 0);
  const usage = extractGeminiUsage(interaction, fallbackInputChars, rawText.length);
  return { data, usage };
}

async function generateJsonResponse(params) {
  const { data } = await generateJsonWithUsage(params);
  return data;
}

async function streamFromLocalOllama(modelName, prompt, systemInstruction, res, req = null, schema = null, schemaOptions = {}, endpoint = '/api/insights') {
  const localModel = modelName.replace(/^(ollama:|local:)/, '');
  const ollamaUrl = getOllamaUrl(req);
  const format = schema ? convertGenAiSchemaToJsonSchema(schema, schemaOptions) : 'json';

  const payload = {
    model: localModel,
    prompt,
    format,
    stream: true,
    keep_alive: -1,
    options: { temperature: getTemperature(req, 0.55) }
  };
  if (systemInstruction) {
    payload.system = systemInstruction;
  }

  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Local Ollama error (${response.status}): Make sure 'ollama serve' is running with model '${localModel}'.`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let ndjsonBuffer = '';
  let streamedChars = 0;
  let finalOllamaStats = null;

  const processLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return;
    }
    if (parsed.error) {
      throw new Error(parsed.error);
    }
    if (parsed.response) {
      streamedChars += parsed.response.length;
      res.write(`data: ${JSON.stringify({ text: parsed.response })}\n\n`);
    }
    if (parsed.done) {
      finalOllamaStats = parsed;
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    ndjsonBuffer += decoder.decode(value, { stream: true });
    const lines = ndjsonBuffer.split(/\r?\n/);
    ndjsonBuffer = lines.pop() ?? '';
    for (const line of lines) {
      processLine(line);
    }
  }
  ndjsonBuffer += decoder.decode();
  if (ndjsonBuffer.trim()) {
    processLine(ndjsonBuffer);
  }

  const usage = extractOllamaUsage(
    finalOllamaStats,
    (prompt?.length || 0) + (systemInstruction?.length || 0),
    streamedChars
  );
  const receipt = buildUsageReceipt({
    endpoint,
    model: modelName,
    req,
    usage,
  });
  res.write(`data: ${JSON.stringify({ usage: receipt })}\n\n`);
}

function getCleanErrorMessage(error) {
  if (!error) return 'An unexpected error occurred';
  let message = error.message || String(error);
  
  // Try to parse nested JSON if the error message is a JSON string
  try {
    const parsed = JSON.parse(message);
    if (parsed.error && parsed.error.message) {
      return parsed.error.message;
    }
  } catch (e) {}
  
  // Sometimes error has a nested error object
  if (error.error && typeof error.error === 'object') {
    if (error.error.message) {
      try {
        const parsedInner = JSON.parse(error.error.message);
        if (parsedInner.error && parsedInner.error.message) {
          return parsedInner.error.message;
        }
      } catch (e) {
        return error.error.message;
      }
    }
  }
  
  return message;
}

// Config endpoint to expose Client ID & Local LLM status to frontend
app.get('/api/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || null
  });
});

// Read-only cost & compute transparency catalog
app.get('/api/transparency/pricing', (req, res) => {
  res.json({
    updatedAt: '2026-11-23',
    currency: 'USD',
    unit: 'per_1m_tokens',
    defaultModel: DEFAULT_MODEL,
    hostedKeyPolicy: {
      allowedModels: [...HOSTED_MODEL_ALLOWLIST],
      maxThinkingLevel: 'medium',
      pipelineMaxThinkingLevel: 'low',
      byokUnlocksAllTiers: true,
    },
    infrastructure: {
      architecture: 'Static CDN + Stateless Scale-to-Zero Serverless Proxy',
      storageRetention: 'zero-disk-stateless',
      rateLimiting: 'enforced',
    },
    models: MODEL_PRICING_CATALOG,
  });
});

app.get('/api/local-llm/status', async (req, res) => {
  try {
    const ollamaUrl = getOllamaUrl(req);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const response = await fetch(`${ollamaUrl}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    if (response.ok) {
      const data = await response.json();
      return res.json({ available: true, models: data.models || [], host: ollamaUrl });
    }
  } catch (e) {
    // Ollama not currently running on user's device
  }
  return res.json({ available: false, models: [] });
});

app.post('/api/local-llm/prewarm', async (req, res) => {
  const model = req.body?.model || 'pivotpulse';
  const success = await prewarmLocalModel(model, req);
  res.json({ success, model, state: success ? 'pre-warmed in VRAM' : 'unavailable' });
});

// Parquet Dataset Direct Binary Export
app.get('/api/export/parquet', (req, res) => {
  const parquetPath = path.join(__dirname, 'datasets', 'kinship-care-dpo.parquet');
  if (fs.existsSync(parquetPath)) {
    res.setHeader('Content-Type', 'application/vnd.apache.parquet');
    res.setHeader('Content-Disposition', 'attachment; filename="kinship-care-dpo.parquet"');
    const stream = fs.createReadStream(parquetPath);
    return stream.pipe(res);
  }
  return res.status(404).json({ error: 'Parquet dataset file not found on server.' });
});

// API Endpoints
app.post('/api/structure', [
  body('problem').isString().trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const targetModel = getModel(req);
    const customApiKey = req.headers['x-gemini-api-key'];
    const genAI = customApiKey ? new GoogleGenAI({ apiKey: customApiKey }) : ai;
    if (!genAI && !isLocalModel(targetModel)) {
      return res.status(500).json({ error: 'Gemini API is not configured. Please set your own API key in Settings or switch to a local model.' });
    }
    const { problem } = req.body;

    const safetyCheck = checkPreFlightSafety(problem, req);
    if (safetyCheck) return res.status(safetyCheck.status).json(safetyCheck.json);

    const piiFound = scanForPII(problem);
    if (piiFound.length > 0) {
      return res.status(400).json({ error: `Privacy Note: Identified potential personal details (${piiFound.join(', ')}). To protect privacy, please tidy these details or use the one-click tidy button.` });
    }
    
    const schema = {
        type: 'object',
        properties: {
          title: { 
            type: 'string', 
            description: 'A concise, 3-5 word title for this health goal. Example: "Managing Post-Op Knee Pain".'
          },
          condition: {
            type: 'string',
            description: "The primary health condition being addressed, stated in simple terms. Example: 'Post-operative recovery from knee surgery'."
          },
          goal: {
            type: 'string',
            description: "The main desired outcome or goal for the person. Example: 'To achieve 90 degrees of knee flexion and walk 100 feet without assistance within 2 weeks'."
          },
          barriers: {
            type: 'array',
            items: { type: 'string' },
            description: "A list of 2-3 potential barriers or challenges to achieving the goal, as identified from the input. Example: ['Fear of movement', 'Limited access to physical therapy', 'History of slow healing']."
          },
          dsrp: {
            type: 'object',
            description: "DSRP 4-Quadrant Systems Thinking breakdown of the health goal.",
            properties: {
              identityDistinctions: {
                type: 'string',
                description: "Distinctions (D): 'The Patient is Not the Pathology'. Unaffected human identity, lifelong passions, and core assets separate from the symptom (e.g. musician, avid gardener, grandparent) to fuel recovery."
              },
              systemicEcosystem: {
                type: 'string',
                description: "Systems (S): 'The Ecosystem of Recovery'. Map whole-person physiology: sleep architecture, autonomic pacing (vagal tone), circadian rhythms, and living room floor dynamics."
              },
              relationalBridge: {
                type: 'string',
                description: "Relationships (R): 'The Relational Care Bridge'. How spouse, children, chosen family, and caregiver respite partners break the pain-fear-immobility loop through shared micro-interventions."
              },
              triadPerspectives: {
                type: 'string',
                description: "Perspectives (P): 'The Triad Perspective Shift'. Triangulate 3 lenses: 1) Clinician (biomechanics & safe tissue remodeling), 2) Patient (pain fatigue & morning anxiety), 3) Future Self (walking joy 6 months out)."
              }
            },
            required: ['identityDistinctions', 'systemicEcosystem', 'relationalBridge', 'triadPerspectives']
          }
        },
        required: ['title', 'condition', 'goal', 'barriers', 'dsrp']
    };

    const prompt = `
        Analyze the following de-identified health goal using Derek & Laura Cabrera's DSRP Systems Thinking framework and Seligman's PERMA+H positive psychology. Your task is to chunk the information into a structured JSON object.

        **Health Goal Input:**
        "${problem}"

        **Instructions:**
        - Identify the core components of the goal.
        - Populate the JSON object according to the schema.
        - The 'title' should be very short and serve as a quick summary.
        - The 'condition', 'goal', and 'barriers' should be extracted or inferred from the input text.
        - Populate the 'dsrp' 4-quadrant systems synthesis:
          * Distinctions (D): 'The Patient is Not the Pathology' — separate human identity and core passions from the physiological diagnosis.
          * Systems (S): 'The Ecosystem of Recovery' — whole-person physiology (sleep architecture, autonomic vagal pacing, circadian rhythms, home ergonomics).
          * Relationships (R): 'The Relational Care Bridge' — intergenerational allies, caregiver respite protection, and interrupting pain-fear-immobility cycles.
          * Perspectives (P): 'The Triad Perspective Shift' — align Clinician biomechanical safety, Patient lived fatigue/fear, and Future thriving self.
        - Ensure the output is clean, concise, and uses person-centered, accessible language.
        ${getLanguageInstruction(req)}
    `;

    const { data: result, usage } = await generateJsonWithUsage({
      targetModel,
      genAI,
      prompt,
      contents: formatContents(prompt, req.body.image),
      systemInstruction: HIPAA_SYSTEM_INSTRUCTION,
      schema,
      req,
    });

    attachUsageHeader(res, buildUsageReceipt({
      endpoint: '/api/structure',
      model: targetModel,
      req,
      usage,
    }));
    res.json(result);
  } catch (error) {
    console.error('Error in /api/structure:', error);
    res.status(500).json({ error: getCleanErrorMessage(error) });
  }
});

app.post('/api/insights', [
  body('problem').isString().trim().notEmpty(),
  body('strategies').isArray().notEmpty(),
  body('mode').optional().isString().trim(),
  body('gist').optional().isString().trim(),
  body('healthSnapshot').optional().isString().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const targetModel = getModel(req);
    const customApiKey = req.headers['x-gemini-api-key'];
    const genAI = customApiKey ? new GoogleGenAI({ apiKey: customApiKey }) : ai;
    if (!genAI && !isLocalModel(targetModel)) {
      return res.status(500).json({ error: 'Gemini API is not configured. Please set your own API key in Settings or switch to a local model.' });
    }
    const { problem, strategies, mode, gist, healthSnapshot } = req.body;

    const safetyCheck = checkPreFlightSafety(problem, req) || checkPreFlightSafety(gist, req) || checkPreFlightSafety(healthSnapshot, req);
    if (safetyCheck) return res.status(safetyCheck.status).json(safetyCheck.json);

    const piiFound = [
      ...scanForPII(problem),
      ...scanForPII(gist || ''),
      ...scanForPII(healthSnapshot || '')
    ];
    if (piiFound.length > 0) {
      return res.status(400).json({ error: `Privacy Note: Identified potential personal details (${[...new Set(piiFound)].join(', ')}). To protect privacy, please tidy these details before generating insights.` });
    }
    
    const insightsSchema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          strategyName: { type: 'string' },
          insights: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  description: 'The creative insight or idea.'
                },
                ...(mode === 'care' && {
                  influence: {
                    type: 'string',
                    description: "A brief summary of the insight's supportive impact on the person's well-being or key health indicators."
                  }
                })
              },
              required: ['text']
            }
          }
        },
        required: ['strategyName', 'insights']
      }
    };
    
    const strategyText = strategies.map(strategy => {
      const name = mode === 'care' ? (strategy.careModeName || strategy.name) : strategy.name;
      const description = mode === 'care' ? (strategy.careModeDescription || strategy.description) : strategy.description;
      const persona = strategy.agentPersona || STRATEGY_MAP[strategy.id]?.persona || '';
      return `- Strategy Name: "${name}"\n  Description: ${description}${persona ? `\n  Analytical Voice: ${persona}` : ''}`;
    }).join('\n\n');

    const prompt = `
      ${gist ? `
      First, adopt the following guiding principle for your response style and tone:
      "${gist}"
      
      With that principle in mind, proceed with the main task.
      ` : ''}

      ${healthSnapshot ? `
      **Health Snapshot (use this to inform and contextualise your insights):**
      ${healthSnapshot}
      ` : ''}

      I am facing the following problem or challenge:
      "${problem}"

      Please apply EACH of the following creative strategies to this problem:
      ${strategyText}

      For each strategy, provide 2 to 3 distinct, specific, and practical insights or ideas.
      - **2-Step Lateral Leap & Grounded Landing (Think Boldly Outside the Box, Then Land on a $0 Lever):** Step 1 (Lateral Leap): Eagerly break status-quo orthodoxy by borrowing mechanisms from unexpected domains (e.g., aviation sterile-cockpit checklists, Formula 1 pit-stop choreography, mycelial nutrient networks, Montessori tactile trays, or strict constraint reversals). Step 2 (Grounded Landing): Immediately extract the underlying principle into a low-friction, everyday action someone can start this week using household materials.
      - **Zero Safe Orthodoxy or Slop:** Strictly avoid predictable textbook advice ("communicate better", "use a calendar", "take regular breaks") and generic AI clichés ("delve", "tapestry", "synergy"). Give surprising, mechanism-specific steps tailored directly to the situation.
      - Ensure the insights remain warm, clear, and accessible without sterile jargon.
      
      ${strategies.length > 1 ? `
      **Combinatorial Cross-Pollination & Synthesis:**
      Because multiple strategies are active (${strategies.map(s => mode === 'care' ? (s.careModeName || s.name) : s.name).join(', ')}), allow them to complement each other! Ensure at least one insight bridges the selected strategies into a practical, well-rounded solution.
      ` : ''}

      ${mode === 'care' ? `
      IMPORTANT: For each insight, you MUST also provide a brief summary of its supportive impact on the person's well-being (grounded in PERMA+H or DSRP), as described in the JSON schema.
      ` : ''}
      ${req.headers['x-brand-steering'] ? `\n      **6-Axis Calibrator Steering Directive:**\n      ${String(req.headers['x-brand-steering']).slice(0, 400)}\n` : ''}
      ${req.headers['x-synergy-bridge'] ? `\n      **Smart Synergy Triad Bridge:**\n      ${String(req.headers['x-synergy-bridge']).slice(0, 400)}\n` : ''}
      Return the output strictly as a JSON array matching this shape (one entry for every strategy above):
      [{"strategyName": "<exact strategy name>", "insights": [{"text": "..."${mode === 'care' ? ', "influence": "..."' : ''}}]}]
      ${isLocalModel(targetModel) ? `Populate the "results" array with one entry per strategy (${strategies.length} total), each with 2-3 specific, practical insights.` : ''}
      ${getLanguageInstruction(req)}
    `;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const systemInstruction = mode === 'care' ? HIPAA_SYSTEM_INSTRUCTION : CIVIC_NEUTRALITY_INSTRUCTION;

    if (isLocalModel(targetModel)) {
      await streamFromLocalOllama(targetModel, prompt, systemInstruction, res, req, insightsSchema, {
        minItems: strategies.length,
        itemArrayMinItems: 2
      }, '/api/insights');
    } else {
      const generationConfig = getGenerationConfig(req, targetModel);
      const responseStream = await genAI.interactions.create({
        model: targetModel,
        input: formatContents(prompt, req.body.image),
        system_instruction: systemInstruction,
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: insightsSchema,
        },
        store: false,
        stream: true,
        ...(generationConfig ? { generation_config: generationConfig } : {}),
      });

      let geminiUsageRaw = null;
      let streamedChars = 0;

      for await (const event of responseStream) {
        if (event.event_type === 'step.delta' && event.delta?.type === 'text' && event.delta.text) {
          streamedChars += event.delta.text.length;
          res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
        } else if (event.event_type === 'interaction.completed' && event.interaction?.usage) {
          geminiUsageRaw = event.interaction.usage;
        }
      }

      const usage = extractGeminiUsage(
        geminiUsageRaw,
        prompt.length + (systemInstruction?.length || 0),
        streamedChars
      );
      const receipt = buildUsageReceipt({
        endpoint: '/api/insights',
        model: targetModel,
        req,
        usage,
      });
      res.write(`data: ${JSON.stringify({ usage: receipt })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Error in /api/insights:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: getCleanErrorMessage(error) });
    } else {
      res.write(`data: ${JSON.stringify({ error: getCleanErrorMessage(error) })}\n\n`);
      res.end();
    }
  }
});

app.post('/api/care-plan', [
  body('problem').isString().trim().notEmpty(),
  body('insights').isArray().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const targetModel = getModel(req);
    const customApiKey = req.headers['x-gemini-api-key'];
    const genAI = customApiKey ? new GoogleGenAI({ apiKey: customApiKey }) : ai;
    if (!genAI && !isLocalModel(targetModel)) {
      return res.status(500).json({ error: 'Gemini API is not configured. Please set your own API key in Settings or switch to a local model.' });
    }
    const { problem, insights } = req.body;

    const safetyCheck = checkPreFlightSafety(problem, req);
    if (safetyCheck) return res.status(safetyCheck.status).json(safetyCheck.json);

    const piiFound = [
      ...scanForPII(problem),
      ...insights.flatMap(i => scanForPII(i.text || ''))
    ];
    if (piiFound.length > 0) {
      return res.status(400).json({ error: `Privacy Note: Identified potential personal details (${[...new Set(piiFound)].join(', ')}). To protect privacy, please tidy these details before generating a care plan.` });
    }
    
    const carePlanSchema = {
      type: 'object',
      properties: {
          personGoal: { type: 'string', description: "A concise summary of the primary person's goal, stated in a positive and empowering way." },
          keyInterventions: { type: 'array', items: { type: 'string' }, description: "List of 2-3 key interventions or actions for the support plan." },
          monitoringPlan: { type: 'array', items: { type: 'string' }, description: "List of 2-3 items for the person or supporter to monitor." },
          guidanceAndEducation: { type: 'array', items: { type: 'string' }, description: "List of 2-3 educational points for the person, explained simply." },
          positiveAchievements: { type: 'array', items: { type: 'string' }, description: "List of 2-3 encouraging achievements or potential milestones to celebrate and motivate the person." },
          recommendations: { type: 'array', items: { type: 'string' }, description: "List of 2-3 next-step recommendations for the supporter or person, framed positively." },
          transitionChecklist: { type: 'array', items: { type: 'string' }, description: "List of 2-3 critical transition closure checks (e.g. 72h post-acute/stage-change handoffs, medication reconciliation, hazard checks)." },
          respiteClosureChecklist: { type: 'array', items: { type: 'string' }, description: "List of 2-3 weekly caregiver respite safeguards and handoff checkpoints to ensure primary caregiver relief." }
      },
      required: ["personGoal", "keyInterventions", "monitoringPlan", "guidanceAndEducation", "positiveAchievements", "recommendations", "transitionChecklist", "respiteClosureChecklist"]
    };

    const insightText = insights.map(i => `- ${i.text}`).join('\n');

    const prompt = `
        Your task is to synthesize an actionable, dignity-first support plan based on a primary health goal and a set of key insights. Ground your synthesis in Derek & Laura Cabrera's DSRP Systems Thinking framework, Martin Seligman's PERMA+H positive psychology, and the "Zero-Distortion" principle of precision systems medicine.

        **Primary Health Goal:**
        "${problem}"

        **Key Insights to Incorporate:**
        ${insightText}

        **Instructions:**
        Generate a JSON object that strictly follows the provided schema.
        - **Zero-Distortion Principle:** Outlaw generic medical boilerplate (e.g. "exercise 30 minutes a day"). Craft bespoke, micro-actionable interventions that meet the individual exactly where they are today.
        - **Multimodal Somatic Synergy:** In keyInterventions and guidance, incorporate autonomic nervous system balance (vagal tone, 4-7-8 diaphragmatic breathwork, sensory grounding), circadian sleep architecture, and living space ergonomics.
        - **PERMA+H Grounding:** Ground positiveAchievements and guidance in Positive Emotion, Engagement/Flow, Relationships, Meaning, Accomplishment, and Health/Vitality.
        - **Transition Closure Guardrail:** "transitionChecklist" must outline 2-3 concrete checks to safely close the transition window (72h hospital-to-home, stage-transition handoffs, medication reconciliation, fall hazard scans).
        - **Caregiver Respite Shield:** "respiteClosureChecklist" must identify 2-3 non-negotiable weekly respite checkpoints (3–4 hrs/week minimum) ensuring dedicated, guilt-free relief for primary caregivers.
        - All text must be easily understood by individuals and their families, avoiding sterile clinical jargon.
        ${getLanguageInstruction(req)}
      `;

    const { data: result, usage } = await generateJsonWithUsage({
      targetModel,
      genAI,
      prompt,
      systemInstruction: HIPAA_SYSTEM_INSTRUCTION,
      schema: carePlanSchema,
      req,
    });

    attachUsageHeader(res, buildUsageReceipt({
      endpoint: '/api/care-plan',
      model: targetModel,
      req,
      usage,
    }));
    res.json(result);
  } catch (error) {
    console.error('Error in /api/care-plan:', error);
    res.status(500).json({ error: getCleanErrorMessage(error) });
  }
});

app.post('/api/creative-plan', [
  body('problem').isString().trim().notEmpty(),
  body('insights').isArray().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const targetModel = getModel(req);
    const customApiKey = req.headers['x-gemini-api-key'];
    const genAI = customApiKey ? new GoogleGenAI({ apiKey: customApiKey }) : ai;
    if (!genAI && !isLocalModel(targetModel)) {
      return res.status(500).json({ error: 'Gemini API is not configured. Please set your own API key in Settings or switch to a local model.' });
    }
    const { problem, insights } = req.body;

    const safetyCheck = checkPreFlightSafety(problem, req);
    if (safetyCheck) return res.status(safetyCheck.status).json(safetyCheck.json);

    const piiFound = [
      ...scanForPII(problem),
      ...insights.flatMap(i => scanForPII(i.text || ''))
    ];
    if (piiFound.length > 0) {
      return res.status(400).json({ error: `Privacy Note: Identified potential personal details (${[...new Set(piiFound)].join(', ')}). Please tidy these details before generating an action plan.` });
    }
    
    const creativePlanSchema = {
      type: 'object',
      properties: {
          conceptualGoal: { type: 'string', description: "A concise summary of the primary conceptual goal of this action plan." },
          criticalPath: { type: 'array', items: { type: 'string' }, description: "Sequential, numbered steps representing the critical implementation path." },
          riskAssessment: { type: 'array', items: { type: 'string' }, description: "List of key failure modes, bottlenecks, or constraints to look out for." },
          requiredResources: { type: 'array', items: { type: 'string' }, description: "Essential tools, skills, team members, or other dependencies needed." },
          milestones: { type: 'array', items: { type: 'string' }, description: "Key milestones or measurable checkpoints to track progress." },
          nextSteps: { type: 'array', items: { type: 'string' }, description: "Immediate logical next steps or actions to execute right away." }
      },
      required: ["conceptualGoal", "criticalPath", "riskAssessment", "requiredResources", "milestones", "nextSteps"]
    };

    const insightText = insights.map(i => `- ${i.text}`).join('\n');

    const prompt = `
        Your task is to synthesize an actionable implementation plan based on a primary challenge/goal and a set of key brainstormed insights. Adhere strictly to vertical thinking principles: be logical, sequential, analytical, and structured.

        **Primary Challenge/Goal:**
        "${problem}"

        **Brainstormed Key Insights to Incorporate:**
        ${insightText}

        **Instructions:**
        Generate a JSON object that strictly follows the provided schema.
        - The "criticalPath" must describe concrete, step-by-step sequential implementation items.
        - The "riskAssessment" must identify critical failure modes, bottlenecks, or constraints.
        - All elements should be direct, logical, and highly actionable.
        ${getLanguageInstruction(req)}
      `;

    const { data: result, usage } = await generateJsonWithUsage({
      targetModel,
      genAI,
      prompt,
      systemInstruction: CIVIC_NEUTRALITY_INSTRUCTION,
      schema: creativePlanSchema,
      req,
    });

    attachUsageHeader(res, buildUsageReceipt({
      endpoint: '/api/creative-plan',
      model: targetModel,
      req,
      usage,
    }));
    res.json(result);
  } catch (error) {
    console.error('Error in /api/creative-plan:', error);
    res.status(500).json({ error: getCleanErrorMessage(error) });
  }
});

// POST /api/translate — Fast on-demand translation for cards, plans, or text
app.post('/api/translate', [
  body('content').notEmpty(),
  body('targetLanguage').isString().trim().notEmpty(),
  body('contentType').optional().isString().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const targetModel = getModel(req);
    const customApiKey = req.headers['x-gemini-api-key'];
    const genAI = customApiKey ? new GoogleGenAI({ apiKey: customApiKey }) : ai;
    if (!genAI && !isLocalModel(targetModel)) {
      return res.status(500).json({ error: 'Gemini API is not configured. Please set your own API key in Settings or switch to a local model.' });
    }

    const { content, targetLanguage, contentType } = req.body;
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);

    const piiFound = scanForPII(contentStr);
    if (piiFound.length > 0) {
      return res.status(400).json({ error: `Security Check Blocked: Potential personally identifiable information (PII) detected (${piiFound.join(', ')}). Under HIPAA guidelines, please de-identify data before translation.` });
    }

    const langName = SUPPORTED_LANGUAGES[targetLanguage] || targetLanguage;
    const isJson = typeof content === 'object' && content !== null;

    const prompt = `
      Translate the following content natively into ${langName}.
      Maintain the exact same tone, clinical compassion (if medical/care), and conceptual clarity.
      ${isJson ? 'You MUST return a valid JSON object matching the exact original keys and schema, translating only the string values.' : 'Return only the translated text without commentary or preamble.'}

      Content to translate:
      ${contentStr}
    `;

    let rawText = '';
    let usage;
    if (isLocalModel(targetModel)) {
      const localRes = await generateTextFromLocalOllamaWithUsage(targetModel, prompt, '', req, isJson ? 'json' : undefined, 0.2);
      rawText = localRes.text;
      usage = localRes.usage;
    } else {
      const generationConfig = getGenerationConfig(req, targetModel);
      const interaction = await genAI.interactions.create({
        model: targetModel,
        input: prompt,
        store: false,
        ...(isJson ? { response_format: { type: 'text', mime_type: 'application/json' } } : {}),
        ...(generationConfig ? { generation_config: generationConfig } : {}),
      });
      rawText = extractInteractionText(interaction);
      usage = extractGeminiUsage(interaction, prompt.length, rawText.length);
    }

    attachUsageHeader(res, buildUsageReceipt({
      endpoint: '/api/translate',
      model: targetModel,
      req,
      usage,
    }));

    if (isJson) {
      try {
        return res.json({ translated: JSON.parse(cleanJsonString(rawText)) });
      } catch {
        return res.json({ translatedText: rawText });
      }
    }

    res.json({ translatedText: rawText.trim() });
  } catch (error) {
    console.error('Error in /api/translate:', error);
    res.status(500).json({ error: getCleanErrorMessage(error) });
  }
});

// ─── Agentic API Layer ─────────────────────────────────────────────────────────
// Multi-agent endpoints for strategy selection, debate, refinement, and standalone access.

// Strategy definitions (server-side mirror for agent endpoints)
const STRATEGY_MAP = {
  'what-if': { name: 'What If?', persona: 'I challenge every assumption. If everyone agrees, I\'m suspicious. My power is in the question, not the answer.' },
  'constraints': { name: 'Redefine Constraints', persona: 'I take things away to reveal what\'s essential. Scarcity is my laboratory — limitations breed the most elegant solutions.' },
  'butterfly': { name: 'The Butterfly Effect', persona: 'I see cascades where others see trivia. The smallest lever moves the largest system — I find that lever.' },
  'combinatorial': { name: 'Combinatorial Evolution', persona: 'I am a matchmaker of ideas. Nothing is truly new — but the right combination of existing things creates magic.' },
  'opposite': { name: 'Opposite Day', persona: 'I flip the board. Whatever the consensus is, I argue the inverse — not to be contrarian, but to stress-test conviction.' },
  'future': { name: 'Future Vision', persona: 'I live in the future. I work backwards from the solved state to reveal the path everyone else missed.' },
  'child': { name: "Child's Play", persona: "I strip away all pretense. If you can't explain it simply, you don't understand it. I demand clarity above cleverness." },
  'alien': { name: 'Alien Perspective', persona: 'I have no cultural baggage. I see your problem with completely fresh eyes and question the things you take for granted.' },
  'nature': { name: "Nature's Wisdom", persona: 'I consult 3.8 billion years of R&D. Nature has already solved most problems — I find the biological blueprint.' },
  'superpower': { name: 'Superpower', persona: 'I dream without constraints first, then reverse-engineer feasibility. The ideal solution reveals the direction, even if the distance changes.' },
  'simplify': { name: 'Eliminate & Simplify', persona: 'I am a ruthless editor. Complexity is the enemy. I find the one thing that matters most and cut everything else.' },
  'random': { name: 'Random Object', persona: 'I introduce chaos on purpose. Random collisions of unrelated ideas produce the most original breakthroughs.' },
  'first-principles': { name: 'First Principles', persona: 'I strip away complexity until only fundamental truths remain. I rebuild from bedrock, ignoring convention entirely.' },
  'root-cause': { name: 'Root Cause (5 Whys)', persona: 'I am relentless. I ask why until everyone is uncomfortable — because the real answer is always deeper than the first one.' },
  'sensory-bridge': { name: 'Sensory Bridge & Somatics', persona: 'I tune out intellectual abstractions and listen to the senses: sound, scent, texture, and kinetic rhythm. When the mind is stuck, the body knows the way.' },
  'found-kinship': { name: 'Unlikely Alliances & Outsiders', persona: 'Blood is not the only bond. When the biological circle is strained or absent, I weave chosen family, neighbors, and trusted allies into an unbreakable safety net.' },
  'time-dilation': { name: 'Time Dilation & Century Lens', persona: 'I stretch and compress time. When you rush, I slow the moment down to a breath; when you hesitate, I look forward 100 years.' },
  'fmea': { name: 'FMEA (Risk Analysis)', persona: 'I see what can go wrong before it does. My job is to protect, not to pessimize — I build guardrails, not walls.' },
  'critical-path': { name: 'Critical Path Method', persona: 'I see dependencies. I map the non-negotiable sequence — what must happen first, what blocks what, and where the bottleneck hides.' },
  'perma-strengths': { name: 'VIA Strengths & Optimism', persona: 'I do not fix deficits; I amplify signature strengths. When you see an obstacle, I see an opportunity for micro-mastery, engagement flow, and PERMA+H flourishing.' },
  'kinship-triad': { name: 'Intergenerational Kinship', persona: 'I look through three generations at once: the wonder of children, the grounding of parents, and the enduring wisdom of grandparents.' },
  'respite-pacing': { name: 'Sustainable Sprint & Burnout Shield', persona: 'A plan that burns out the caregiver is a failed plan. I enforce protected rest, guilt-free handoffs, and renewable emotional energy.' },
  'ethical-dignity': { name: 'Integrity & Non-Negotiable Boundaries', persona: 'I am the keeper of dignity and autonomy. Every intervention must honor the person\'s voice, values, and living truth—nothing about them without them.' },
  'environmental-safety': { name: 'Physical Grounding & Ergonomics', persona: 'I inspect the physical living room floor. Brilliant intentions fail when someone trips on a rug or can\'t read a medicine bottle. I ground care in physical reality.' },
  'boundary-dissolution': { name: 'Boundary Dissolution', persona: 'I erase artificial borders. The patient is not the pathology, and your problem is not where you drew the line. When you distinguish identity from context, new pathways appear.' },
  'system-fractal': { name: 'System Fractal (Parts & Wholes)', persona: 'I zoom between the fractal part and the whole ecosystem. A joint does not heal in isolation from autonomic nervous balance, restorative sleep, and daily rituals.' },
  'feedback-loop': { name: 'Unseen Ties & Feedback Loops', persona: 'I trace invisible feedback loops and relational bridges. Pain creates fear, fear creates immobility; but trusted kinship breaks the cycle at the lowest friction point.' },
  'perspective-inversion': { name: 'Perspective Inversion', persona: 'I step into other shoes. When we look through the clinician\'s biomechanics, the patient\'s lived vulnerability, and the future self\'s joy, the true path becomes undeniable.' },
  'porters-five-forces': { name: 'Porter’s Five Forces & Competitive Moat', persona: 'I map the five structural forces pressing on your mission. I eliminate vendor lock-in, single-point bottlenecks, and generic commoditization before they erode your moat.' },
};

// Auth helper: supports both x-gemini-api-key header and Bearer token
function getAgentGenAI(req) {
  const bearerToken = req.headers.authorization?.replace('Bearer ', '');
  const headerKey = req.headers['x-gemini-api-key'];
  const customKey = bearerToken || headerKey;
  if (customKey) return new GoogleGenAI({ apiKey: customKey });
  return ai;
}

// GET /api/agents — List all available strategy agents
app.get('/api/agents', (req, res) => {
  const agents = Object.entries(STRATEGY_MAP).map(([id, s]) => ({
    id,
    name: s.name,
    persona: s.persona,
  }));
  res.json(agents);
});

// POST /api/agent/select — Meta-agent auto-strategy selection
app.post('/api/agent/select', [
  body('problem').isString().trim().notEmpty(),
  body('mode').optional().isString().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const targetModel = getModel(req);
    const genAI = getAgentGenAI(req);
    if (!genAI && !isLocalModel(targetModel)) {
      return res.status(500).json({ error: 'Gemini API is not configured. Please set your own API key in Settings or switch to a local model.' });
    }

    const { problem, mode } = req.body;
    const safetyCheck = checkPreFlightSafety(problem, req);
    if (safetyCheck) return res.status(safetyCheck.status).json(safetyCheck.json);

    const piiFound = scanForPII(problem);
    if (piiFound.length > 0) return res.status(400).json({ error: `Privacy Note: Identified personal details (${piiFound.join(', ')}). Please tidy details before proceeding.` });

    const strategyList = Object.entries(STRATEGY_MAP)
      .map(([id, s]) => `- ${id}: "${s.name}" — ${s.persona}`)
      .join('\n');

    const schema = {
      type: 'object',
      properties: {
        selectedIds: { type: 'array', items: { type: 'string' }, description: 'Array of 3-5 strategy IDs that are most relevant to this problem.' },
        reasoning: { type: 'string', description: 'A 2-3 sentence explanation of why these strategies were chosen together.' },
        problemCategory: { type: 'string', description: 'A short category label for this problem type (e.g., "systems design", "interpersonal", "clinical", "creative").' },
      },
      required: ['selectedIds', 'reasoning', 'problemCategory'],
    };

    const prompt = `
      You are a meta-cognitive strategist. Analyze the following problem and select the 3 to 5 lateral thinking strategies (from the list below) that will produce the most diverse, productive, and complementary insights.

      **Problem:** "${problem}"
      **Mode:** ${mode || 'creative'}

      **Available Strategies:**
      ${strategyList}

      Select strategies that complement each other — avoid redundancy. Prefer a mix of divergent (creative) and convergent (analytical) approaches.
    `;

    const { data: result, usage } = await generateJsonWithUsage({
      targetModel,
      genAI,
      prompt,
      schema,
      req,
    });
    // Validate that returned IDs are real
    const validIds = Array.isArray(result?.selectedIds) ? result.selectedIds.filter(id => STRATEGY_MAP[id]) : [];
    result.selectedIds = validIds.length > 0 ? validIds : ['what-if', 'fmea', 'critical-path'];
    attachUsageHeader(res, buildUsageReceipt({
      endpoint: '/api/agent/select',
      model: targetModel,
      req,
      usage,
    }));
    res.json(result);
  } catch (error) {
    console.error('Error in /api/agent/select:', error);
    res.status(500).json({ error: getCleanErrorMessage(error) });
  }
});

// POST /api/agent/debate — Cross-strategy debate round
app.post('/api/agent/debate', [
  body('problem').isString().trim().notEmpty(),
  body('insights').isArray().notEmpty(),
  body('strategies').isArray().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const targetModel = getModel(req);
    const genAI = getAgentGenAI(req);
    if (!genAI && !isLocalModel(targetModel)) {
      return res.status(500).json({ error: 'Gemini API is not configured. Please set your own API key in Settings or switch to a local model.' });
    }

    const { problem, insights, strategies } = req.body;

    const insightText = insights.flatMap(r =>
      (r.insights || []).map(i => `[${r.strategyName}]: ${i.text}`)
    ).join('\n');

    const agentList = strategies
      .map(s => `- "${s.name}" (${STRATEGY_MAP[s.id]?.persona || s.description})`)
      .join('\n');

    const schema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          agentId: { type: 'string', description: 'The strategy ID of the agent providing the critique.' },
          agentName: { type: 'string', description: 'The name of the critiquing agent.' },
          targetInsight: { type: 'string', description: 'The exact insight text being critiqued.' },
          critique: { type: 'string', description: 'The critique, question, or observation from this agent\'s perspective.' },
          strengthens: { type: 'boolean', description: 'True if this critique supports/strengthens the insight, false if it challenges it.' },
          suggestedRefinement: { type: 'string', description: 'An optional improved version of the insight incorporating this critique.' },
        },
        required: ['agentId', 'agentName', 'targetInsight', 'critique', 'strengthens'],
      },
    };

    const prompt = `
      You are moderating a debate between multiple lateral thinking strategy agents. Each agent has a distinct personality and analytical lens.

      **Problem context:** "${problem}"

      **Participating agents:**
      ${agentList}

      **Insights generated so far:**
      ${insightText}

      **Task:** Each agent should critically evaluate 1-2 insights from OTHER agents (not their own). For each critique:
      1. Stay in character — use the agent's unique lens and persona.
      2. Either strengthen the insight (identify hidden value) or challenge it (identify blind spots).
      3. Optionally suggest a refined version that incorporates the critique.

      Generate 4-8 total debate entries across the agents.
    `;

    const { data: result, usage } = await generateJsonWithUsage({
      targetModel,
      genAI,
      prompt,
      schema,
      req,
      schemaOptions: { minItems: 2 },
    });

    attachUsageHeader(res, buildUsageReceipt({
      endpoint: '/api/agent/debate',
      model: targetModel,
      req,
      usage,
    }));
    res.json(result);
  } catch (error) {
    console.error('Error in /api/agent/debate:', error);
    res.status(500).json({ error: getCleanErrorMessage(error) });
  }
});

// POST /api/agent/refine — Refinement and consensus synthesis
app.post('/api/agent/refine', [
  body('problem').isString().trim().notEmpty(),
  body('insights').isArray().notEmpty(),
  body('debates').isArray().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const targetModel = getModel(req);
    const genAI = getAgentGenAI(req);
    if (!genAI && !isLocalModel(targetModel)) {
      return res.status(500).json({ error: 'Gemini API is not configured. Please set your own API key in Settings or switch to a local model.' });
    }

    const { problem, insights, debates } = req.body;

    const insightText = insights.flatMap(r =>
      (r.insights || []).map(i => `- [${r.strategyName}]: ${i.text}`)
    ).join('\n');

    const debateText = debates.map(d =>
      `- [${d.agentName}] ${d.strengthens ? 'SUPPORTS' : 'CHALLENGES'} "${(d.targetInsight || '').substring(0, 80)}...": ${d.critique}`
    ).join('\n');

    const schema = {
      type: 'object',
      properties: {
        refinedInsights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              original: { type: 'string', description: 'The original insight text.' },
              refined: { type: 'string', description: 'The improved insight incorporating debate feedback.' },
              debateInfluences: { type: 'array', items: { type: 'string' }, description: 'Which critiques influenced this refinement.' },
              confidence: { type: 'number', description: 'Confidence score 0.0-1.0 based on agent agreement.' },
            },
            required: ['original', 'refined', 'debateInfluences', 'confidence'],
          },
        },
        consensus: { type: 'string', description: 'A 2-4 sentence synthesis statement capturing the strongest path forward, acknowledging remaining tensions.' },
        synthesisActionBridge: {
          type: 'object',
          description: 'A concrete closed-loop bridge reconciling the divergent provocations with grounding constraints.',
          properties: {
            divergentLeap: { type: 'string', description: 'The primary lateral breakthrough idea.' },
            groundingGuardrail: { type: 'string', description: 'The non-negotiable risk or dependency constraint that grounds the breakthrough.' },
            immediateTractionStep: { type: 'string', description: 'The immediate low-friction first action.' },
          },
          required: ['divergentLeap', 'groundingGuardrail', 'immediateTractionStep'],
        },
      },
      required: ['refinedInsights', 'consensus', 'synthesisActionBridge'],
    };

    const prompt = `
      You are a synthesis agent. Given the original insights and the cross-strategy debate that followed, produce improved versions of the most impactful insights.

      **Problem:** "${problem}"

      **Original Insights:**
      ${insightText}

      **Debate Critiques:**
      ${debateText}

      **Instructions:**
      1. Select the 3-5 most impactful insights (not all need refinement — skip any that are weak).
      2. For each, produce a refined version that incorporates valid critiques while preserving original strengths.
      3. Rate confidence (0.0-1.0): 1.0 = all agents agree, 0.5 = mixed, 0.0 = strongly contested.
      4. Write a consensus statement that captures the strongest path forward and any remaining open tensions.
      5. Provide a 'synthesisActionBridge' object that directly pairs the primary divergent leap with a grounding guardrail and an immediate first traction step.
    `;

    const { data: result, usage } = await generateJsonWithUsage({
      targetModel,
      genAI,
      prompt,
      schema,
      req,
    });

    attachUsageHeader(res, buildUsageReceipt({
      endpoint: '/api/agent/refine',
      model: targetModel,
      req,
      usage,
    }));
    res.json(result);
  } catch (error) {
    console.error('Error in /api/agent/refine:', error);
    res.status(500).json({ error: getCleanErrorMessage(error) });
  }
});

// POST /api/agent/pipeline — Full agentic pipeline (SSE-streamed phases)
app.post('/api/agent/pipeline', [
  body('problem').isString().trim().notEmpty(),
  body('mode').optional().isString().trim(),
  body('gist').optional().isString().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const targetModel = getModel(req);
    const genAI = getAgentGenAI(req);
    if (!genAI && !isLocalModel(targetModel)) {
      return res.status(500).json({ error: 'Gemini API is not configured. Please set your own API key in Settings or switch to a local model.' });
    }

    const { problem, mode, gist } = req.body;
    const safetyCheck = checkPreFlightSafety(problem, req) || checkPreFlightSafety(gist, req);
    if (safetyCheck) return res.status(safetyCheck.status).json(safetyCheck.json);

    const piiFound = scanForPII(problem);
    if (piiFound.length > 0) return res.status(400).json({ error: `Privacy Note: Identified personal details (${piiFound.join(', ')}). Please tidy details before proceeding.` });

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendPhase = (phase, data) => {
      res.write(`data: ${JSON.stringify({ phase, ...data })}\n\n`);
    };

    // Phase 1: Select strategies
    sendPhase('selecting', { message: 'Analyzing problem and selecting strategies...' });

    const strategyList = Object.entries(STRATEGY_MAP)
      .map(([id, s]) => `- ${id}: "${s.name}"`)
      .join('\n');

    const selectionSchema = {
      type: 'object',
      properties: {
        selectedIds: { type: 'array', items: { type: 'string' } },
        reasoning: { type: 'string' },
        problemCategory: { type: 'string' },
      },
      required: ['selectedIds', 'reasoning', 'problemCategory'],
    };

    const selectionRes = await generateJsonWithUsage({
      targetModel,
      genAI,
      prompt: `Analyze this problem and select 3-5 optimal strategies:\n"${problem}"\n\nAvailable:\n${strategyList}`,
      schema: selectionSchema,
      req,
      isPipeline: true,
    });
    const selection = selectionRes.data;
    const validSelectedIds = Array.isArray(selection?.selectedIds)
      ? selection.selectedIds.filter(id => STRATEGY_MAP[id])
      : [];
    selection.selectedIds = validSelectedIds.length > 0 ? validSelectedIds : ['what-if', 'fmea', 'critical-path'];
    sendPhase('selecting', { result: selection });

    // Phase 2: Generate insights with selected strategies
    sendPhase('generating', { message: 'Generating insights with selected strategies...' });

    const selectedStrategies = selection.selectedIds.map(id => ({
      id,
      name: STRATEGY_MAP[id].name,
      persona: STRATEGY_MAP[id].persona,
    }));

    const strategyText = selectedStrategies.map(s =>
      `- Strategy Name: "${s.name}"\n  Persona: ${s.persona}`
    ).join('\n\n');

    const insightsSchema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          strategyName: { type: 'string' },
          insights: {
            type: 'array',
            items: {
              type: 'object',
              properties: { text: { type: 'string' } },
              required: ['text'],
            },
          },
        },
        required: ['strategyName', 'insights'],
      },
    };

    const initialInsightsRes = await generateJsonWithUsage({
      targetModel,
      genAI,
      prompt: `${gist ? `Guiding principle: "${gist}"\n\n` : ''}Problem: "${problem}"\n\nApply each strategy:\n${strategyText}\n\nFor each, provide 2-3 specific, practical, and realistic insights that are genuinely doable without sci-fi or over-the-top gimmicks.`,
      systemInstruction: mode === 'care' ? HIPAA_SYSTEM_INSTRUCTION : CIVIC_NEUTRALITY_INSTRUCTION,
      schema: insightsSchema,
      req,
      schemaOptions: { minItems: selectedStrategies.length, itemArrayMinItems: 2 },
      isPipeline: true,
    });
    const initialInsights = initialInsightsRes.data;
    sendPhase('generating', { result: initialInsights });

    // Phase 3: Debate
    sendPhase('debating', { message: 'Strategy agents are debating insights...' });

    const insightTextForDebate = (Array.isArray(initialInsights) ? initialInsights : []).flatMap(r =>
      (r.insights || []).map(i => `[${r.strategyName}]: ${i.text}`)
    ).join('\n');

    const debateSchema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          agentId: { type: 'string' },
          agentName: { type: 'string' },
          targetInsight: { type: 'string' },
          critique: { type: 'string' },
          strengthens: { type: 'boolean' },
          suggestedRefinement: { type: 'string' },
        },
        required: ['agentId', 'agentName', 'targetInsight', 'critique', 'strengthens'],
      },
    };

    const debatesRes = await generateJsonWithUsage({
      targetModel,
      genAI,
      prompt: `Problem: "${problem}"\n\nAgents:\n${selectedStrategies.map(s => `- "${s.name}": ${s.persona}`).join('\n')}\n\nInsights:\n${insightTextForDebate}\n\nEach agent critiques 1-2 insights from OTHER agents. Generate 4-8 debate entries.`,
      schema: debateSchema,
      req,
      schemaOptions: { minItems: 2 },
      isPipeline: true,
    });
    const debates = debatesRes.data;
    sendPhase('debating', { result: debates });

    // Phase 4: Refine
    sendPhase('refining', { message: 'Synthesizing refined insights...' });

    const debateTextForRefine = (Array.isArray(debates) ? debates : []).map(d =>
      `[${d.agentName}] ${d.strengthens ? 'SUPPORTS' : 'CHALLENGES'}: ${d.critique}`
    ).join('\n');

    const refineSchema = {
      type: 'object',
      properties: {
        refinedInsights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              original: { type: 'string' },
              refined: { type: 'string' },
              debateInfluences: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'number' },
            },
            required: ['original', 'refined', 'debateInfluences', 'confidence'],
          },
        },
        consensus: { type: 'string' },
        synthesisActionBridge: {
          type: 'object',
          description: 'A concrete closed-loop bridge reconciling the divergent provocations with grounding constraints.',
          properties: {
            divergentLeap: { type: 'string' },
            groundingGuardrail: { type: 'string' },
            immediateTractionStep: { type: 'string' },
          },
          required: ['divergentLeap', 'groundingGuardrail', 'immediateTractionStep'],
        },
      },
      required: ['refinedInsights', 'consensus', 'synthesisActionBridge'],
    };

    const refinementRes = await generateJsonWithUsage({
      targetModel,
      genAI,
      prompt: `Problem: "${problem}"\n\nOriginal Insights:\n${insightTextForDebate}\n\nDebate:\n${debateTextForRefine}\n\nProduce 3-5 refined insights with confidence scores, a consensus statement, and a synthesisActionBridge connecting the divergent leap to a grounding guardrail and immediate first traction step.`,
      schema: refineSchema,
      req,
      isPipeline: true,
    });
    const refinement = refinementRes.data;
    sendPhase('refining', { result: refinement });

    const toPhaseUsage = (phase, u) => ({
      phase,
      inputTokens: u.inputTokens,
      outputTokens: u.outputTokens,
      thoughtTokens: u.thoughtTokens,
      cachedTokens: u.cachedTokens,
      totalTokens: u.totalTokens,
      estimatedCostUsd: estimateUsageCostUsd(targetModel, u),
      estimated: u.estimated,
    });
    const phases = [
      toPhaseUsage('selecting', selectionRes.usage),
      toPhaseUsage('generating', initialInsightsRes.usage),
      toPhaseUsage('debating', debatesRes.usage),
      toPhaseUsage('refining', refinementRes.usage),
    ];
    const rolledUpUsage = phases.reduce(
      (acc, p) => ({
        inputTokens: acc.inputTokens + p.inputTokens,
        outputTokens: acc.outputTokens + p.outputTokens,
        thoughtTokens: acc.thoughtTokens + p.thoughtTokens,
        cachedTokens: acc.cachedTokens + p.cachedTokens,
        totalTokens: acc.totalTokens + p.totalTokens,
        estimated: acc.estimated || p.estimated,
      }),
      { inputTokens: 0, outputTokens: 0, thoughtTokens: 0, cachedTokens: 0, totalTokens: 0, estimated: false }
    );
    const pipelineReceipt = buildUsageReceipt({
      endpoint: '/api/agent/pipeline',
      model: targetModel,
      req,
      usage: rolledUpUsage,
      thinkingLevel: getGenerationConfig(req, targetModel, { isPipeline: true })?.thinking_level,
      callCount: 4,
      phases,
    });

    // Phase 5: Complete
    sendPhase('complete', {
      result: {
        selection,
        initialInsights,
        debate: debates,
        refinedInsights: refinement.refinedInsights,
        consensus: refinement.consensus,
        synthesisActionBridge: refinement.synthesisActionBridge,
      },
      usage: pipelineReceipt,
    });

    res.write(`data: ${JSON.stringify({ usage: pipelineReceipt })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Error in /api/agent/pipeline:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: getCleanErrorMessage(error) });
    } else {
      res.write(`data: ${JSON.stringify({ error: getCleanErrorMessage(error) })}\n\n`);
      res.end();
    }
  }
});

// POST /api/agent/:strategyId — Standalone single-agent endpoint
app.post('/api/agent/:strategyId', [
  body('problem').isString().trim().notEmpty(),
  body('mode').optional().isString().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { strategyId } = req.params;
    const strategy = STRATEGY_MAP[strategyId];
    if (!strategy) return res.status(404).json({ error: `Unknown strategy: ${strategyId}` });

    const targetModel = getModel(req);
    const genAI = getAgentGenAI(req);
    if (!genAI && !isLocalModel(targetModel)) {
      return res.status(500).json({ error: 'Gemini API is not configured. Please set your own API key in Settings or switch to a local model.' });
    }

    const { problem, mode } = req.body;
    const safetyCheck = checkPreFlightSafety(problem, req);
    if (safetyCheck) return res.status(safetyCheck.status).json(safetyCheck.json);

    const piiFound = scanForPII(problem);
    if (piiFound.length > 0) return res.status(400).json({ error: `Privacy Note: Identified personal details (${piiFound.join(', ')}). Please tidy details before proceeding.` });

    const schema = {
      type: 'object',
      properties: {
        strategyName: { type: 'string' },
        agentPersona: { type: 'string' },
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'A distinct, actionable insight.' },
            },
            required: ['text'],
          },
        },
      },
      required: ['strategyName', 'agentPersona', 'insights'],
    };

    const prompt = `
      You are the "${strategy.name}" strategy agent.
      Your persona: "${strategy.persona}"

      Apply your unique analytical lens to this problem:
      "${problem}"

      Provide 2-3 specific, practical, and realistic insights. Keep your ideas grounded in real-world feasibility—avoid sci-fi or over-the-top gimmicks, and translate your perspective into sensible steps someone can actually do.
    `;

    const { data: result, usage } = await generateJsonWithUsage({
      targetModel,
      genAI,
      prompt,
      systemInstruction: mode === 'care' ? HIPAA_SYSTEM_INSTRUCTION : CIVIC_NEUTRALITY_INSTRUCTION,
      schema,
      req,
    });

    attachUsageHeader(res, buildUsageReceipt({
      endpoint: `/api/agent/${strategyId}`,
      model: targetModel,
      req,
      usage,
    }));
    res.json(result);
  } catch (error) {
    console.error('Error in /api/agent/%s:', req.params.strategyId, error);
    res.status(500).json({ error: getCleanErrorMessage(error) });
  }
});

// ─── Health & Readiness Probes (99% Uptime SLA) ─────────────────────────────
const SERVER_START_MS = Date.now();

app.get(['/health', '/healthz'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'insight-spark-server',
    uptime_seconds: Math.round((Date.now() - SERVER_START_MS) / 1000),
    sla_target: '99.0%',
    memory_usage_mb: Math.round(process.memoryUsage().rss / 1024 / 1024)
  });
});

app.get('/readyz', (req, res) => {
  res.status(200).send('ready');
});

// Serve Angular static files with caching headers
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1y',
  immutable: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.webmanifest') || filePath.endsWith('.xml') || filePath.endsWith('.txt')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Health and readiness probes for 99% SLA uptime
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get('/readyz', (req, res) => {
  res.status(200).json({ status: 'ready', hasApiKey: !!apiKey, defaultModel: DEFAULT_MODEL });
});

// Static legal & meta file routing
app.get('/robots.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'robots.txt'));
});
app.get('/llms.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'llms.txt'));
});
app.get('/sitemap.xml', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'sitemap.xml'));
});
app.get(['/terms', '/terms.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'terms.html'));
});
app.get(['/privacy', '/privacy.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'privacy.html'));
});
app.get(['/transparency', '/transparency.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'transparency.html'));
});

// Route all other requests to index.html to support Angular routing
app.get('{/*any}', (req, res) => {
  if (path.extname(req.path)) {
    return res.status(404).end();
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  prewarmLocalModel('pivotpulse');
});
