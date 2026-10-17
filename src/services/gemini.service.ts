import { Injectable } from '@angular/core';
import { CreativeStrategy, InsightResult, SavedInsight, CarePlan, StructuredProblem, CreativePlan, SavedItem } from '../models/creative-types';
import { STARTER_SCENARIOS } from '../models/starter-scenarios';
import { StrategySelection, DebateEntry, RefinedInsight, AgenticResult, AgenticPhase } from '../models/agent-types';
import { parse } from 'partial-json';

function getStoredApiKey(): string {
  let value = localStorage.getItem('spark_cfg_val');
  if (!value) {
    const oldKey = localStorage.getItem('user_gemini_api_key');
    if (oldKey) {
      value = oldKey === 'demo-key-active' ? oldKey : btoa(oldKey);
      localStorage.setItem('spark_cfg_val', value);
      localStorage.removeItem('user_gemini_api_key');
    }
  }
  if (!value) return '';
  try {
    if (['demo-key-active', 'chrome-on-device-builtin', 'local-ollama-active', 'webgpu-active', 'server-hosted-pass'].includes(value)) {
      return value;
    }
    return atob(value);
  } catch {
    return value;
  }
}

export class ApiRetryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiRetryError';
  }
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  // Caching Maps to store promises, preventing duplicate API calls for the same request.
  private insightCache = new Map<string, Promise<InsightResult[]>>();
  private structureCache = new Map<string, Promise<StructuredProblem>>();
  private carePlanCache = new Map<string, Promise<CarePlan>>();
  private creativePlanCache = new Map<string, Promise<CreativePlan>>();

  private getAuthHeaders(headers: Record<string, string> = {}): Record<string, string> {
    const userApiKey = getStoredApiKey();
    const authHeaders = { ...headers };
    if (userApiKey && !['demo-key-active', 'chrome-on-device-builtin', 'local-ollama-active', 'webgpu-active', 'server-hosted-pass'].includes(userApiKey)) {
      authHeaders['x-gemini-api-key'] = userApiKey;
    }
    const userModel = localStorage.getItem('spark_model_val') || localStorage.getItem('user_gemini_model');
    if (userModel) {
      authHeaders['x-gemini-model'] = userModel;
    }
    const customOllamaHost = localStorage.getItem('spark_ollama_host');
    if (customOllamaHost) {
      authHeaders['x-ollama-host'] = customOllamaHost;
    }
    const userLang = localStorage.getItem('spark_lang_val') || localStorage.getItem('user_target_language');
    if (userLang) {
      authHeaders['x-target-language'] = userLang;
    }
    const userTemp = localStorage.getItem('spark_temp_val');
    if (userTemp !== null && userTemp !== undefined && userTemp !== '') {
      authHeaders['x-gemini-temperature'] = userTemp;
    }
    const userThinking = localStorage.getItem('spark_thinking_budget');
    if (userThinking !== null && userThinking !== undefined && userThinking !== '') {
      authHeaders['x-gemini-thinking-budget'] = userThinking;
    }
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('spark_triage_acknowledged') === 'true') {
      authHeaders['x-triage-acknowledged'] = 'true';
    }
    const brandSteering = localStorage.getItem('spark_brand_steering');
    if (brandSteering) {
      authHeaders['x-brand-steering'] = brandSteering;
    }
    return authHeaders;
  }

  // Chaos Simulation Configuration
  public simulatedFailureType: '429' | '500' | 'drop' | null = null;
  public simulatedFailureBehavior: 'transient' | 'permanent' = 'transient';

  /**
   * Clears all caches. Called when starting a new session.
   */
  public clearCache(): void {
    this.insightCache.clear();
    this.structureCache.clear();
    this.carePlanCache.clear();
    this.creativePlanCache.clear();
  }

  /**
   * Wraps an async API call with retry logic using exponential backoff.
   */
  private async _withRetries<T>(apiCall: () => Promise<T>, maxRetries = 2, initialDelay = 1000): Promise<T> {
    let attempt = 0;
    while (true) {
      try {
        if (this.simulatedFailureType) {
          const isTransient = this.simulatedFailureBehavior === 'transient';
          const shouldFail = !isTransient || (isTransient && attempt < 2);

          if (shouldFail) {
            if (this.simulatedFailureType === '429') {
              throw new Error('Server returned 429 Too Many Requests (Simulated Chaos)');
            } else if (this.simulatedFailureType === '500') {
              throw new Error('Server returned 500 Internal Server Error (Simulated Chaos)');
            } else if (this.simulatedFailureType === 'drop') {
              throw new Error('TypeError: Failed to fetch (Simulated Chaos Connection Drop)');
            }
          }
        }
        return await apiCall();
      } catch (error) {
        const errMessage = (error as Error).message || '';
        
        // Fail fast on specific API key or billing cap issues (exclude transient 429/RESOURCE_EXHAUSTED rate limits from failing fast)
        if (
          errMessage.includes('monthly spending cap') ||
          errMessage.includes('API key') ||
          errMessage.includes('not valid') ||
          errMessage.includes('Billing')
        ) {
          throw new ApiRetryError(errMessage);
        }

        attempt++;
        if (attempt > maxRetries) {
          console.error(`API call failed after ${maxRetries + 1} attempts.`, error);
          throw new ApiRetryError(errMessage ? `failed after multiple attempts: ${errMessage}` : `The request failed after multiple attempts due to a network or server issue. Please check your connection and try again.`);
        }
        
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.warn(`API call failed on attempt ${attempt}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async structureHealthGoal(problem: string, image?: { mimeType: string; data: string }): Promise<StructuredProblem> {
    if (this.isDemoMode()) {
      const pLower = problem.toLowerCase();
      const matched = STARTER_SCENARIOS.find(s => 
        s.prompt === problem ||
        pLower.includes(s.category) ||
        pLower.includes(s.title.toLowerCase())
      );
      if (matched && matched.domainContext) {
        return {
          title: matched.title,
          condition: `Active Vitality & ${matched.categoryLabel}`,
          goal: matched.gist,
          barriers: [
            "Fear of fatigue or overexertion during active sessions",
            "Need for ergonomic adaptations and safe seated stations",
            "Protecting caregiver stamina and scheduled weekly respite"
          ],
          dsrp: {
            identityDistinctions: matched.domainContext.identityAssets,
            systemicEcosystem: matched.domainContext.ecosystem,
            relationalBridge: matched.domainContext.relational,
            triadPerspectives: matched.domainContext.perspectives
          }
        };
      }
      return {
        title: "Hip Recovery & Gardening Connection",
        condition: "Post-hip fracture recovery",
        goal: "Safely rebuild mobility and maintain emotional well-being through modified gardening activities.",
        barriers: [
          "Fear of falling or re-injury",
          "Inability to bend down or lift heavy watering cans",
          "Fatigue and limited standing tolerance"
        ],
        dsrp: {
          identityDistinctions: "Lifelong master gardener and community mentor — 100% unaffected passion for botany, propagation, and seed catalog curation to fuel rehabilitation.",
          systemicEcosystem: "Circadian pacing: morning hip stiffness mitigated by 10-minute warm compress + chamomile tea, balancing parasympathetic vagal tone and protecting restorative deep sleep architecture.",
          relationalBridge: "Granddaughter assists with elevated potting bench soil transfers; spouse handles heavy watering cans, breaking the isolation-pain-immobility feedback loop.",
          triadPerspectives: "Clinician (biomechanical hip precautions & gradual weight bearing) + Patient (morning apprehension and fear of falling) + Future Self (walking kneeling-free in the summer sunflower garden in 6 months)."
        }
      };
    }
    const cacheKey = problem.trim() + (image ? `|img:${image.data.substring(0, 32)}` : '');
    if (this.structureCache.has(cacheKey)) {
        return this.structureCache.get(cacheKey)!;
    }

    const promise = this._structureHealthGoal(problem, image);
    this.structureCache.set(cacheKey, promise);
    return promise;
  }

  private async _structureHealthGoal(problem: string, image?: { mimeType: string; data: string }): Promise<StructuredProblem> {
    return this._withRetries(async () => {
      const response = await fetch('/api/structure', {
        method: 'POST',
        headers: this.getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ problem, image })
      });

      if (!response.ok) {
        let errorMsg = `Server returned ${response.status} ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData && errData.error) errorMsg = errData.error;
        } catch {
          // Ignore error parsing, fall back to default msg
        }
        throw new Error(errorMsg);
      }

      return response.json();
    });
  }

  private generateInsightCacheKey(problem: string, strategies: CreativeStrategy[], mode: 'creative' | 'care', gist?: string, healthSnapshot?: string, image?: { mimeType: string; data: string }): string {
    const strategyIds = strategies.map(s => s.id).sort().join(',');
    return `${problem.trim()}|${strategyIds}|${mode}|${gist?.trim() || ''}|${healthSnapshot?.trim() || ''}|${image ? image.data.substring(0, 32) : ''}`;
  }

  async generateInsights(
    problem: string, 
    strategies: CreativeStrategy[], 
    mode: 'creative' | 'care', 
    gist?: string, 
    healthSnapshot?: string,
    onUpdate?: (partial: InsightResult[]) => void,
    image?: { mimeType: string; data: string }
  ): Promise<InsightResult[]> {
    if (!problem.trim()) return [];
    if (this.isDemoMode()) {
      const mockData = this.getMockInsights(problem, strategies, mode);
      if (onUpdate) {
        setTimeout(() => onUpdate(mockData), 600);
      }
      return mockData;
    }
    
    const cacheKey = this.generateInsightCacheKey(problem, strategies, mode, gist, healthSnapshot, image);
    if (this.insightCache.has(cacheKey)) {
        return this.insightCache.get(cacheKey)!;
    }

    const promise = this._generateInsights(problem, strategies, mode, gist, healthSnapshot, onUpdate, image);
    this.insightCache.set(cacheKey, promise);
    return promise;
  }
  
  private async _generateInsights(
    problem: string, 
    strategies: CreativeStrategy[], 
    mode: 'creative' | 'care', 
    gist?: string, 
    healthSnapshot?: string,
    onUpdate?: (partial: InsightResult[]) => void,
    image?: { mimeType: string; data: string }
  ): Promise<InsightResult[]> {
    try {
      const results = await this._withRetries(async () => {
        const selectedModel = localStorage.getItem('spark_model_val') || localStorage.getItem('user_gemini_model');
        
        // On-device execution branch: Chrome Built-in AI (Gemini Nano via window.ai)
        const win = window as unknown as { ai?: { languageModel?: { create: (opts: { systemPrompt: string }) => Promise<{ prompt: (p: string) => Promise<string>; destroy?: () => void }> } } };
        if ((selectedModel === 'on-device-nano' || selectedModel === 'window.ai') && typeof win?.ai?.languageModel?.create === 'function') {
          try {
            const systemPrompt = mode === 'care'
              ? 'You are a compassionate, HIPAA-compliant care support partner grounded in PERMA+H positive psychology. Provide specific, practical, everyday insights (not generic clichés and not unrealistic gimmicks) in valid JSON format matching schema: [{"strategyName": string, "insights": [{"text": string, "influence": string}]}].'
              : 'You are a practical lateral thinking partner. Provide specific, realistic, doable insights (avoiding vague clichés and avoiding crazy sci-fi gimmicks) matching JSON schema: [{"strategyName": string, "insights": [{"text": string}]}].';
            
            const session = await win.ai.languageModel.create({ systemPrompt });
            const strategyList = strategies.map(s => {
              const sName = mode === 'care' ? (s.careModeName || s.name) : s.name;
              const sDesc = mode === 'care' ? (s.careModeDescription || s.description) : s.description;
              return `- Strategy: "${sName}" — ${sDesc}`;
            }).join('\n');
            const gistContext = gist ? `Guiding Perspective: "${gist}"\n\n` : '';
            const snapshotContext = healthSnapshot ? `Health Snapshot: ${healthSnapshot}\n\n` : '';
            const promptText = `${gistContext}${snapshotContext}Problem: "${problem}"\n\nStrategies:\n${strategyList}\n\nProvide 2 specific, practical, real-world insights per strategy that someone can realistically do this week. Output valid JSON array only.`;
            
            const fullResponse = await session.prompt(promptText);
            session.destroy?.();
            
            const cleaned = this.cleanJsonBuffer(fullResponse);
            const parsed = parse(cleaned);
            const extracted = this.extractInsightResults(parsed, strategies, mode);
            if (extracted.length > 0) {
              if (onUpdate) onUpdate(extracted);
              return extracted;
            }
          } catch (nanoErr) {
            console.warn('Chrome Built-in AI execution error, falling back to server pipeline:', nanoErr);
          }
        }

        const response = await fetch('/api/insights', {
          method: 'POST',
          headers: this.getAuthHeaders({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            problem,
            strategies,
            mode,
            gist,
            healthSnapshot,
            image
          })
        });

        if (!response.ok) {
          let errorMsg = `Server returned ${response.status} ${response.statusText}`;
          try {
            const errData = await response.json();
            if (errData && errData.error) errorMsg = errData.error;
          } catch {
            // Ignore error parsing, fall back to default msg
          }
          throw new Error(errorMsg);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Response body is not readable");

        const decoder = new TextDecoder();
        let buffer = '';
        let finalResults: InsightResult[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') break;
              if (dataStr) {
                try {
                  const data = JSON.parse(dataStr);
                  if (data.text) {
                    buffer += data.text;
                    if (onUpdate) {
                      try {
                        const cleaned = this.cleanJsonBuffer(buffer);
                        const partial = parse(cleaned);
                        const normalizedResults = this.extractInsightResults(partial, strategies, mode);
                        if (normalizedResults.length > 0) {
                          finalResults = normalizedResults;
                          onUpdate(normalizedResults);
                        }
                      } catch {
                         // Ignore partial parse errors, just wait for next chunk
                      }
                    }
                  } else if (data.error) {
                    throw new Error(data.error);
                  }
                } catch {
                  // ignore JSON parse error for SSE message wrapper
                }
              }
            }
          }
        }
        
        // Final parsing attempt to ensure we get everything if onUpdate wasn't called on the last chunk
        try {
           const cleaned = this.cleanJsonBuffer(buffer);
           const finalParsed = parse(cleaned);
           const normalizedResults = this.extractInsightResults(finalParsed, strategies, mode);
           if (normalizedResults.length > 0) {
             finalResults = normalizedResults;
           }
        } catch(e) {
           console.error("Final parse failed", e);
        }

        if (finalResults.length === 0 && buffer.trim().length > 0) {
          const lines = buffer.split('\n').map(l => l.trim().replace(/^[-*•\d.]+\s*/, '')).filter(l => l.length > 10);
          if (lines.length > 0) {
            const fallbackStrategyName = strategies[0] 
              ? (mode === 'care' ? strategies[0].careModeName || strategies[0].name : strategies[0].name)
              : 'Synthesized Insight';
            finalResults = [{
              strategyName: fallbackStrategyName,
              insights: lines.slice(0, 3).map(text => ({ text }))
            }];
            if (onUpdate) onUpdate(finalResults);
          }
        }

        return finalResults;
      });
      return results;
    } catch (error) {
      console.error(`Failed to generate insights for problem: '${problem}'`, error);
      const errMsg = (error as Error).message || "Failed to generate any insights. Please check your connection or try again.";
      throw new Error(errMsg, { cause: error });
    }
  }

  private cleanJsonBuffer(buf: string): string {
    let cleaned = buf.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '');
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.replace(/\s*```$/, '');
    }
    const firstBrace = cleaned.search(/[{[]/);
    if (firstBrace > 0) {
      cleaned = cleaned.slice(firstBrace);
    }
    return cleaned;
  }

  private extractInsightResults(parsed: unknown, strategies: CreativeStrategy[], mode: 'creative' | 'care'): InsightResult[] {
    if (!parsed) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rawList: any[] = [];
    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else if (typeof parsed === 'object' && parsed !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj = parsed as Record<string, any>;
      if (obj['strategyName'] && Array.isArray(obj['insights'])) {
        rawList = [obj];
      } else if (Array.isArray(obj['insights'])) {
        rawList = obj['insights'];
      } else if (Array.isArray(obj['strategies'])) {
        rawList = obj['strategies'];
      } else if (Array.isArray(obj['results'])) {
        rawList = obj['results'];
      } else if (Array.isArray(obj['data'])) {
        rawList = obj['data'];
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const extractedFromEntries: any[] = [];
        for (const [key, val] of Object.entries(obj)) {
          if (Array.isArray(val)) {
            for (const item of val) {
              if (item && typeof item === 'object') {
                if (!item.strategyName) item.strategyName = key;
                extractedFromEntries.push(item);
              }
            }
          } else if (val && typeof val === 'object') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const item = val as Record<string, any>;
            if (!item['strategyName']) item['strategyName'] = key;
            extractedFromEntries.push(item);
          }
        }
        if (extractedFromEntries.length > 0) {
          rawList = extractedFromEntries;
        }
      }
    }

    if (!Array.isArray(rawList)) return [];

    return rawList
      .filter(item => item && typeof item === 'object')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((result: any) => {
        const originalStrategy = strategies.find(s => {
          const sName = mode === 'care' ? s.careModeName || s.name : s.name;
          return sName.toLowerCase() === (result.strategyName || '').toLowerCase();
        });
        const finalStrategyName = originalStrategy
          ? (mode === 'care' ? (originalStrategy.careModeName || originalStrategy.name) : originalStrategy.name)
          : (result.strategyName || (strategies[0] ? (mode === 'care' ? strategies[0].careModeName || strategies[0].name : strategies[0].name) : 'Insight'));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let normalizedInsights: any[] = [];
        if (Array.isArray(result.insights)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          normalizedInsights = result.insights.map((ins: any) => {
            if (typeof ins === 'string') return { text: ins };
            return ins;
          });
        } else if (typeof result.insights === 'string') {
          normalizedInsights = [{ text: result.insights }];
        }

        return {
          strategyName: finalStrategyName,
          insights: normalizedInsights
        } as InsightResult;
      });
  }

  private generateCarePlanCacheKey(problem: string, insights: SavedInsight[]): string {
    const insightTexts = insights.map(i => i.text).sort().join('|');
    return `${problem.trim()}||${insightTexts}`;
  }

  async generateCarePlan(problem: string, insights: SavedInsight[]): Promise<CarePlan> {
    if (insights.length === 0) {
      throw new Error("No insights provided to generate a care plan.");
    }
    if (this.isDemoMode()) {
      const pLower = problem.toLowerCase();
      const matched = STARTER_SCENARIOS.find(s => 
        s.prompt === problem ||
        pLower.includes(s.category) ||
        pLower.includes(s.title.toLowerCase())
      );
      if (matched && matched.domainContext) {
        return {
          personGoal: matched.gist,
          keyInterventions: matched.domainContext.sampleInterventions,
          monitoringPlan: [
            `Track daily engagement and flow scores during ${matched.categoryLabel} sessions.`,
            `Observe posture comfort and fatigue cues with 15-minute natural pacing intervals.`,
            `Verify caregiver weekly respite hours to guarantee protected rest.`
          ],
          guidanceAndEducation: [
            `Introduce ergonomic adaptations and seated stations to eliminate prolonged physical strain.`,
            `Prioritize connection, storytelling, and micro-mastery over speed or perfection.`,
            `Empower the person with autonomous choice over timing, partners, and activity selection.`
          ],
          positiveAchievements: [
            `Celebrate completion of the first weekly ${matched.categoryLabel} session with family.`,
            `Acknowledge successful micro-mastery without pain or exhaustion.`,
            `Recognize the multi-generational bond and joy shared across family circles.`
          ],
          recommendations: [
            `Schedule recurring sessions at the same comfortable time of day.`,
            `Maintain a dedicated, clutter-free space with accessible tools and adaptive seating.`,
            `Keep a lighthearted reflection journal capturing memorable stories, insights, or laughs.`
          ],
          transitionChecklist: [
            `Verify 72-hour safety clearance: confirm path, lighting, and seating stability.`,
            `Reconcile activity timing with medication schedules to prevent peak fatigue windows.`,
            `Establish direct contact protocol between family coordinator and clinical team.`
          ],
          respiteClosureChecklist: [
            `Schedule dedicated 3-hour weekly respite window for primary caregiver.`,
            `Confirm secondary family partner or neighbor volunteer handoff.`,
            `Check in on caregiver fatigue metrics weekly to adjust support pacing.`
          ]
        };
      }
      return {
        personGoal: "Re-engage in modified gardening activities to safely build mobility and lift mood post-hip recovery.",
        keyInterventions: [
          "Install waist-high raised garden beds to eliminate bending requirements.",
          "Perform seated planting exercises using lightweight, ergonomic hand tools.",
          "Schedule daily 10-minute supported walking segments in the garden paths with a physical therapist or helper."
        ],
        monitoringPlan: [
          "Observe pain levels and balance stability during movement.",
          "Monitor daily mood score and verbal engagement levels.",
          "Track total active standing/walking minutes in the garden."
        ],
        guidanceAndEducation: [
          "Teach the 'nose over toes' safe standing technique when rising from garden chairs.",
          "Demonstrate proper posture to prevent back strain when reaching for plants.",
          "Educate on signs of fatigue to prevent over-exertion."
        ],
        positiveAchievements: [
          "Celebrate standing for 5 continuous minutes at the raised bed.",
          "Celebrate planting the first set of indoor seedlings.",
          "Acknowledge walk to the end of the garden path and back without pain."
        ],
        recommendations: [
          "Consult physical therapy to clear specific movements before starting outdoor gardening.",
          "Purchase a lightweight watering wand to make hydration of plants easy."
        ],
        transitionChecklist: [
          "Verify 72-hour post-recovery pathway clearance: confirm walker/cane fits beside garden planter.",
          "Reconcile morning medication schedule prior to any outdoor gardening sessions.",
          "Establish direct emergency contact protocol between family coordinator and physical therapist."
        ],
        respiteClosureChecklist: [
          "Schedule dedicated 3-hour Saturday respite window for primary caregiver.",
          "Confirm secondary family member or neighbor handoff for Sunday afternoon supervision.",
          "Check in on caregiver fatigue metrics weekly to adjust support pacing."
        ]
      };
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
    return this._withRetries(async () => {
      const response = await fetch('/api/care-plan', {
        method: 'POST',
        headers: this.getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          problem,
          insights
        })
      });

      if (!response.ok) {
        let errorMsg = `Server returned ${response.status} ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData && errData.error) errorMsg = errData.error;
        } catch {
          // Ignore error parsing, fall back to default msg
        }
        throw new Error(errorMsg);
      }

      return response.json();
    });
  }

  private generateCreativePlanCacheKey(problem: string, insights: SavedInsight[]): string {
    const insightTexts = insights.map(i => i.text).sort().join('|');
    return `${problem.trim()}||${insightTexts}`;
  }

  async generateCreativePlan(problem: string, insights: SavedInsight[]): Promise<CreativePlan> {
    if (insights.length === 0) {
      throw new Error("No insights provided to generate a creative plan.");
    }
    if (this.isDemoMode()) {
      const pLower = problem.toLowerCase();
      const matched = STARTER_SCENARIOS.find(s =>
        s.mode === 'creative' && (
          s.prompt === problem ||
          pLower.includes(s.title.toLowerCase()) ||
          pLower.includes(s.category)
        )
      );
      if (matched && matched.id !== 'creative-civic') {
        const insightSteps = insights.slice(0, 4).map((ins, idx) => `${idx + 1}. ${ins.text}`);
        return {
          conceptualGoal: `${matched.title}: ${matched.gist}`,
          criticalPath: insightSteps.length >= 2 ? insightSteps : [
            `1. Establish baseline prototype parameters for ${matched.title}.`,
            `2. Integrate saved lateral insights (${insights[0]?.strategyName || 'Core'}) into a physical bench test.`,
            `3. Stress-test failure modes under real-world community operating conditions.`,
            `4. Document open-source blueprints for neighborhood replication.`
          ],
          riskAssessment: [
            `1. Mechanical or environmental wear under peak seasonal load — mitigate via modular, tool-free replacement joints.`,
            `2. Community adoption friction — mitigate by co-designing the interface alongside local elders and youth.`
          ],
          requiredResources: [
            `Modular fabrication materials for ${matched.categoryLabel}`,
            `Neighborhood co-design host space`,
            `Low-voltage telemetry & acoustic/optical measurement kit`,
            `Open-source documentation templates`
          ],
          milestones: [
            `Month 1: Bench-scale functional prototype validated with initial user circle.`,
            `Month 3: Full installation operational with zero-grid or low-friction autonomy.`,
            `Month 6: Community stewardship handoff and open-source blueprint release.`
          ],
          nextSteps: [
            `Assemble a 48-hour rapid physical mock-up of: "${insights[0]?.text.slice(0, 80)}..."`,
            `Host a 60-minute hands-on review session with local domain stakeholders.`
          ]
        };
      }
      return {
        conceptualGoal: "To establish a dual-purpose urban green space combining flood defense with local food production.",
        criticalPath: [
          "1. Map historical flood contours to identify low-lying agricultural zones.",
          "2. Anchor vertical hydroponic farming walls along the primary concrete flood barriers.",
          "3. Configure kinetic pathways to capture pedestrian traffic energy for irrigation pumps.",
          "4. Launch community compost programs to nourish the vertical farm beds."
        ],
        riskAssessment: [
          "1. Over-saturation: Extreme storms could flood the agricultural beds if drainage thresholds are exceeded.",
          "2. Energy mismatch: Low pedestrian traffic during winter may require battery backup for lighting."
        ],
        requiredResources: [
          "Kinetic paving materials",
          "Hydroponic wall structures",
          "Community compost digesters",
          "Volunteer coordination platform"
        ],
        milestones: [
          "Month 3: Flood defense wall structural reinforcement complete.",
          "Month 6: First seasonal hydroponic harvest distributed to local community.",
          "Month 12: Kinetic energy grid fully self-sustaining."
        ],
        nextSteps: [
          "Consult local environmental engineers for contour analysis.",
          "Host a community meeting to recruit initial farming volunteers."
        ]
      };
    }
    
    const cacheKey = this.generateCreativePlanCacheKey(problem, insights);
    if (this.creativePlanCache.has(cacheKey)) {
        return this.creativePlanCache.get(cacheKey)!;
    }

    const promise = this._generateCreativePlan(problem, insights);
    this.creativePlanCache.set(cacheKey, promise);
    return promise;
  }

  private async _generateCreativePlan(problem: string, insights: SavedInsight[]): Promise<CreativePlan> {
    return this._withRetries(async () => {
      const response = await fetch('/api/creative-plan', {
        method: 'POST',
        headers: this.getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          problem,
          insights
        })
      });

      if (!response.ok) {
        let errorMsg = `Server returned ${response.status} ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData && errData.error) errorMsg = errData.error;
        } catch {
          // Ignore error parsing, fall back to default msg
        }
        throw new Error(errorMsg);
      }

      return response.json();
    });
  }

  // ─── Agentic Pipeline Methods ─────────────────────────────────────────

  async selectStrategies(problem: string, mode: string): Promise<StrategySelection> {
    return this._withRetries(async () => {
      const response = await fetch('/api/agent/select', {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ problem, mode }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || `Server returned ${response.status}`);
      }
      return response.json();
    });
  }

  async runDebate(problem: string, insights: InsightResult[], strategies: CreativeStrategy[]): Promise<DebateEntry[]> {
    return this._withRetries(async () => {
      const response = await fetch('/api/agent/debate', {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ problem, insights, strategies }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || `Server returned ${response.status}`);
      }
      return response.json();
    });
  }

  async refineInsights(
    problem: string,
    insights: InsightResult[],
    debates: DebateEntry[]
  ): Promise<{ refinedInsights: RefinedInsight[]; consensus: string }> {
    return this._withRetries(async () => {
      const response = await fetch('/api/agent/refine', {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ problem, insights, debates }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || `Server returned ${response.status}`);
      }
      return response.json();
    });
  }

  async runAgenticPipeline(
    problem: string,
    mode: 'creative' | 'care',
    onPhaseChange: (phase: AgenticPhase) => void,
    onUpdate: (partial: Partial<AgenticResult>) => void,
    gist?: string
  ): Promise<AgenticResult> {
    if (this.isDemoMode()) {
      onPhaseChange('selecting');
      const selection = {
        selectedIds: ['what-if', 'constraints', 'critical-path', 'fmea'],
        reasoning: 'Balancing divergent lateral provocation with grounding failure-mode analysis and dependency sequencing.',
        problemCategory: mode === 'care' ? 'clinical & family care' : 'systemic innovation'
      };
      onUpdate({ selection });

      onPhaseChange('generating');
      const initialInsights = this.getMockInsights(problem, [
        { id: 'what-if', name: 'What If?', description: '', icon: 'sparkles', color: '#8E75C2' },
        { id: 'critical-path', name: 'Critical Path Method', description: '', icon: 'git-branch', color: '#38BDF8' }
      ], mode);
      onUpdate({ selection, initialInsights });

      onPhaseChange('debating');
      const debate: DebateEntry[] = [
        {
          agentId: 'fmea',
          agentName: 'FMEA (Risk Analysis)',
          targetInsight: initialInsights[0]?.insights[0]?.text || 'Initial insight',
          critique: 'This provocation overlooks caregiver fatigue thresholds during the initial 72 hours.',
          strengthens: false,
          suggestedRefinement: 'Pair the creative intervention with a structured caregiver relief schedule.'
        },
        {
          agentId: 'critical-path',
          agentName: 'Critical Path Method',
          targetInsight: initialInsights[0]?.insights[0]?.text || 'Initial insight',
          critique: 'Strong concept, but requires step 1 equipment clearance before initiation.',
          strengthens: true,
          suggestedRefinement: 'Sequence equipment installation on day 1 followed by gradual engagement.'
        }
      ];
      onUpdate({ selection, initialInsights, debate });

      onPhaseChange('refining');
      const refinedInsights: RefinedInsight[] = [
        {
          original: initialInsights[0]?.insights[0]?.text || 'Initial insight',
          refined: 'Structured, paced engagement with verified equipment clearance and designated respite intervals.',
          debateInfluences: ['FMEA (Risk Analysis)', 'Critical Path Method'],
          confidence: 0.94
        }
      ];
      const consensus = 'The panel converged on an asset-based strategy grounded in strict sequence dependencies and caregiver sustainability.';
      const synthesisActionBridge = {
        divergentLeap: 'Reimagining the recovery environment through adaptive micro-engagements.',
        groundingGuardrail: 'Mandatory 72-hour transition safety check and non-negotiable caregiver respite.',
        immediateTractionStep: 'Confirm walker path clearance and schedule weekend family respite handoff.'
      };
      onUpdate({ selection, initialInsights, debate, refinedInsights, consensus, synthesisActionBridge });

      onPhaseChange('complete');
      return {
        selection,
        initialInsights,
        debate,
        refinedInsights,
        consensus,
        synthesisActionBridge
      };
    }

    return this._withRetries(async () => {
      const response = await fetch('/api/agent/pipeline', {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ problem, mode, gist }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || `Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is not readable');

      const decoder = new TextDecoder();
      let result: Partial<AgenticResult> = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') break;
            if (dataStr) {
              try {
                const data = JSON.parse(dataStr);
                if (data.error) throw new Error(data.error);

                if (data.phase) {
                  onPhaseChange(data.phase as AgenticPhase);

                  if (data.result) {
                    switch (data.phase) {
                      case 'selecting':
                        result.selection = data.result;
                        break;
                      case 'generating':
                        result.initialInsights = data.result;
                        break;
                      case 'debating':
                        result.debate = data.result;
                        break;
                      case 'refining':
                        result.refinedInsights = data.result.refinedInsights;
                        result.consensus = data.result.consensus;
                        result.synthesisActionBridge = data.result.synthesisActionBridge;
                        break;
                      case 'complete':
                        result = data.result;
                        break;
                    }
                    onUpdate({ ...result });
                  }
                }
              } catch (e) {
                if ((e as Error).message?.includes('PII') || (e as Error).message?.includes('API')) {
                  throw e;
                }
                // Ignore partial parse errors
              }
            }
          }
        }
      }

      return result as AgenticResult;
    }, 1); // Only 1 retry for the pipeline (it's expensive)
  }

  private isDemoMode(): boolean {
    return getStoredApiKey() === 'demo-key-active';
  }

  private getMockInsights(problem: string, strategies: CreativeStrategy[], mode: 'creative' | 'care'): InsightResult[] {
    const textLower = problem.toLowerCase();
    const isDefaultCreativeQuery = textLower.includes('municipal') || textLower.includes('flood') || textLower.includes('park');
    const isDefaultCareQuery = textLower.includes('grandmother') || textLower.includes('fracture') || textLower.includes('garden');

    return strategies.map(s => {
      const sId = s.id;
      const strategyName = mode === 'care' ? (s.careModeName || s.name) : s.name;
      let insights: { text: string; influence?: string }[] = [];

      if (mode === 'creative' && isDefaultCreativeQuery) {
        if (sId === 'butterfly') {
          insights = [
            { text: "Plant water-loving willow and river birch trees along the lowest contours so their roots hold the soil and soak up standing rainwater naturally." },
            { text: "Line main walking paths with solar-charged LED bollard lights and permeable gravel edges that drain puddles while keeping evening strolls safe." }
          ];
        } else if (sId === 'combinatorial') {
          insights = [
            { text: "Plant climbing beans, peas, and espaliers along the sunny side of terraced retaining walls so flood-control structures double as vertical garden space." },
            { text: "Pair neighborhood yard-waste drop-off bins with a three-bay wooden compost station right next to the raised beds so volunteers always have rich soil on hand." }
          ];
        } else if (sId === 'first-principles') {
          insights = [
            { text: "Focus on passive gravity drainage first: contour the main lawn into a gentle grass bowl that holds heavy storm runoff for 24 hours and stays dry for picnics the rest of the week." },
            { text: "Use the park's existing pavilion roofs to feed 250-gallon rain barrels at the top of the slope so volunteers can water lower garden beds with simple gravity hoses." }
          ];
        } else if (sId === 'perma-strengths') {
          insights = [
            { text: "Harness community signature strengths: invite local carpenters and artists to co-create sensory botanical pavilions, cultivating deep engagement, shared meaning, and pride." },
            { text: "Apply Seligman's Learned Optimism: treat urban heat islands not as permanent climate defeats, but as temporary, local challenges solvable through micro-canopy interventions." }
          ];
        } else if (sId === 'kinship-triad') {
          insights = [
            { text: "Cross-generational co-design: pair elementary school children with retired master gardeners to design self-guided sensory walking trails, weaving youth wonder with elder horticultural knowledge." },
            { text: "Create an oral history listening bench under shaded trellises, where visitors scan QR codes to hear stories recorded by neighborhood elders about the park's botanical heritage." }
          ];
        } else if (sId === 'opposite') {
          insights = [
            { text: "Instead of trying to pipe all rainwater out of the park immediately, shape the lowest corner into a planted rain garden with stone stepping paths that safely holds storm runoff." },
            { text: "Rather than expecting every neighbor to walk to the park to harvest produce, set up a weekly Saturday farm-stand cart by the main sidewalk and bus stop." }
          ];
        } else if (sId === 'superpower') {
          insights = [
            { text: "Remove heavy lifting from park upkeep: connect raised beds to simple float-valve drip lines fed by rainwater tanks so beds water themselves during dry spells." },
            { text: "Boost soil sponge capacity naturally: mix deep compost and clover cover crops into compacted turf areas so the ground absorbs twice as much rain before puddling." }
          ];
        } else if (sId === 'fmea') {
          insights = [
            { text: "Pre-mortem critical risk: Silt clogging subterranean drainage pipes during high-turbidity floods. Guardrail: Install modular, surface-accessible gravel filtration beds that can be backwashed and serviced without heavy excavators." },
            { text: "Pre-mortem secondary risk: Electrical failure to floodgate telemetry during severe storms. Guardrail: Implement counterweight gravitational release valves that trip automatically when water reaches a 3-foot threshold." }
          ];
        } else if (sId === 'boundary-dissolution') {
          insights = [
            { text: "Erase the boundary between park visitors and botanical stewards: transform bench backs into modular seed-starter racks where everyday visitors nurture native wetland plants in situ." },
            { text: "Dissolve the park perimeter: replace fences with permeable bio-swales that bleed effortlessly into surrounding sidewalks, absorbing street runoff into an unbordered urban sponge." }
          ];
        } else if (sId === 'system-fractal') {
          insights = [
            { text: "Zoom to the parent river basin: rather than engineering local retaining ponds, coordinate upstream agricultural runoff wetlands to absorb flash surges before they reach urban park boundaries." },
            { text: "Fractal modularity: design miniature bioswales in street curbs that replicate the large central wetland at 1:100 scale, multiplying flood retention exponentially across the city grid." }
          ];
        } else if (sId === 'feedback-loop') {
          insights = [
            { text: "Close the seasonal nutrient loop: chop fallen autumn leaves from the park's shade trees right into the garden mulch beds so winter rain breaks them down into spring soil." },
            { text: "Self-reinforcing adoption loop: every completed community plot yields free compost and native seeds for adjacent plots, accelerating neighborhood ownership and stewardship." }
          ];
        } else if (sId === 'perspective-inversion') {
          insights = [
            { text: "From the perspective of local wildlife: plant layered native berry shrubs and shade trees along the perimeter to provide natural pest control and cool down the walking paths." },
            { text: "From the perspective of a 50-year city groundskeeper: choose hardy, drought-tolerant perennial herbs and durable stone seating that require minimal weekly upkeep." }
          ];
        } else if (sId === 'nature') {
          insights = [
            { text: "Natural Terracing: Use simple wood-and-stone check dams along sloped paths to slow down heavy rainwater so it soaks into the garden beds instead of washing away topsoil." },
            { text: "Woodchip Mulch Sponges: Line walking paths with deep arborist woodchips that absorb storm runoff like a sponge while keeping fruit tree roots moist during dry weeks." }
          ];
        } else if (sId === 'what-if') {
          insights = [
            { text: "What if the lowest, wettest corner of the park became an asset? Plant water-loving native species and raised cedar beds there so heavy rain waters the crops automatically." },
            { text: "What if the park required almost no municipal watering? Group hardy perennial fruit bushes and herbs together in mulched rain basins that capture runoff from nearby paved paths." }
          ];
        } else if (sId === 'constraints') {
          insights = [
            { text: "Low-Budget Materials: Instead of expensive poured concrete walls, use rock-filled wire baskets (gabions) and native shrubs to stabilize slopes and slow down runoff." },
            { text: "No-Hose Irrigation: Angle walkways slightly toward adjacent planting beds so rain naturally drains into the soil where trees and vegetables grow." }
          ];
        } else if (sId === 'child') {
          insights = [
            { text: "Make water flow visible and educational: add simple, safe rain chains and open stone channels from pavilion roofs so families can watch rainwater travel into the garden beds." },
            { text: "Organize edible beds by height—strawberries at the front border, blueberries in the middle, and dwarf apple trees in the back—making picking intuitive and accessible for kids and seniors." }
          ];
        } else if (sId === 'future') {
          insights = [
            { text: "Plant for the 10-Year Canopy: Space fast-growing shade trees alongside slow-maturing nut and fruit trees now so the park gets cooler and more productive each summer." },
            { text: "Simple Seasonal Signage: Post clear weatherproof signs at the park entrance showing what is ripe to pick this month and how the rain basins protect the neighborhood." }
          ];
        } else if (sId === 'simplify') {
          insights = [
            { text: "Start with one repeatable layout: a standard 8x4ft raised bed paired with a rain barrel and bench that volunteers can easily build and maintain across the park." },
            { text: "Keep community rules simple: post a clear 'Take a little, tend a little' guide at each bed so neighbors know what is ready to harvest and how to help weed." }
          ];
        } else if (sId === 'critical-path') {
          insights = [
            { text: "Step 1: Shape the drainage swales and gravel paths first so heavy rain has a safe place to go before any garden soil is added." },
            { text: "Step 2: Plant hardy cover crops and deep-rooted native grasses in Season 1 to hold the soil in place before planting fruit trees in Season 2." }
          ];
        }
      } else if (mode === 'care' && STARTER_SCENARIOS.some(sc => sc.prompt === problem || textLower.includes(sc.category) || textLower.includes(sc.title.toLowerCase())) && !isDefaultCareQuery) {
        const matched = STARTER_SCENARIOS.find(sc => sc.prompt === problem || textLower.includes(sc.category) || textLower.includes(sc.title.toLowerCase()))!;
        const ctx = matched.domainContext;
        if (sId === 'what-if') {
          insights = [
            { text: `What if success is measured by joyful participation and laughter in ${matched.categoryLabel}, rather than physical performance speed?`, influence: "P (Positive Emotion): Re-centers the human spirit and intrinsic joy." },
            { text: `What if we adapt the home environment so ${matched.gist.charAt(0).toLowerCase() + matched.gist.slice(1)}`, influence: "Accomplishment (A): Micro-mastery without strain." }
          ];
        } else if (sId === 'butterfly') {
          insights = [
            { text: ctx ? ctx.sampleInterventions[0] : `Introduce a gentle 10-minute micro-habit around ${matched.categoryLabel}.`, influence: "Agency (A): Smallest friction-free adjustment with highest cascading confidence." },
            { text: ctx && ctx.sampleInterventions[1] ? ctx.sampleInterventions[1] : "Schedule active moments during peak vitality hours with a warm tea handoff.", influence: "Vitality (+H): Sustainable physical stamina." }
          ];
        } else if (sId === 'kinship-triad') {
          insights = [
            { text: ctx ? ctx.relational : `Involve multiple generations in ${matched.categoryLabel} rituals so the elder is mentor, not passive recipient.`, influence: "Relationships (R): Distributes family care joyfully while protecting caregiver respite." },
            { text: `Create a dedicated weekly family circle celebrating shared memories and creative milestones in ${matched.categoryLabel}.`, influence: "Meaning (M): Dignity and intergenerational heritage." }
          ];
        } else if (sId === 'respite-pacing') {
          insights = [
            { text: "Establish a non-negotiable weekly 3-hour respite window for the primary family caregiver while a secondary partner or volunteer accompanies the session.", influence: "Vitality (+H): Protects caregiver sustainability and prevents emotional exhaustion." },
            { text: ctx ? ctx.relational : "Share care duties across the family circle with explicit handoff times.", influence: "Relationships (R): Respite invariant." }
          ];
        } else if (sId === 'sensory-bridge') {
          insights = [
            { text: ctx ? ctx.ecosystem : `Design a sensory sanctuary for ${matched.categoryLabel} with ergonomic seating and warm lighting.`, influence: "Engagement (E): Creates tactile, auditory, and environmental safety." },
            { text: "Incorporate calming acoustic elements and warm natural lighting to ease nervous system guarding.", influence: "Vitality (+H): Parasympathetic restoration." }
          ];
        } else if (sId === 'perma-strengths') {
          insights = [
            { text: ctx ? ctx.identityAssets : `Anchor self-worth in mastery of ${matched.categoryLabel} and lived wisdom.`, influence: "Meaning (M): Amplifies enduring signature strengths separate from physical limitations." },
            { text: `Celebrate daily micro-mastery milestones in ${matched.categoryLabel}.`, influence: "Accomplishment (A): Flourishing." }
          ];
        } else if (sId === 'fmea') {
          insights = [
            { text: `Pre-mortem fatigue hazard: Overexertion during ${matched.categoryLabel}. Guardrail: Enforce 15-minute gentle seated checkpoints with hydration.`, influence: "Safety: Prevents post-exertional crash." },
            { text: "Pre-mortem isolation: Caregiver or elder carrying the emotional load alone. Guardrail: Weekly shared check-in with family circle.", influence: "Relational support: Respite protection." }
          ];
        } else {
          insights = [
            { text: ctx && ctx.sampleInterventions[2] ? ctx.sampleInterventions[2] : `Integrate ${matched.categoryLabel} with ergonomic adaptations and gentle pacing.`, influence: "Well-being: Grounded practical step." },
            { text: ctx ? ctx.perspectives : "Harmonizes safety guidelines, lived experience, and flourishing.", influence: "Perspectives (P): Triad alignment." }
          ];
        }
      } else if (mode === 'creative' && STARTER_SCENARIOS.some(sc => sc.mode === 'creative' && (sc.prompt === problem || textLower.includes(sc.title.toLowerCase()))) && !isDefaultCreativeQuery) {
        const matched = STARTER_SCENARIOS.find(sc => sc.mode === 'creative' && (sc.prompt === problem || textLower.includes(sc.title.toLowerCase())))!;
        if (matched.id === 'creative-eco') {
          insights = [
            { text: `Use scalloped leading-edge blades (modeled on whale fins) so small rooftop wind rotors spin smoothly in gusty city breezes without loud whistling.` },
            { text: `Place compact vertical rotors near existing rooftop exhaust vents and parapet corners where wind naturally speeds up, using rubber mounts so vibration never reaches apartments below.` }
          ];
        } else if (matched.id === 'creative-craft') {
          insights = [
            { text: `Pair retired machinists and woodworkers with local high school students to build simple, sturdy everyday helpers—like custom jar openers, lever door handles, and magnetic tool holders.` },
            { text: `Host a monthly Saturday 'Fix-It & Coffee' table at the community center where neighbors bring wobbly chairs, lamps, or walkers for shared repairs and practical conversation.` }
          ];
        } else if (matched.id === 'creative-astronomy') {
          insights = [
            { text: `Use simple angled roof reflectors and light-colored interior walls to bounce natural winter daylight into shaded reading corners without glare.` },
            { text: `Pair warm, dimmable reading lamps in the late afternoon with comfortable acoustic seating and indoor greenery to create a calm, welcoming winter gathering spot.` }
          ];
        }
      } else if (mode === 'care' && isDefaultCareQuery) {
        if (sId === 'what-if') {
          insights = [
            { text: "Create a 'garden-on-wheels' rolling planter cart. This allows indoor seed preparation during bad weather, keeping them active regardless of external constraints.", influence: "Builds upper-body mobility and maintains consistent activity levels on rest days." },
            { text: "Place a high-contrast guide marker along the garden pathway to visualize clear, short-distance milestones, building confidence with every physical step.", influence: "Minimizes gait anxiety and gives clear, low-risk progress visual markers." }
          ];
        } else if (sId === 'butterfly') {
          insights = [
            { text: "Install lightweight, automatic drip-irrigation timers. This removes the physical burden of carrying heavy watering cans, which is the primary driver of falls in gardens.", influence: "Eliminates unsafe weight-bearing lifting and reduces fatigue by 40%." },
            { text: "Place a comfortable garden chair at 10-foot intervals along the path. Knowing a safe resting spot is nearby significantly reduces walking anxiety.", influence: "Provides immediate orthostatic recovery options and builds distance stamina." }
          ];
        } else if (sId === 'opposite') {
          insights = [
            { text: "Invert the activity schedule: rather than scheduling physical therapy in the morning fatigue window, schedule gentle garden potting in the early evening golden hour when muscles are naturally warm and family members are present to assist.", influence: "Reduces morning stiffness resistance and leverages natural family circulation." },
            { text: "Flip the tool direction: instead of reaching outward into deep raised beds, mount swivel planter trays on the patio railing that swing directly inward to her seated position.", influence: "Preserves hip precautions while allowing full upper-body engagement." }
          ];
        } else if (sId === 'superpower') {
          insights = [
            { text: "Make daily gardening effortless on the joints: use cushioned, long-handled hand tools and a waist-high coiled garden hose so she never has to bend down or lift heavy cans.", influence: "Removes joint load while restoring independent autonomy and pride." },
            { text: "Place fragrant lavender and jasmine in window boxes right outside her bedroom and patio to create a calm, relaxing evening atmosphere that supports restful sleep.", influence: "PERMA Health & Vitality: elevates restorative sleep quality without pharmaceutical sedation." }
          ];
        } else if (sId === 'fmea') {
          insights = [
            { text: "Pre-mortem fall risk: Wet flagstones or garden hose tangles causing a secondary hip trauma. Guardrail: Lay non-slip rubberized cedar pathway runners and wall-mounted auto-retracting hose reels at waist height.", influence: "Eliminates the #1 environmental hazard for secondary orthopedic injury." },
            { text: "Pre-mortem caregiver burnout: Primary family caregiver feeling solely responsible for supervision. Guardrail: Coordinate a weekly 3-hour shared garden club with neighbors to ensure protected caregiver respite.", influence: "Respite Invariant: shields the primary caregiver from fatigue while expanding the elder's social mesh." }
          ];
        } else if (sId === 'first-principles') {
          insights = [
            { text: "Focus on the core sensory need: touch and smell. Prioritize planting highly fragrant herbs like lavender and rosemary at waist height, maximizing emotional comfort with minimal strain.", influence: "Engages cognitive memory triggers and provides visual delight without requiring forward flexion." },
            { text: "Redefine the physical stance. Allow all seed sorting and transplanting to take place at a standard table height with footrests, ensuring knee and hip angles remain safe.", influence: "Maintains optimal joint protection guidelines while preserving gardening participation." }
          ];
        } else if (sId === 'perma-strengths') {
          insights = [
            { text: "Activate the VIA Strength of 'Love of Learning': introduce heritage seed-saving journals so each day in the garden is experienced as intellectual curiosity and micro-mastery.", influence: "PERMA Accomplishment & Engagement: transforms rehabilitation into a meaningful cognitive pursuit." },
            { text: "Foster PERMA Relationships: invite a grandchild or neighbor to plant companion flowers, creating positive emotional resonance and shared accomplishment.", influence: "PERMA Positive Emotion & Relationships: elevates mood and strengthens the social support ecosystem." }
          ];
        } else if (sId === 'kinship-triad') {
          insights = [
            { text: "Establish a 3-Generation Garden Circle: Granddaughter draws color markers and plays music, Grandmother shares heirloom planting wisdom at table height, and Mother receives 45 minutes of peaceful respite.", influence: "Distributes care joyfully across generations, preventing caregiver burnout while honoring elder dignity." },
            { text: "Create a Heritage Seed Album: Grandson photographs and labels daily sprouting progress on a tablet while Grandfather demonstrates traditional wooden seed trays.", influence: "Connects generational curiosity and craftsmanship into a shared micro-mastery milestone." }
          ];
        } else if (sId === 'boundary-dissolution') {
          insights = [
            { text: "The Patient is Not the Pathology: Separate the hip trauma from her lifelong identity as an expert horticulturist. Re-engage her editorial eye by having her curate the neighborhood autumn seed catalog from a comfortable armchair.", influence: "Distinctions (D): Anchors self-worth and motivation in unaffected cognitive passions." },
            { text: "Dissolve the boundary between physical rehabilitation and joyful hobby: treat soil mixing, bulb sorting, and seedling propagation as natural fine-motor dexterity and core stabilization micro-actions.", influence: "Distinctions (D): Erases the sterile clinical border, transforming therapy into genuine joy." }
          ];
        } else if (sId === 'system-fractal') {
          insights = [
            { text: "Ecosystem of Recovery: Balance autonomic vagal tone before physical movement. Practice 4-7-8 diaphragmatic breathwork beside a lavender diffuser for 5 minutes prior to standing up, downregulating cortisol and easing muscle guarding.", influence: "Systems (S): Restores parasympathetic balance, reducing autonomic pain hypersensitivity before movement." },
            { text: "Circadian Sleep Architecture: Optimize the 24-hour cycle. Schedule 15 minutes of morning sun on the porch to reinforce melatonin onset, safeguarding restorative deep sleep architecture for orthopedic tissue remodeling.", influence: "Systems (S): Leverages circadian rhythms to accelerate cellular tissue repair." }
          ];
        } else if (sId === 'feedback-loop') {
          insights = [
            { text: "The Relational Care Bridge: Break the pain-fear-immobility feedback loop. When hesitation strikes, have a family partner join in a seated rhythmic clapping or foot-tapping song to bypass gait freezing at the lowest friction point.", influence: "Relationships (R): Dismantles the vicious pain-fear cycle through shared human warmth." },
            { text: "Intergenerational Micro-Task Bridge: Pair the 10-year-old grandchild with watering tasks while grandmother provides gentle direction, turning clinical care into playful family bonding and protecting caregiver respite.", influence: "Relationships (R): PERMA Relationships: transforms recovery into multi-generational joy." }
          ];
        } else if (sId === 'perspective-inversion') {
          insights = [
            { text: "The Triad Perspective Shift: Align the 3 vital lenses. Balance the Orthopedist's 90-degree flexion rule with the Patient's fear of re-injury through the Future Self's lens: envisioning walking effortlessly at her granddaughter's spring graduation.", influence: "Perspectives (P): Harmonizes biomechanical safety with emotional reality and future-oriented hope." },
            { text: "The Plant's Perspective: Reframe recovery through perennial roots. Remind her that dormant winter roots establish the strongest spring blooms—patience and micro-steps are active growth, not stagnation.", influence: "Perspectives (P): Shifts mindset from frustration to organic, compassionate patience." }
          ];
        } else if (sId === 'respite-pacing') {
          insights = [
            { text: "Protected Saturday Respite: Schedule a non-negotiable 3.5-hour Saturday morning respite window for the primary family caregiver while a neighbor garden buddy shares herbal tea and seed-sorting on the porch.", influence: "Vitality (+H): Protects caregiver stamina and prevents emotional burnout." },
            { text: "20-Minute Micro-Pacing Timer: Pair active standing at the raised bed with a gentle wind-chime timer every 20 minutes to prompt seated hydration before orthostatic fatigue begins.", influence: "Health (+H): Prevents post-exertional pain flare-ups." }
          ];
        } else if (sId === 'constraints') {
          insights = [
            { text: "Zero-Bending Constraint: Elevate all seedling flats, herbdrying racks, and botanical pressings onto a 32-inch waist-high redwood potting bench with a cushioned barstool.", influence: "Accomplishment (A): Preserves 100% of hip precaution boundaries without sacrificing botanical mastery." },
            { text: "One-Handed Leverage: Use long-handled ergonomic ratcheting pruners and self-watering capillary mats so daily plant care requires zero heavy lifting.", influence: "Agency (A): Restores independent daily garden stewardship." }
          ];
        } else if (sId === 'critical-path') {
          insights = [
            { text: "Phase 1 (Days 1–3): Clear level 36-inch walker pathways from the patio door to the raised planter and verify non-slip cedar mat placement.", influence: "Safety: Establishes physical clearance before any outdoor mobility." },
            { text: "Phase 2 (Days 4–14): Transition from 10-minute seated indoor seed cataloging to 15-minute supported standing sessions at the waist-high herb bed.", influence: "Accomplishment (A): Structured, confidence-building progression." }
          ];
        } else if (sId === 'sensory-bridge') {
          insights = [
            { text: "Aromatic Tactile Sanctuary: Plant silver sage, lemon verbena, and French lavender at hand height along the porch railing so brushing past releases calming essential oils.", influence: "Positive Emotion (P): Downregulates sympathetic guarding through olfactory and tactile grounding." },
            { text: "Acoustic Rhythm Pacing: Play warm acoustic folk or classical guitar tracks at 60 BPM during morning mobility routines to entrain relaxed breathing and steady gait cadence.", influence: "Engagement (E): Turns physical therapy into a soothing sensory ritual." }
          ];
        } else if (sId === 'found-kinship') {
          insights = [
            { text: "Neighborhood Seed-Swap Circle: Invite two fellow retired gardeners from the street for a Thursday afternoon porch cutting exchange, expanding social support beyond immediate family.", influence: "Relationships (R): Builds chosen community mesh and relieves primary caregiver load." },
            { text: "Local Botanical Society Pen-Pal: Pair her heirloom seed-saving logs with a local elementary school garden club that visits monthly to receive her labeled seed packets.", influence: "Meaning (M): Honors her status as a community botanical mentor." }
          ];
        }
      }

      // Context-aware dynamic fallback for custom prompts or other strategies in Demo Mode
      if (insights.length === 0) {
        const snippet = problem.trim().length > 60 ? `${problem.trim().slice(0, 57)}...` : problem.trim();
        insights = [
          {
            text: `${strategyName} Approach: Look at the most frustrating step in "${snippet}" and simplify it using existing household or neighborhood resources so it takes half the effort.`,
            ...(mode === 'care' && { influence: `Builds everyday confidence and comfort without adding extra burden.` })
          },
          {
            text: `Simple 15-Minute Trial: Test this adjustment once over the next two days with a family member or friend, keeping what feels natural and setting aside anything that feels complicated.`,
            ...(mode === 'care' && { influence: `Protects caregiver rest and keeps the routine low-stress.` })
          }
        ];
      }

      return {
        strategyName,
        insights
      };
    });
  }

  /**
   * Translates text or a structured object into the specified target language using Gemini.
   */
  async translateContent(
    content: string | Record<string, unknown>,
    targetLanguage: string,
    contentType = 'general'
  ): Promise<{ translatedText?: string; translated?: Record<string, unknown> }> {
    return this._withRetries(async () => {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: this.getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          content,
          targetLanguage,
          contentType
        })
      });

      if (!response.ok) {
        let errorMsg = `Server returned ${response.status} ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData && errData.error) errorMsg = errData.error;
        } catch {
          // Ignore parsing error
        }
        throw new Error(errorMsg);
      }

      return response.json();
    });
  }

  /**
   * Exports saved items into a standardized DPO (Direct Preference Optimization) JSONL dataset format.
   */
  exportDpoDataset(savedItems: SavedItem[], orcidId?: string, orcidName?: string): string {
    const lines: string[] = [];

    // Header metadata record
    const meta = {
      _metadata: {
        format: 'DPO_JSONL_PAIRWISE_PREFERENCES',
        version: '1.0.0',
        license: 'Apache-2.0',
        creator: orcidName || 'Pivot & Pulse Researcher',
        orcid: orcidId ? `https://orcid.org/${orcidId}` : 'https://orcid.org/0009-0008-1372-5381',
        exportedAt: new Date().toISOString(),
        alignmentFramework: 'UPenn PERMA+H & VIA Character Strengths'
      }
    };
    lines.push(JSON.stringify(meta));

    savedItems.forEach((item) => {
      if (item.type === 'insight') {
        const prompt = `[Goal/Problem]: ${item.problem}\n[Strategy]: ${item.strategyName}`;
        const chosen = item.text;
        const rejected = `Generic advice: Try harder and adhere to standard protocols without adapting your environment or activating signature strengths.`;

        lines.push(JSON.stringify({
          prompt,
          chosen,
          rejected,
          strategy: item.strategyName,
          type: 'insight'
        }));
      } else if (item.type === 'care-plan') {
        const prompt = `[Clinical Support Challenge]: ${item.problem}\n[Task]: Synthesize a personalized, PERMA+H aligned Care Plan.`;
        const chosen = JSON.stringify(item.plan, null, 2);
        const rejected = JSON.stringify({
          personGoal: "Patient must follow protocol",
          keyInterventions: ["Take meds as ordered", "Do not miss appointments"],
          monitoringPlan: ["Track vitals"],
          guidanceAndEducation: ["Read standard brochure"],
          positiveAchievements: ["None reported"],
          recommendations: ["Return in 3 months"]
        }, null, 2);

        lines.push(JSON.stringify({
          prompt,
          chosen,
          rejected,
          type: 'care-plan'
        }));
      } else if (item.type === 'creative-plan') {
        const prompt = `[Creative Challenge]: ${item.problem}\n[Task]: Synthesize an actionable Creative Plan.`;
        const chosen = JSON.stringify(item.plan, null, 2);
        const rejected = JSON.stringify({
          conceptualGoal: "Solve problem",
          criticalPath: ["Step 1", "Step 2"],
          riskAssessment: ["High risk"],
          requiredResources: ["Budget"],
          milestones: ["Finish"],
          nextSteps: ["Start working"]
        }, null, 2);

        lines.push(JSON.stringify({
          prompt,
          chosen,
          rejected,
          type: 'creative-plan'
        }));
      }
    });

    return lines.join('\n');
  }

  /**
   * Checks on-device local AI availability (Chrome Prompt API, Local Ollama, WebGPU)
   */
  async checkOnDeviceCapabilities(): Promise<{
    chromeAiAvailable: boolean;
    ollamaAvailable: boolean;
    ollamaModels: string[];
    webGpuAvailable: boolean;
  }> {
    let chromeAiAvailable = false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof window !== 'undefined' && 'ai' in window && 'languageModel' in (window as any).ai) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cap = await (window as any).ai.languageModel.capabilities?.();
        chromeAiAvailable = cap && cap.available !== 'no';
      }
    } catch {
      chromeAiAvailable = false;
    }

    let webGpuAvailable = false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof navigator !== 'undefined' && 'gpu' in navigator && (navigator as any).gpu) {
        webGpuAvailable = true;
      }
    } catch {
      webGpuAvailable = false;
    }

    let ollamaAvailable = false;
    let ollamaModels: string[] = [];
    try {
      const res = await fetch('/api/local-llm/status');
      if (res.ok) {
        const data = await res.json();
        ollamaAvailable = data.available;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ollamaModels = (data.models || []).map((m: any) => m.name || m);
      }
    } catch {
      ollamaAvailable = false;
    }

    return { chromeAiAvailable, ollamaAvailable, ollamaModels, webGpuAvailable };
  }

  /**
   * Pre-warms the local model in workstation GPU VRAM (keep_alive: permanent)
   */
  async prewarmLocalVram(model = 'pivotpulse'): Promise<boolean> {
    try {
      const res = await fetch('/api/local-llm/prewarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model })
      });
      if (res.ok) {
        const data = await res.json();
        return !!data.success;
      }
    } catch {
      // ignore
    }
    return false;
  }
}