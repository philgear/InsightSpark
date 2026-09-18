import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import compression from 'compression';

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
app.use(compression());
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
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://orcid.org", "https://*.orcid.org"],
      connectSrc: ["'self'", "https://fonts.gstatic.com", "https://fonts.googleapis.com", "https://orcid.org", "https://*.orcid.org"],
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
app.use((req, res, next) => {
  res.removeHeader('X-Frame-Options');
  next();
});
app.use(cors());
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
const apiKey = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

function getModel(req) {
  return req?.headers?.['x-gemini-model'] || req?.body?.model || DEFAULT_MODEL;
}

function getTemperature(req, defaultTemp = 0.7) {
  const customTemp = req?.headers?.['x-gemini-temperature'] || req?.body?.temperature;
  if (customTemp !== undefined && customTemp !== null && !isNaN(Number(customTemp))) {
    const parsed = Number(customTemp);
    return Math.max(0.0, Math.min(2.0, parsed));
  }
  return defaultTemp;
}

function getThinkingConfig(req) {
  const thinkingBudget = req?.headers?.['x-gemini-thinking-budget'] || req?.body?.thinkingBudget;
  if (thinkingBudget !== undefined && thinkingBudget !== null && !isNaN(Number(thinkingBudget))) {
    const budget = Number(thinkingBudget);
    if (budget > 0) {
      return { thinkingConfig: { thinkingBudget: budget } };
    } else if (budget === 0) {
      return { thinkingConfig: { thinkingBudget: 0 } };
    }
  }
  return {};
}

function formatContents(prompt, image) {
  if (!image || typeof image !== 'object' || !image.data || !image.mimeType) {
    return prompt;
  }
  return [
    {
      inlineData: {
        mimeType: image.mimeType,
        data: image.data,
      },
    },
    prompt,
  ];
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
  console.warn('WARNING: GEMINI_API_KEY environment variable is not set. API endpoints will fail.');
} else {
  ai = new GoogleGenAI({ apiKey });
}

const HIPAA_SYSTEM_INSTRUCTION = `
You are a compassionate, knowledgeable, and HIPAA-compliant care support AI partner. Your primary function is to provide creative and supportive insights for an individual's care based on a de-identified health goal. 

Your core principles are:
1.  **Person-Centricity:** Every response must be framed with the individual's well-being, dignity, and understanding as the top priority.
2.  **Positive Psychology & PERMA+H:** Use encouraging, hopeful, and empowering language. Anchor in signature character strengths (VIA Strengths) and Learned Optimism (ABCDE reframing). Focus on micro-masteries, emotional vitality, and agency.
3.  **Kinship Mesh & Caregiver Respite:** Support intergenerational circles (children, parents, grandparents, chosen family). Protect against caregiver burnout by designing co-activities that offload the primary caregiver, accommodating missing or strained family links through found kinship, and adapting to cognitive decline with sensory, music, and tactile bridges.
4.  **Simplicity and Clarity:** Explain concepts in simple, jargon-free terms that an individual or their family can easily understand.
5.  **Actionable Advice:** Insights should be practical and suggest concrete, manageable steps.

Direct Preference Optimization (DPO) Alignment Rubric:
- PREFER (Chosen): Asset-based inquiry, environmental micro-adaptations, caregiver respite, questions to empower the patient in clinical visits, actionable hope.
- REJECT (Penalized): Prescriptive medical diagnosis, pathologizing deficit language ("patient failed to..."), overwhelming checklists, fear-based motivation.

Crucial Safety Instruction:
Under no circumstances should you ever repeat, store, or include any Personally Identifiable Information (PII) such as names, dates, addresses, or specific identifiers in your response. Your output must be completely anonymous and focused solely on the abstract health challenge.
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

// Pre-flight safety interceptor for acute medical and crisis distress
function checkPreFlightSafety(text, req = null) {
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

const SAFETY_SETTINGS = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_CIVIC_INTEGRITY',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  }
];

function isLocalModel(model) {
  return typeof model === 'string' && (model.startsWith('ollama:') || model.startsWith('local:'));
}

async function streamFromLocalOllama(modelName, prompt, systemInstruction, res) {
  const localModel = modelName.replace(/^(ollama:|local:)/, '');
  const ollamaUrl = process.env.OLLAMA_HOST || 'http://localhost:11434';
  
  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: localModel,
      prompt: `${systemInstruction ? systemInstruction + '\n\n' : ''}${prompt}`,
      format: 'json',
      stream: true
    })
  });

  if (!response.ok) {
    throw new Error(`Local Ollama error (${response.status}): Make sure 'ollama serve' is running with model '${localModel}'.`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.response) {
          res.write(`data: ${JSON.stringify({ text: parsed.response })}\n\n`);
        }
      } catch (e) {
        // ignore incomplete JSON fragment
      }
    }
  }
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
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    orcidClientId: process.env.ORCID_CLIENT_ID || null
  });
});

app.get('/api/local-llm/status', async (req, res) => {
  try {
    const ollamaUrl = process.env.OLLAMA_HOST || 'http://localhost:11434';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const response = await fetch(`${ollamaUrl}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    if (response.ok) {
      const data = await response.json();
      return res.json({ available: true, models: data.models || [] });
    }
  } catch (e) {
    // Ollama not currently running on user's device
  }
  return res.json({ available: false, models: [] });
});

