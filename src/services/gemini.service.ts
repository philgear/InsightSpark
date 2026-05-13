import { Injectable } from '@angular/core';
import { CreativeStrategy, InsightResult, SavedInsight, CarePlan, StructuredProblem } from '../models/creative-types';
import { parse } from 'partial-json';

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

  constructor() {}

  /**
   * Clears all caches. Called when starting a new session.
   */
  public clearCache(): void {
    this.insightCache.clear();
    this.structureCache.clear();
    this.carePlanCache.clear();
  }

  /**
   * Wraps an async API call with retry logic using exponential backoff.
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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ problem })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status} ${response.statusText}`);
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
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            problem,
            strategies,
            mode,
            gist,
            healthSnapshot
          })
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status} ${response.statusText}`);
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
                      } catch (e) {
                         // Ignore partial parse errors, just wait for next chunk
                      }
                    }
                  } else if (data.error) {
                    throw new Error(data.error);
                  }
                } catch(e) {
                  // ignore JSON parse error for SSE message wrapper
                }
              }
            }
          }
        }
        
        // Final parsing attempt to ensure we get everything if onUpdate wasn't called on the last chunk
        try {
           const finalParsed = parse(buffer);
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
      if (strategies.length > 0) {
        throw new Error("Failed to generate any insights. Please check your connection or try again.");
      }
      return [];
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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          problem,
          insights
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status} ${response.statusText}`);
      }

      return response.json();
    });
  }
}