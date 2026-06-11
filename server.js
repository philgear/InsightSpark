import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
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
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://accounts.google.com/gsi/client"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com/gsi/style"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://orcid.org", "https://*.orcid.org"],
      connectSrc: ["'self'", "https://accounts.google.com/gsi/", "https://fonts.gstatic.com", "https://fonts.googleapis.com", "https://orcid.org", "https://*.orcid.org"],
      frameSrc: ["'self'", "https://accounts.google.com/gsi/"],
      frameAncestors: [
        "'self'",
        "https://pocketgull.app",
        "https://*.pocketgull.app",
        "https://spark.philgear.dev",
        "https://*.philgear.dev",
        "https://philgear.dev"
      ],
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
2.  **Positive Language:** Use encouraging, hopeful, and empowering language. Avoid negative or alarming terminology. Focus on what can be done, not just on the problems.
3.  **Simplicity and Clarity:** Explain concepts in simple, jargon-free terms that an individual or their family can easily understand.
4.  **Actionable Advice:** Insights should be practical and suggest concrete, manageable steps.

**Crucial Safety Instruction:**
Under no circumstances should you ever repeat, store, or include any Personally Identifiable Information (PII) such as names, dates, addresses, or specific identifiers in your response. Your output must be completely anonymous and focused solely on the abstract health challenge.
`;

// Scan string for potential PII (Emails, Phone numbers, SSNs, IP addresses)
function scanForPII(text) {
  if (!text || typeof text !== 'string') return [];
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /\b(?:\+?\d{1,3}[-.\s]+)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
  const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;

  const foundPII = [];
  if (emailRegex.test(text)) foundPII.push('Email Address');
  if (phoneRegex.test(text)) foundPII.push('Phone Number');
  if (ssnRegex.test(text)) foundPII.push('Social Security Number');
  if (ipRegex.test(text)) foundPII.push('IP Address');

  return foundPII;
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
  }
];

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

// Config endpoint to expose Client ID to frontend
app.get('/api/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    orcidClientId: process.env.ORCID_CLIENT_ID || null
  });
});

app.post('/api/auth/orcid', [
  body('code').isString().trim().notEmpty(),
  body('redirectUri').isString().trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code, redirectUri } = req.body;
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

    const piiFound = scanForPII(problem);
    if (piiFound.length > 0) {
      return res.status(400).json({ error: `Security Check Blocked: Potential personally identifiable information (PII) detected (${piiFound.join(', ')}). Under HIPAA guidelines, please de-identify your health goals before generating insights.` });
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
    `;

    const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: HIPAA_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.2,
          safetySettings: SAFETY_SETTINGS
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

    const piiFound = [
      ...scanForPII(problem),
      ...scanForPII(gist || ''),
      ...scanForPII(healthSnapshot || '')
    ];
    if (piiFound.length > 0) {
      return res.status(400).json({ error: `Security Check Blocked: Potential personally identifiable information (PII) detected (${[...new Set(piiFound)].join(', ')}). Under HIPAA guidelines, please de-identify your inputs before generating insights.` });
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
    `;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const responseStream = await genAI.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: mode === 'care' ? HIPAA_SYSTEM_INSTRUCTION : undefined,
          responseMimeType: 'application/json',
          responseSchema: insightsSchema,
          temperature: 0.8,
          safetySettings: SAFETY_SETTINGS
        }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
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

    const piiFound = [
      ...scanForPII(problem),
      ...insights.flatMap(i => scanForPII(i.text || ''))
    ];
    if (piiFound.length > 0) {
      return res.status(400).json({ error: `Security Check Blocked: Potential personally identifiable information (PII) detected (${[...new Set(piiFound)].join(', ')}). Under HIPAA guidelines, please de-identify your inputs before generating a care plan.` });
    }
    
    const carePlanSchema = {
      type: Type.OBJECT,
      properties: {
          personGoal: { type: Type.STRING, description: "A concise summary of the primary person's goal, stated in a positive and empowering way." },
          keyInterventions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2-3 key interventions or actions for the support plan." },
          monitoringPlan: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2-3 items for the person or supporter to monitor." },
          guidanceAndEducation: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2-3 educational points for the person, explained simply." },
          positiveAchievements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2-3 encouraging achievements or potential milestones to celebrate and motivate the person." },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2-3 next-step recommendations for the supporter or person, framed positively." }
      },
      required: ["personGoal", "keyInterventions", "monitoringPlan", "guidanceAndEducation", "positiveAchievements", "recommendations"]
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
        - All text must be easily understood by individuals and their families, avoiding clinical jargon.
      `;

    const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: HIPAA_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: carePlanSchema,
          temperature: 0.6,
          safetySettings: SAFETY_SETTINGS
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

    const piiFound = [
      ...scanForPII(problem),
      ...insights.flatMap(i => scanForPII(i.text || ''))
    ];
    if (piiFound.length > 0) {
      return res.status(400).json({ error: `Security Check Blocked: Potential personally identifying information (PII) detected (${[...new Set(piiFound)].join(', ')}). Please de-identify your inputs before generating an action plan.` });
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
      `;

    const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: creativePlanSchema,
          temperature: 0.5,
          safetySettings: SAFETY_SETTINGS
        }
    });

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error('Error in /api/creative-plan:', error);
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
  'fmea': { name: 'FMEA (Risk Analysis)', persona: 'I see what can go wrong before it does. My job is to protect, not to pessimize — I build guardrails, not walls.' },
  'critical-path': { name: 'Critical Path Method', persona: 'I see dependencies. I map the non-negotiable sequence — what must happen first, what blocks what, and where the bottleneck hides.' },
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
    const piiFound = scanForPII(problem);
    if (piiFound.length > 0) return res.status(400).json({ error: `PII detected: ${piiFound.join(', ')}` });

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
      model: 'gemini-2.5-flash',
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
      model: 'gemini-2.5-flash',
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
      },
      required: ['refinedInsights', 'consensus'],
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
    `;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.5,
        safetySettings: SAFETY_SETTINGS,
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
    const piiFound = scanForPII(problem);
    if (piiFound.length > 0) return res.status(400).json({ error: `PII detected: ${piiFound.join(', ')}` });

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
      model: 'gemini-2.5-flash',
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
      model: 'gemini-2.5-flash',
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
      model: 'gemini-2.5-flash',
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
      model: 'gemini-2.5-flash',
      contents: `Problem: "${problem}"\n\nOriginal Insights:\n${insightTextForDebate}\n\nDebate:\n${debateTextForRefine}\n\nProduce 3-5 refined insights with confidence scores and a consensus statement.`,
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
          },
          required: ['refinedInsights', 'consensus'],
        },
        temperature: 0.5,
        safetySettings: SAFETY_SETTINGS,
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
    const piiFound = scanForPII(problem);
    if (piiFound.length > 0) return res.status(400).json({ error: `PII detected: ${piiFound.join(', ')}` });

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
      model: 'gemini-2.5-flash',
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
    if (filePath.endsWith('.html') || filePath.endsWith('manifest.webmanifest')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  }
}));

// Static legal page routing
app.get(['/terms', '/terms.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'terms.html'));
});
app.get(['/privacy', '/privacy.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'privacy.html'));
});

// Route all other requests to index.html to support Angular routing
app.get('*', (req, res) => {
  if (path.extname(req.path)) {
    return res.status(404).end();
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
