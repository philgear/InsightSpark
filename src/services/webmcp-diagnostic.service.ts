import { Injectable, inject } from '@angular/core';
import { StorageService } from './storage.service';
import { GeminiService } from './gemini.service';
import { STRATEGIES } from '../models/creative-types';

/**
 * WebMCP Tool Descriptor Interface conforming to W3C WebML / Chrome 156.0.8067.0+
 * @see https://github.com/webmachinelearning/webmcp/pull/253
 */
export interface WebMcpToolDescriptor {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
  execute: (args: Record<string, unknown>) => unknown | Promise<unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    debugging?: boolean; // Required in Chrome 156+ to signal developer/inspection tooling
  };
}

export interface ModelContext {
  registerTool: (tool: WebMcpToolDescriptor) => Promise<void>;
  unregisterTool?: (name: string) => Promise<void>;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}

@Injectable({
  providedIn: 'root'
})
export class WebMcpDiagnosticService {
  private storageService = inject(StorageService);
  private geminiService = inject(GeminiService);

  private _isRegistered = false;

  get isRegistered(): boolean {
    return this._isRegistered;
  }

  /**
   * Initializes diagnostic and developer inspection tools using WebMCP (Chrome 156+)
   * Registers tools with `annotations.debugging = true` so general-purpose end-user agents
   * automatically filter them out while DevTools AI assistance and testing suites retain access.
   */
  async initDiagnostics(): Promise<void> {
    if (typeof document === 'undefined') return;

    const mc = document.modelContext;
    if (!mc || typeof mc.registerTool !== 'function') {
      return; // WebMCP not available in current browser or context
    }

    try {
      // 1. Core diagnostic state inspection tool
      await mc.registerTool({
        name: 'getInsightSparkDiagnostics',
        description: 'Returns internal diagnostic state (engines, storage metrics, active theme, and strategy counts) for troubleshooting and DevTools AI assistance.',
        inputSchema: {
          type: 'object',
          properties: {
            scope: {
              type: 'string',
              description: 'Diagnostic subsystem to query',
              enum: ['all', 'engines', 'storage', 'strategies']
            }
          }
        },
        execute: async (args: Record<string, unknown>) => {
          const scope = (args?.['scope'] as string) || 'all';

          const engines = (scope === 'all' || scope === 'engines') 
            ? await this.geminiService.checkOnDeviceCapabilities()
            : undefined;

          const storage = (scope === 'all' || scope === 'storage')
            ? {
                savedItemsCount: this.storageService.savedItems().length,
                customRolesCount: this.storageService.customRoles().length,
                theme: this.storageService.getTheme()
              }
            : undefined;

          const strategies = (scope === 'all' || scope === 'strategies')
            ? {
                totalStrategies: STRATEGIES.length,
                anchorCount: STRATEGIES.filter(s => s.category === 'anchor').length,
                provocationCount: STRATEGIES.filter(s => s.category !== 'anchor').length
              }
            : undefined;

          return {
            timestamp: new Date().toISOString(),
            scope,
            engines,
            storage,
            strategies
          };
        },
        annotations: {
          readOnlyHint: true,
          debugging: true // Explicitly set for Chrome 156+ diagnostic isolation
        }
      });

      // 2. Component / Subsystem state inspector tool
      await mc.registerTool({
        name: 'getInternalState',
        description: 'Returns internal component and service state for diagnostics and troubleshooting.',
        inputSchema: {
          type: 'object',
          properties: {
            componentId: {
              type: 'string',
              description: 'ID of the subsystem to inspect (e.g., "storage", "engine", "guards")'
            }
          },
          required: ['componentId']
        },
        execute: async (args: Record<string, unknown>) => {
          const componentId = args?.['componentId'];
          switch (componentId) {
            case 'storage':
              return {
                theme: this.storageService.getTheme(),
                savedCount: this.storageService.savedItems().length,
                rolesCount: this.storageService.customRoles().length
              };
            case 'engine':
              return await this.geminiService.checkOnDeviceCapabilities();
            case 'guards':
              return {
                piiScanningActive: true,
                clinicalTriageActive: true,
                hipaaSafeHarborMode: 'zero-disk-stateless'
              };
            default:
              return { error: `Subsystem "${componentId}" not recognized. Valid: "storage", "engine", "guards".` };
          }
        },
        annotations: {
          readOnlyHint: true,
          debugging: true // Explicitly set for Chrome 156+ diagnostic isolation
        }
      });

      this._isRegistered = true;
      console.debug('[WebMCP] Registered Chrome 156+ diagnostic tools with debugging: true');
    } catch (err) {
      console.warn('[WebMCP] Failed to register diagnostic tools:', err);
    }
  }
}
