import { Injectable } from '@angular/core';
import { CreativeStrategy, InsightResult, SavedInsight, CarePlan, StructuredProblem, CreativePlan } from '../models/creative-types';
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
  } catch (e) {
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

  async structureHealthGoal(problem: string): Promise<StructuredProblem> {
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
    const cacheKey = problem.trim();
    if (this.structureCache.has(cacheKey)) {
        return this.structureCache.get(cacheKey)!;
    }

    const promise = this._structureHealthGoal(problem);
    this.structureCache.set(cacheKey, promise);
    return promise;
  }

  private async _structureHealthGoal(problem: string): Promise<StructuredProblem> {
    return this._withRetries(async () => {
      const response = await fetch('/api/structure', {
        method: 'POST',
        headers: this.getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ problem })
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

  private generateInsightCacheKey(problem: string, strategies: CreativeStrategy[], mode: 'creative' | 'care', gist?: string, healthSnapshot?: string): string {
    const strategyIds = strategies.map(s => s.id).sort().join(',');
    return `${problem.trim()}|${strategyIds}|${mode}|${gist?.trim() || ''}|${healthSnapshot?.trim() || ''}`;
  }

  async generateInsights(
    problem: string, 
    strategies: CreativeStrategy[], 
    mode: 'creative' | 'care', 
    gist?: string, 
    healthSnapshot?: string,
    onUpdate?: (partial: InsightResult[]) => void
  ): Promise<InsightResult[]> {
    if (!problem.trim()) return [];
    if (this.isDemoMode()) {
      const mockData = this.getMockInsights(problem, strategies, mode);
      if (onUpdate) {
        setTimeout(() => onUpdate(mockData), 600);
      }
      return mockData;
    }
    
    const cacheKey = this.generateInsightCacheKey(problem, strategies, mode, gist, healthSnapshot);
    if (this.insightCache.has(cacheKey)) {
        return this.insightCache.get(cacheKey)!;
    }

    const promise = this._generateInsights(problem, strategies, mode, gist, healthSnapshot, onUpdate);
    this.insightCache.set(cacheKey, promise);
    return promise;
  }
  
  private async _generateInsights(
    problem: string, 
    strategies: CreativeStrategy[], 
    mode: 'creative' | 'care', 
    gist?: string, 
    healthSnapshot?: string,
    onUpdate?: (partial: InsightResult[]) => void
  ): Promise<InsightResult[]> {
    try {
      const results = await this._withRetries(async () => {
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
            healthSnapshot
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
                        const partial = parse(buffer);
                        
                        // Normalize strategy names on the client
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const normalizedResults = partial.map((result: any) => {
                          const originalStrategy = strategies.find(s => {
                            const sName = mode === 'care' ? s.careModeName || s.name : s.name;
                            return sName.toLowerCase() === (result.strategyName || '').toLowerCase();
                          });
                          if (originalStrategy) {
                            result.strategyName = mode === 'care' ? (originalStrategy.careModeName || originalStrategy.name) : originalStrategy.name;
                          }
                          return result;
                        });
                        
                        finalResults = normalizedResults;
                        onUpdate(normalizedResults);
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
           const finalParsed = parse(buffer);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const normalizedResults = finalParsed.map((result: any) => {
              const originalStrategy = strategies.find(s => {
                const sName = mode === 'care' ? s.careModeName || s.name : s.name;
                return sName.toLowerCase() === (result.strategyName || '').toLowerCase();
              });
              if (originalStrategy) {
                result.strategyName = mode === 'care' ? (originalStrategy.careModeName || originalStrategy.name) : originalStrategy.name;
              }
              return result;
           });
           finalResults = normalizedResults;
        } catch(e) {
           console.error("Final parse failed", e);
        }

        return finalResults;
      });
      return results;
    } catch (error) {
      console.error(`Failed to generate insights for problem: '${problem}'`, error);
      const errMsg = (error as Error).message || "Failed to generate any insights. Please check your connection or try again.";
      throw new Error(errMsg);
    }
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
}