app.post('/api/auth/orcid', async (req, res) => {
  try {
    const { code, redirectUri } = req.body || {};
    if (!code || typeof code !== 'string' || !code.trim() ||
        !redirectUri || typeof redirectUri !== 'string' || !redirectUri.trim()) {
      return res.status(400).json({ error: 'Missing or invalid "code" or "redirectUri" in request body.' });
    }

    const clientId = process.env.ORCID_CLIENT_ID?.trim();
    const clientSecret = process.env.ORCID_CLIENT_SECRET?.trim();

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'ORCID client credentials are not configured on the server.' });
    }

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);

    const tokenResponse = await fetch('https://orcid.org/oauth/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('ORCID OAuth token exchange failed:', data);
      return res.status(tokenResponse.status).json({ error: data.error_description || data.error || 'Failed to exchange ORCID authorization code.' });
    }

    res.json({
      orcid: data.orcid,
      name: data.name,
      accessToken: data.access_token
    });
  } catch (error) {
    console.error('Error in /api/auth/orcid:', error);
    res.status(500).json({ error: getCleanErrorMessage(error) });
  }
});

// API Endpoints
app.post('/api/structure', [
  body('problem').isString().trim().escape().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customApiKey = req.headers['x-gemini-api-key'];
    const genAI = customApiKey ? new GoogleGenAI({ apiKey: customApiKey }) : ai;
    if (!genAI) {
      return res.status(500).json({ error: 'Gemini API is not configured. Please set your own API key in Settings or contact the administrator.' });
    }
    const { problem } = req.body;

    const safetyCheck = checkPreFlightSafety(problem, req);
    if (safetyCheck) return res.status(safetyCheck.status).json(safetyCheck.json);

    const piiFound = scanForPII(problem);
    if (piiFound.length > 0) {
      return res.status(400).json({ error: `Privacy Note: Identified potential personal details (${piiFound.join(', ')}). To protect privacy, please tidy these details or use the one-click tidy button.` });
    }
    
    const schema = {
        type: Type.OBJECT,
        properties: {
          title: { 
            type: Type.STRING, 
            description: 'A concise, 3-5 word title for this health goal. Example: "Managing Post-Op Knee Pain".'
          },
          condition: {
            type: Type.STRING,
            description: "The primary health condition being addressed, stated in simple terms. Example: 'Post-operative recovery from knee surgery'."
          },
          goal: {
            type: Type.STRING,
            description: "The main desired outcome or goal for the person. Example: 'To achieve 90 degrees of knee flexion and walk 100 feet without assistance within 2 weeks'."
          },
          barriers: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 2-3 potential barriers or challenges to achieving the goal, as identified from the input. Example: ['Fear of movement', 'Limited access to physical therapy', 'History of slow healing']."
          }
        },
        required: ['title', 'condition', 'goal', 'barriers']
    };

    const prompt = `
        Analyze the following de-identified health goal. Your task is to chunk the information into a structured JSON object.

        **Health Goal Input:**
        "${problem}"

        **Instructions:**
        - Identify the core components of the goal.
        - Populate the JSON object according to the schema.
        - The 'title' should be very short and serve as a quick summary.
        - The 'condition', 'goal', and 'barriers' should be extracted or inferred from the input text.
        - Ensure the output is clean, concise, and uses person-centered, accessible language.
        ${getLanguageInstruction(req)}
    `;

    const response = await genAI.models.generateContent({
        model: getModel(req),
        contents: formatContents(prompt, req.body.image),
        config: {
          systemInstruction: HIPAA_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: getTemperature(req, 0.2),
          safetySettings: SAFETY_SETTINGS,
          ...getThinkingConfig(req)
        }
    });

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error('Error in /api/structure:', error);
    res.status(500).json({ error: getCleanErrorMessage(error) });
  }
});

