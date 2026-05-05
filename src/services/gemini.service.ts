import { Injectable } from '@angular/core';
import type { Schema } from '@google/genai';
import { CreativeStrategy, InsightResult, SavedInsight, CarePlan, StructuredProblem } from '../models/creative-types';

export class ApiRetryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiRetryError';
  }
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

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private initPromise: Promise<{ ai: any, Type: any }>;

  // Caching Maps to store promises, preventing duplicate API calls for the same request.
  private insightCache = new Map<string, Promise<InsightResult[]>>();
  private structureCache = new Map<string, Promise<StructuredProblem>>();
  private carePlanCache = new Map<string, Promise<CarePlan>>();

  constructor() {
    this.initPromise = import('@google/genai').then(m => {
      const apiKey = (window as any).env?.GEMINI_API_KEY || 'AIzaSyD7RSETzuXfhULZzJ83-6wIIKaZBz13iak';
      return { ai: new m.GoogleGenAI({ apiKey }), Type: m.Type };
    });
  }

  /**
   * Clears all caches. Called when starting a new session.
   */
  public clearCache(): void {
    this.insightCache.clear();
    this.structureCache.clear();
    this.carePlanCache.clear();
  }

  /**
   * A best-effort PII masker. It uses regular expressions to find and replace
   * common PII patterns like emails, phone numbers, and dates. This is a
   * safety net and does not replace the primary user instruction not to enter PII.
   * @param text The input text to be sanitized.
   * @returns The text with potential PII replaced with placeholders.
   */
  private maskPII(text: string): string {
    if (!text) return '';
    let maskedText = text;

    // Mask emails
    maskedText = maskedText.replace(/\b[A-Z09._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email redacted]');

    // Mask phone numbers (North American format variations)
    maskedText = maskedText.replace(/\b(?:\+?1[.\s-]?)?\(?(\d{3})\)?[.\s-]?(\d{3})[.\s-]?(\d{4})\b/g, '[phone redacted]');

    // Mask dates (e.g., MM/DD/YYYY, YYYY-MM-DD, Month D, YYYY)
    maskedText = maskedText.replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, '[date redacted]');
    maskedText = maskedText.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4}\b/gi, '[date redacted]');

    // Mask Social Security Number-like patterns
    maskedText = maskedText.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[identifier redacted]');

    // Mask names preceded by common titles
    const nameRegex = /\b(Mr|Mrs|Ms|Dr|Doctor)\.?\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?\b/g;
    maskedText = maskedText.replace(nameRegex, '[name redacted]');
    
    return maskedText;
  }

  private sanitizeForPrompt(input: string | undefined | null): string {
    if (!input) return '';
    // Use JSON.stringify to handle all necessary escapes (quotes, backslashes, newlines, etc.)
    // then slice off the outer quotes it adds, so we get the raw escaped content.
    return JSON.stringify(input).slice(1, -1);
  }

  /**
   * Wraps an async API call with retry logic using exponential backoff.
   * @param apiCall The async function to execute.
   * @param maxRetries The maximum number of retries after the initial attempt.
   * @param initialDelay The initial delay in ms before the first retry.
   * @returns The result of the successful API call.
   */
  private async _withRetries<T>(apiCall: () => Promise<T>, maxRetries = 2, initialDelay = 1000): Promise<T> {
    let attempt = 0;
    while (true) {
      try {
        return await apiCall();
      } catch (error) {
        attempt++;
        if (attempt > maxRetries) {
          console.error(`API call failed after ${maxRetries + 1} attempts.`, error);
          throw new ApiRetryError(`The request failed after multiple attempts due to a network or server issue. Please check your connection and try again.`);
        }
        
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.warn(`API call failed on attempt ${attempt}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async structureHealthGoal(problem: string): Promise<StructuredProblem> {
    const processedProblem = this.maskPII(problem);
    const cacheKey = processedProblem.trim();
    if (this.structureCache.has(cacheKey)) {
        return this.structureCache.get(cacheKey)!;
    }

    const promise = this._structureHealthGoal(processedProblem);
    this.structureCache.set(cacheKey, promise);
    return promise;
  }

  private async _structureHealthGoal(processedProblem: string): Promise<StructuredProblem> {
    const { ai, Type } = await this.initPromise;
    return this._withRetries(async () => {
      const schema: Schema = {
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

      const sanitizedProblem = this.sanitizeForPrompt(processedProblem);

      const prompt = `
        Analyze the following de-identified health goal. Your task is to chunk the information into a structured JSON object.

        **Health Goal Input:**
        "${sanitizedProblem}"

        **Instructions:**
        - Identify the core components of the goal.
        - Populate the JSON object according to the schema.
        - The 'title' should be very short and serve as a quick summary.
        - The 'condition', 'goal', and 'barriers' should be extracted or inferred from the input text.
        - Ensure the output is clean, concise, and uses person-centered, accessible language.
      `;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction: HIPAA_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: schema,
            temperature: 0.2 // Low temperature for focused, factual extraction
          }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the API for structuring the health goal.");
        
        return JSON.parse(text) as StructuredProblem;
      } catch (error) {
        console.error('Gemini API Error while structuring health goal:', error);
        throw error; // Re-throw to be caught by the retry handler
      }
    });
  }

  private generateInsightCacheKey(problem: string, strategies: CreativeStrategy[], mode: 'creative' | 'care', gist?: string, healthSnapshot?: string): string {
    const strategyIds = strategies.map(s => s.id).sort().join(',');
    const processedProblem = this.maskPII(problem);
    const processedGist = this.maskPII(gist || '');
    const processedSnapshot = this.maskPII(healthSnapshot || '');
    return `${processedProblem.trim()}|${strategyIds}|${mode}|${processedGist.trim()}|${processedSnapshot.trim()}`;
  }

  async generateInsights(problem: string, strategies: CreativeStrategy[], mode: 'creative' | 'care', gist?: string, healthSnapshot?: string): Promise<InsightResult[]> {
    if (!problem.trim()) return [];
    
    const cacheKey = this.generateInsightCacheKey(problem, strategies, mode, gist, healthSnapshot);
    if (this.insightCache.has(cacheKey)) {
        return this.insightCache.get(cacheKey)!;
    }

    const promise = this._generateInsights(problem, strategies, mode, gist, healthSnapshot);
    this.insightCache.set(cacheKey, promise);
    return promise;
  }
  
  private async _generateInsights(problem: string, strategies: CreativeStrategy[], mode: 'creative' | 'care', gist?: string, healthSnapshot?: string): Promise<InsightResult[]> {
    const { ai, Type } = await this.initPromise;
    let processedProblem = problem;
    let processedGist = gist || '';

    if (mode === 'care') {
      processedProblem = this.maskPII(processedProblem);
      if (gist) {
        processedGist = this.maskPII(gist);
      }
    }

    const sanitizedProblem = this.sanitizeForPrompt(processedProblem);
    const sanitizedGist = this.sanitizeForPrompt(processedGist);
    const systemInstruction = mode === 'care' ? HIPAA_SYSTEM_INSTRUCTION : undefined;

    const insightsSchema: Schema = {
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
      "${sanitizedGist}"
      
      With that principle in mind, proceed with the main task.
      ` : ''}

      ${healthSnapshot ? `
      **Health Snapshot (use this to inform and contextualise your insights):**
      ${this.sanitizeForPrompt(this.maskPII(healthSnapshot))}
      ` : ''}

      I am facing the following problem or challenge:
      "${sanitizedProblem}"

      Please apply EACH of the following creative strategies to this problem:
      ${strategyText}

      For each strategy, provide 2 to 3 distinct, specific, and actionable insights or ideas.
      Ensure the insights are written in clear, simple language, avoiding jargon to be accessible to a wide audience.
      
      ${mode === 'care' ? `
      IMPORTANT: For each insight, you MUST also provide a brief summary of its supportive impact on the person's well-being, as described in the JSON schema.
      ` : ''}
      
      Return the output strictly as a JSON array of objects, with one object for each strategy, matching the schema.
    `;


      try {
      const results = await this._withRetries(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: insightsSchema,
            temperature: 0.8
          }
        });

        const text = response.text;
        if (!text) throw new Error(`Empty response for insight generation.`);

        const parsedResults = JSON.parse(text) as InsightResult[];
        
        // The model might not return the strategy name exactly as we sent it (e.g., casing).
        // Let's normalize it to match the input strategy name for consistency.
        return parsedResults.map(result => {
          const originalStrategy = strategies.find(s => {
            const sName = mode === 'care' ? s.careModeName || s.name : s.name;
            return sName.toLowerCase() === result.strategyName.toLowerCase();
          });
          if (originalStrategy) {
            result.strategyName = mode === 'care' ? (originalStrategy.careModeName || originalStrategy.name) : originalStrategy.name;
          }
          return result;
        });
      });
      return results;
    } catch (error) {
      console.error(`Failed to generate insights for problem: '${problem}'`, error);
      // If everything failed, throw an error to be handled by the UI
      if (strategies.length > 0) {
        throw new Error("Failed to generate any insights. Please check your connection or try again.");
      }
      return []; // Return empty if no strategies were provided in the first place
    }
  }

  private generateCarePlanCacheKey(problem: string, insights: SavedInsight[]): string {
    const insightTexts = insights.map(i => i.text).sort().join('|');
    const processedProblem = this.maskPII(problem);
    return `${processedProblem.trim()}||${insightTexts}`;
  }

  async generateCarePlan(problem: string, insights: SavedInsight[]): Promise<CarePlan> {
    if (insights.length === 0) {
      throw new Error("No insights provided to generate a care plan.");
    }
    
    const cacheKey = this.generateCarePlanCacheKey(problem, insights);
    if (this.carePlanCache.has(cacheKey)) {
        return this.carePlanCache.get(cacheKey)!;
    }

    const promise = this._generateCarePlan(problem, insights);
    this.carePlanCache.set(cacheKey, promise);
    return promise;
  }

  private async _generateCarePlan(problem: string, insights: SavedInsight[]): Promise<CarePlan> {
    const { ai, Type } = await this.initPromise;
    return this._withRetries(async () => {
      // Care plans are only generated in health mode, so we always mask the problem.
      const processedProblem = this.maskPII(problem);

      const carePlanSchema: Schema = {
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

      const sanitizedProblem = this.sanitizeForPrompt(processedProblem);
      const insightText = insights.map(i => `- ${this.sanitizeForPrompt(i.text)}`).join('\n');

      const prompt = `
        Your task is to synthesize an actionable support plan based on a primary health goal and a set of key insights. Adhere strictly to your core principles of being person-centric, positive, simple, and actionable.

        **Primary Health Goal:**
        "${sanitizedProblem}"

        **Key Insights to Incorporate:**
        ${insightText}

        **Instructions:**
        Generate a JSON object that strictly follows the provided schema.
        - Each section must contain concise, positive, and actionable items.
        - "positiveAchievements" should highlight milestones to celebrate and motivate the person.
        - "recommendations" should propose supportive next steps.
        - All text must be easily understood by individuals and their families, avoiding clinical jargon.
      `;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction: HIPAA_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: carePlanSchema,
            temperature: 0.6 // A balance between clinical focus and positive framing.
          }
        });
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the API.");
        
        return JSON.parse(text) as CarePlan;
      } catch (error) {
        console.error('Gemini API Error while generating care plan:', error);
        throw error; // Re-throw to be caught by the retry handler
      }
    });
  }
}