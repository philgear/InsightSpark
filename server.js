import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
    },
  },
}));
app.use(cors());
app.use(express.json());

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

// API Endpoints
app.post('/api/structure', async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({ error: 'Gemini API is not configured. Missing GEMINI_API_KEY environment variable.' });
    }
    const { problem } = req.body;
    
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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: HIPAA_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.2
        }
    });

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error('Error in /api/structure:', error);
    res.status(500).json({ error: 'Failed to structure problem' });
  }
});

app.post('/api/insights', async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({ error: 'Gemini API is not configured. Missing GEMINI_API_KEY environment variable.' });
    }
    const { problem, strategies, mode, gist, healthSnapshot } = req.body;
    
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

    const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: mode === 'care' ? HIPAA_SYSTEM_INSTRUCTION : undefined,
          responseMimeType: 'application/json',
          responseSchema: insightsSchema,
          temperature: 0.8
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
      res.status(500).json({ error: 'Failed to generate insights' });
    } else {
      res.write(`data: {"error": "Failed to generate insights"}\n\n`);
      res.end();
    }
  }
});

app.post('/api/care-plan', async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({ error: 'Gemini API is not configured. Missing GEMINI_API_KEY environment variable.' });
    }
    const { problem, insights } = req.body;
    
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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: HIPAA_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: carePlanSchema,
          temperature: 0.6
        }
    });

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error('Error in /api/care-plan:', error);
    res.status(500).json({ error: 'Failed to generate care plan' });
  }
});

// Serve Angular static files
app.use(express.static(path.join(__dirname, 'dist')));

// Route all other requests to index.html to support Angular routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
