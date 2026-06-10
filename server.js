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
  frameguard: false,
}));
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
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
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

// Serve Angular static files
app.use(express.static(path.join(__dirname, 'dist')));

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