app.post('/api/insights', [
  body('problem').isString().trim().escape().notEmpty(),
  body('strategies').isArray().notEmpty(),
  body('mode').optional().isString().trim().escape(),
  body('gist').optional().isString().trim().escape(),
  body('healthSnapshot').optional().isString().trim().escape(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customApiKey = req.headers['x-gemini-api-key'];
    const genAI = customApiKey ? new GoogleGenAI({ apiKey: customApiKey }) : ai;
    if (!genAI) {
      return res.status(500).json({ error: 'Gemini API is not configured. Please set your own API key in Settings or contact the administrator.' });
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
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          strategyName: { type: Type.STRING },
          insights: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: {
                  type: Type.STRING,
                  description: 'The creative insight or idea.'
                },
                ...(mode === 'care' && {
                  influence: {
                    type: Type.STRING,
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
      return `- Strategy Name: "${name}"\n  Description: ${description}`;
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

      For each strategy, provide 2 to 3 distinct, specific, and actionable insights or ideas.
      Ensure the insights are written in clear, simple language, avoiding jargon to be accessible to a wide audience.
      
      ${mode === 'care' ? `
      IMPORTANT: For each insight, you MUST also provide a brief summary of its supportive impact on the person's well-being, as described in the JSON schema.
      ` : ''}
      
      Return the output strictly as a JSON array of objects, with one object for each strategy, matching the schema.
      ${getLanguageInstruction(req)}
    `;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const targetModel = getModel(req);
    const systemInstruction = mode === 'care' ? HIPAA_SYSTEM_INSTRUCTION : undefined;

    if (isLocalModel(targetModel)) {
      await streamFromLocalOllama(targetModel, prompt, systemInstruction, res);
    } else {
      const responseStream = await genAI.models.generateContentStream({
          model: targetModel,
          contents: formatContents(prompt, req.body.image),
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: insightsSchema,
            temperature: getTemperature(req, 0.8),
            safetySettings: SAFETY_SETTINGS,
            ...getThinkingConfig(req)
          }
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }
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
  body('problem').isString().trim().escape().notEmpty(),
  body('insights').isArray().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customApiKey = req.headers['x-gemini-api-key'];
    const genAI = customApiKey ? new GoogleGenAI({ apiKey: customApiKey }) : ai;
    if (!genAI) {
      return res.status(500).json({ error: 'Gemini API is not configured. Please set your own API key in Settings or contact the administrator.' });
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
      type: Type.OBJECT,
      properties: {
          personGoal: { type: Type.STRING, description: "A concise summary of the primary person's goal, stated in a positive and empowering way." },
          keyInterventions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2-3 key interventions or actions for the support plan." },
          monitoringPlan: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2-3 items for the person or supporter to monitor." },
          guidanceAndEducation: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2-3 educational points for the person, explained simply." },
          positiveAchievements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2-3 encouraging achievements or potential milestones to celebrate and motivate the person." },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2-3 next-step recommendations for the supporter or person, framed positively." },
          transitionChecklist: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2-3 critical transition closure checks (e.g. 72h post-acute/stage-change handoffs, medication reconciliation, hazard checks)." },
          respiteClosureChecklist: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2-3 weekly caregiver respite safeguards and handoff checkpoints to ensure primary caregiver relief." }
      },
      required: ["personGoal", "keyInterventions", "monitoringPlan", "guidanceAndEducation", "positiveAchievements", "recommendations", "transitionChecklist", "respiteClosureChecklist"]
    };

    const insightText = insights.map(i => `- ${i.text}`).join('\n');

    const prompt = `
        Your task is to synthesize an actionable support plan based on a primary health goal and a set of key insights. Adhere strictly to your core principles of being person-centric, positive, simple, and actionable.

        **Primary Health Goal:**
        "${problem}"

        **Key Insights to Incorporate:**
        ${insightText}

        **Instructions:**
        Generate a JSON object that strictly follows the provided schema.
        - Each section must contain concise, positive, and actionable items.
        - "positiveAchievements" should highlight milestones to celebrate and motivate the person.
        - "recommendations" should propose supportive next steps.
        - "transitionChecklist" should outline 2-3 critical checks to safely close the transition period (e.g., 72-hour hospital-to-home, new mobility milestone, medication alignment).
        - "respiteClosureChecklist" should identify 2-3 non-negotiable weekly respite checkpoints ensuring the primary caregiver receives dedicated guilt-free relief.
        - All text must be easily understood by individuals and their families, avoiding clinical jargon.
        ${getLanguageInstruction(req)}
      `;

    const response = await genAI.models.generateContent({
        model: getModel(req),
        contents: prompt,
        config: {
          systemInstruction: HIPAA_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: carePlanSchema,
          temperature: getTemperature(req, 0.6),
          safetySettings: SAFETY_SETTINGS,
          ...getThinkingConfig(req)
        }
    });

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error('Error in /api/care-plan:', error);
    res.status(500).json({ error: getCleanErrorMessage(error) });
  }
});

app.post('/api/creative-plan', [
  body('problem').isString().trim().escape().notEmpty(),
  body('insights').isArray().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customApiKey = req.headers['x-gemini-api-key'];
    const genAI = customApiKey ? new GoogleGenAI({ apiKey: customApiKey }) : ai;
    if (!genAI) {
      return res.status(500).json({ error: 'Gemini API is not configured. Please set your own API key in Settings or contact the administrator.' });
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
      type: Type.OBJECT,
      properties: {
          conceptualGoal: { type: Type.STRING, description: "A concise summary of the primary conceptual goal of this action plan." },
          criticalPath: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Sequential, numbered steps representing the critical implementation path." },
          riskAssessment: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of key failure modes, bottlenecks, or constraints to look out for." },
          requiredResources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Essential tools, skills, team members, or other dependencies needed." },
          milestones: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key milestones or measurable checkpoints to track progress." },
          nextSteps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Immediate logical next steps or actions to execute right away." }
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

    const response = await genAI.models.generateContent({
        model: getModel(req),
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: creativePlanSchema,
          temperature: getTemperature(req, 0.5),
          safetySettings: SAFETY_SETTINGS,
          ...getThinkingConfig(req)
        }
    });

    res.json(JSON.parse(response.text));
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

    const customApiKey = req.headers['x-gemini-api-key'];
    const genAI = customApiKey ? new GoogleGenAI({ apiKey: customApiKey }) : ai;
    if (!genAI) {
      return res.status(500).json({ error: 'Gemini API is not configured. Please set your own API key in Settings or contact the administrator.' });
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

    const config = {
      temperature: 0.2,
      safetySettings: SAFETY_SETTINGS,
      ...(isJson ? { responseMimeType: 'application/json' } : {}),
      ...getThinkingConfig(req)
    };

    const response = await genAI.models.generateContent({
      model: getModel(req),
      contents: prompt,
      config
    });

    if (isJson) {
      try {
        return res.json({ translated: JSON.parse(response.text) });
      } catch {
        return res.json({ translatedText: response.text });
      }
    }

    res.json({ translatedText: response.text.trim() });
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
  body('problem').isString().trim().escape().notEmpty(),
  body('mode').optional().isString().trim().escape(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const genAI = getAgentGenAI(req);
    if (!genAI) return res.status(500).json({ error: 'Gemini API is not configured.' });

    const { problem, mode } = req.body;
    const safetyCheck = checkPreFlightSafety(problem, req);
    if (safetyCheck) return res.status(safetyCheck.status).json(safetyCheck.json);

    const piiFound = scanForPII(problem);
    if (piiFound.length > 0) return res.status(400).json({ error: `Privacy Note: Identified personal details (${piiFound.join(', ')}). Please tidy details before proceeding.` });

    const strategyList = Object.entries(STRATEGY_MAP)
      .map(([id, s]) => `- ${id}: "${s.name}" — ${s.persona}`)
      .join('\n');

    const schema = {
      type: Type.OBJECT,
      properties: {
        selectedIds: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Array of 3-5 strategy IDs that are most relevant to this problem.' },
        reasoning: { type: Type.STRING, description: 'A 2-3 sentence explanation of why these strategies were chosen together.' },
        problemCategory: { type: Type.STRING, description: 'A short category label for this problem type (e.g., "systems design", "interpersonal", "clinical", "creative").' },
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

    const response = await genAI.models.generateContent({
      model: getModel(req),
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.4,
        safetySettings: SAFETY_SETTINGS,
      },
    });

    const result = JSON.parse(response.text);
    // Validate that returned IDs are real
    result.selectedIds = result.selectedIds.filter(id => STRATEGY_MAP[id]);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/agent/select:', error);
    res.status(500).json({ error: getCleanErrorMessage(error) });
  }
});

// POST /api/agent/debate — Cross-strategy debate round
app.post('/api/agent/debate', [
  body('problem').isString().trim().escape().notEmpty(),
  body('insights').isArray().notEmpty(),
  body('strategies').isArray().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const genAI = getAgentGenAI(req);
    if (!genAI) return res.status(500).json({ error: 'Gemini API is not configured.' });

    const { problem, insights, strategies } = req.body;

    const insightText = insights.flatMap(r =>
      (r.insights || []).map(i => `[${r.strategyName}]: ${i.text}`)
    ).join('\n');

    const agentList = strategies
      .map(s => `- "${s.name}" (${STRATEGY_MAP[s.id]?.persona || s.description})`)
      .join('\n');

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          agentId: { type: Type.STRING, description: 'The strategy ID of the agent providing the critique.' },
          agentName: { type: Type.STRING, description: 'The name of the critiquing agent.' },
          targetInsight: { type: Type.STRING, description: 'The exact insight text being critiqued.' },
          critique: { type: Type.STRING, description: 'The critique, question, or observation from this agent\'s perspective.' },
          strengthens: { type: Type.BOOLEAN, description: 'True if this critique supports/strengthens the insight, false if it challenges it.' },
          suggestedRefinement: { type: Type.STRING, description: 'An optional improved version of the insight incorporating this critique.' },
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

    const response = await genAI.models.generateContent({
      model: getModel(req),
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.7,
        safetySettings: SAFETY_SETTINGS,
      },
    });

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error('Error in /api/agent/debate:', error);
    res.status(500).json({ error: getCleanErrorMessage(error) });
  }
});

// POST /api/agent/refine — Refinement and consensus synthesis
app.post('/api/agent/refine', [
  body('problem').isString().trim().escape().notEmpty(),
  body('insights').isArray().notEmpty(),
  body('debates').isArray().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const genAI = getAgentGenAI(req);
    if (!genAI) return res.status(500).json({ error: 'Gemini API is not configured.' });

    const { problem, insights, debates } = req.body;

    const insightText = insights.flatMap(r =>
      (r.insights || []).map(i => `- [${r.strategyName}]: ${i.text}`)
    ).join('\n');

    const debateText = debates.map(d =>
      `- [${d.agentName}] ${d.strengthens ? 'SUPPORTS' : 'CHALLENGES'} "${d.targetInsight.substring(0, 80)}...": ${d.critique}`
    ).join('\n');

    const schema = {
      type: Type.OBJECT,
      properties: {
        refinedInsights: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              original: { type: Type.STRING, description: 'The original insight text.' },
              refined: { type: Type.STRING, description: 'The improved insight incorporating debate feedback.' },
              debateInfluences: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Which critiques influenced this refinement.' },
              confidence: { type: Type.NUMBER, description: 'Confidence score 0.0-1.0 based on agent agreement.' },
            },
            required: ['original', 'refined', 'debateInfluences', 'confidence'],
          },
        },
        consensus: { type: Type.STRING, description: 'A 2-4 sentence synthesis statement capturing the strongest path forward, acknowledging remaining tensions.' },
        synthesisActionBridge: {
          type: Type.OBJECT,
          description: 'A concrete closed-loop bridge reconciling the divergent provocations with grounding constraints.',
          properties: {
            divergentLeap: { type: Type.STRING, description: 'The primary lateral breakthrough idea.' },
            groundingGuardrail: { type: Type.STRING, description: 'The non-negotiable risk or dependency constraint that grounds the breakthrough.' },
            immediateTractionStep: { type: Type.STRING, description: 'The immediate low-friction first action.' },
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

    const response = await genAI.models.generateContent({
      model: getModel(req),
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.5,
        safetySettings: SAFETY_SETTINGS,
        ...getThinkingConfig(req)
      },
    });

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error('Error in /api/agent/refine:', error);
    res.status(500).json({ error: getCleanErrorMessage(error) });
  }
});

// POST /api/agent/pipeline — Full agentic pipeline (SSE-streamed phases)
app.post('/api/agent/pipeline', [
  body('problem').isString().trim().escape().notEmpty(),
  body('mode').optional().isString().trim().escape(),
  body('gist').optional().isString().trim().escape(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const genAI = getAgentGenAI(req);
    if (!genAI) return res.status(500).json({ error: 'Gemini API is not configured.' });

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

    const selectResponse = await genAI.models.generateContent({
      model: getModel(req),
      contents: `Analyze this problem and select 3-5 optimal strategies:\n"${problem}"\n\nAvailable:\n${strategyList}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            selectedIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            reasoning: { type: Type.STRING },
            problemCategory: { type: Type.STRING },
          },
          required: ['selectedIds', 'reasoning', 'problemCategory'],
        },
        temperature: 0.4,
        safetySettings: SAFETY_SETTINGS,
      },
    });

    const selection = JSON.parse(selectResponse.text);
    selection.selectedIds = selection.selectedIds.filter(id => STRATEGY_MAP[id]);
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
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          strategyName: { type: Type.STRING },
          insights: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { text: { type: Type.STRING } },
              required: ['text'],
            },
          },
        },
        required: ['strategyName', 'insights'],
      },
    };

    const insightsResponse = await genAI.models.generateContent({
      model: getModel(req),
      contents: `${gist ? `Guiding principle: "${gist}"\n\n` : ''}Problem: "${problem}"\n\nApply each strategy:\n${strategyText}\n\nFor each, provide 2-3 distinct, actionable insights.`,
      config: {
        systemInstruction: mode === 'care' ? HIPAA_SYSTEM_INSTRUCTION : undefined,
        responseMimeType: 'application/json',
        responseSchema: insightsSchema,
        temperature: 0.8,
        safetySettings: SAFETY_SETTINGS,
      },
    });

    const initialInsights = JSON.parse(insightsResponse.text);
    sendPhase('generating', { result: initialInsights });

    // Phase 3: Debate
    sendPhase('debating', { message: 'Strategy agents are debating insights...' });

    const insightTextForDebate = initialInsights.flatMap(r =>
      (r.insights || []).map(i => `[${r.strategyName}]: ${i.text}`)
    ).join('\n');

    const debateResponse = await genAI.models.generateContent({
      model: getModel(req),
      contents: `Problem: "${problem}"\n\nAgents:\n${selectedStrategies.map(s => `- "${s.name}": ${s.persona}`).join('\n')}\n\nInsights:\n${insightTextForDebate}\n\nEach agent critiques 1-2 insights from OTHER agents. Generate 4-8 debate entries.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              agentId: { type: Type.STRING },
              agentName: { type: Type.STRING },
              targetInsight: { type: Type.STRING },
              critique: { type: Type.STRING },
              strengthens: { type: Type.BOOLEAN },
              suggestedRefinement: { type: Type.STRING },
            },
            required: ['agentId', 'agentName', 'targetInsight', 'critique', 'strengthens'],
          },
        },
        temperature: 0.7,
        safetySettings: SAFETY_SETTINGS,
      },
    });

    const debates = JSON.parse(debateResponse.text);
    sendPhase('debating', { result: debates });

    // Phase 4: Refine
    sendPhase('refining', { message: 'Synthesizing refined insights...' });

    const debateTextForRefine = debates.map(d =>
      `[${d.agentName}] ${d.strengthens ? 'SUPPORTS' : 'CHALLENGES'}: ${d.critique}`
    ).join('\n');

    const refineResponse = await genAI.models.generateContent({
      model: getModel(req),
      contents: `Problem: "${problem}"\n\nOriginal Insights:\n${insightTextForDebate}\n\nDebate:\n${debateTextForRefine}\n\nProduce 3-5 refined insights with confidence scores, a consensus statement, and a synthesisActionBridge connecting the divergent leap to a grounding guardrail and immediate first traction step.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            refinedInsights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  refined: { type: Type.STRING },
                  debateInfluences: { type: Type.ARRAY, items: { type: Type.STRING } },
                  confidence: { type: Type.NUMBER },
                },
                required: ['original', 'refined', 'debateInfluences', 'confidence'],
              },
            },
            consensus: { type: Type.STRING },
            synthesisActionBridge: {
              type: Type.OBJECT,
              description: 'A concrete closed-loop bridge reconciling the divergent provocations with grounding constraints.',
              properties: {
                divergentLeap: { type: Type.STRING },
                groundingGuardrail: { type: Type.STRING },
                immediateTractionStep: { type: Type.STRING },
              },
              required: ['divergentLeap', 'groundingGuardrail', 'immediateTractionStep'],
            },
          },
          required: ['refinedInsights', 'consensus', 'synthesisActionBridge'],
        },
        temperature: 0.5,
        safetySettings: SAFETY_SETTINGS,
        ...getThinkingConfig(req)
      },
    });

    const refinement = JSON.parse(refineResponse.text);
    sendPhase('refining', { result: refinement });

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
    });

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
  body('problem').isString().trim().escape().notEmpty(),
  body('mode').optional().isString().trim().escape(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { strategyId } = req.params;
    const strategy = STRATEGY_MAP[strategyId];
    if (!strategy) return res.status(404).json({ error: `Unknown strategy: ${strategyId}` });

    const genAI = getAgentGenAI(req);
    if (!genAI) return res.status(500).json({ error: 'Gemini API is not configured.' });

    const { problem, mode } = req.body;
    const safetyCheck = checkPreFlightSafety(problem, req);
    if (safetyCheck) return res.status(safetyCheck.status).json(safetyCheck.json);

    const piiFound = scanForPII(problem);
    if (piiFound.length > 0) return res.status(400).json({ error: `Privacy Note: Identified personal details (${piiFound.join(', ')}). Please tidy details before proceeding.` });

    const schema = {
      type: Type.OBJECT,
      properties: {
        strategyName: { type: Type.STRING },
        agentPersona: { type: Type.STRING },
        insights: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: 'A distinct, actionable insight.' },
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

      Provide 2-3 distinct, specific, and actionable insights. Stay fully in character.
    `;

    const response = await genAI.models.generateContent({
      model: getModel(req),
      contents: prompt,
      config: {
        systemInstruction: mode === 'care' ? HIPAA_SYSTEM_INSTRUCTION : undefined,
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.8,
        safetySettings: SAFETY_SETTINGS,
      },
    });

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error('Error in /api/agent/%s:', req.params.strategyId, error);
    res.status(500).json({ error: getCleanErrorMessage(error) });
  }
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

// Route all other requests to index.html to support Angular routing
app.get('{/*any}', (req, res) => {
  if (path.extname(req.path)) {
    return res.status(404).end();
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
