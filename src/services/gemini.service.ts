import { Injectable } from '@angular/core';
import { CreativeStrategy, InsightResult, SavedInsight, CarePlan, StructuredProblem, CreativePlan, SavedItem } from '../models/creative-types';
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
    if (value === 'demo-key-active') {
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
    if (userApiKey) {
      authHeaders['x-gemini-api-key'] = userApiKey;
    }
    const userModel = localStorage.getItem('spark_model_val') || localStorage.getItem('user_gemini_model');
    if (userModel) {
      authHeaders['x-gemini-model'] = userModel;
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
      return {
        title: "Hip Recovery & Gardening Connection",
        condition: "Post-hip fracture recovery",
        goal: "Safely rebuild mobility and maintain emotional well-being through modified gardening activities.",
        barriers: [
          "Fear of falling or re-injury",
          "Inability to bend down or lift heavy watering cans",
          "Fatigue and limited standing tolerance"
        ]
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
        
        // On-device execution branch: Chrome Built-in AI (Gemini Nano)
        const win = window as unknown as { ai?: { languageModel?: { create: (opts: { systemPrompt: string }) => Promise<{ prompt: (p: string) => Promise<string>; destroy?: () => void }> } } };
        if (selectedModel === 'on-device-nano' && typeof win?.ai?.languageModel?.create === 'function') {
          try {
            const systemPrompt = mode === 'care'
              ? 'You are a compassionate, HIPAA-compliant care support partner. Provide creative, positive psychology insights for health goals in valid JSON format matching schema: [{"strategyName": string, "insights": [{"text": string, "influence": string}]}].'
              : 'You are a creative thinking partner. Provide distinct actionable insights matching JSON schema: [{"strategyName": string, "insights": [{"text": string}]}].';
            
            const session = await win.ai.languageModel.create({ systemPrompt });
            const strategyList = strategies.map(s => `- Strategy: ${mode === 'care' ? (s.careModeName || s.name) : s.name}`).join('\n');
            const promptText = `Problem: ${problem}\n\nStrategies:\n${strategyList}\n\nProvide 2 actionable insights per strategy. Output valid JSON array only.`;
            
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
        const values = Object.values(obj);
        if (values.length > 0 && values.some(v => v && typeof v === 'object' && ('strategyName' in v || 'insights' in v))) {
          rawList = values.filter(v => v && typeof v === 'object');
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
            { text: "Plant high-absorption willow groves along the lowest contours. Their roots stabilize soil and absorb up to 250 gallons of water daily, turning a flood risk into a self-watering irrigation system." },
            { text: "Install kinetic stepping stones on main walking paths. The pressure from daily joggers generates low-voltage energy, powering the park's evening safety lighting with zero grid reliance." }
          ];
        } else if (sId === 'combinatorial') {
          insights = [
            { text: "Merge a vertical hydroponic farm with the vertical structural faces of the concrete flood barrier walls, optimizing urban agricultural space while keeping the barrier functional." },
            { text: "Combine community composting chutes directly with public waste bins, feeding organic waste into localized biogas digesters that fuel public cooking grills in the picnic zones." }
          ];
        } else if (sId === 'first-principles') {
          insights = [
            { text: "Identify the core resource needed: energy. Rather than importing solar panels, design the park’s geometry to direct wind flows into micro-turbine channels built directly into standard pedestrian archways." },
            { text: "Deconstruct the idea of a 'park.' It is primarily a land asset. Maximize asset utility by scheduling dual-use hours: educational classrooms by day, flood overflow retention zones during storm events." }
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
        }
      }

      // Fallback if they customized the prompt or strategies
      if (insights.length === 0) {
        insights = [
          {
            text: `[Demo Mode Preview for ${strategyName}] This is a high-quality placeholder. Connect your own Gemini API Key using the 🔑 button in the header to generate custom real-time insights for your prompts.`,
            ...(mode === 'care' && { influence: 'Exposes how the strategy guides care recommendations and indicator mapping.' })
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
   * Checks on-device local AI availability (Chrome Prompt API & Local Ollama)
   */
  async checkOnDeviceCapabilities(): Promise<{
    chromeAiAvailable: boolean;
    ollamaAvailable: boolean;
    ollamaModels: string[];
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

    return { chromeAiAvailable, ollamaAvailable, ollamaModels };
  }
}