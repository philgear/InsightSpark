import { Component, input, output, model, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './icon.component';
import { LojongCleansingComponent } from './lojong-cleansing.component';
import { TranslationService } from '../../services/translation.service';
import { GeminiService } from '../../services/gemini.service';
import { MODEL_PRICING_CATALOG, formatUsd } from '../../utils/cost-model';
import { WEBGPU_MODEL_CATALOG, WebGpuModelKey } from '../../utils/webgpu-engine';

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

function setStoredApiKey(key: string): void {
  if (['demo-key-active', 'chrome-on-device-builtin', 'local-ollama-active', 'webgpu-active', 'server-hosted-pass'].includes(key)) {
    localStorage.setItem('spark_cfg_val', key);
  } else {
    localStorage.setItem('spark_cfg_val', btoa(key));
  }
}

function removeStoredApiKey(): void {
  localStorage.removeItem('spark_cfg_val');
  localStorage.removeItem('user_gemini_api_key');
}

const DEPRECATED_MODEL_PREFIXES = ['gemini-2.5-', 'gemini-2.0-', 'gemini-1.5-', 'gemma-2-'];

type ThinkingLevel = 'low' | 'medium' | 'high' | 'xhigh';

function getStoredModel(): string {
  const saved = localStorage.getItem('spark_model_val') || localStorage.getItem('user_gemini_model') || 'gemini-4-hydrogen';
  const lower = saved.toLowerCase();
  if (DEPRECATED_MODEL_PREFIXES.some(prefix => lower.startsWith(prefix))) {
    return 'gemini-4-hydrogen';
  }
  return saved;
}

function setStoredModel(modelName: string): void {
  localStorage.setItem('spark_model_val', modelName);
  localStorage.setItem('user_gemini_model', modelName);
}

function getStoredTemperature(): number {
  const val = localStorage.getItem('spark_temp_val');
  if (val !== null && !isNaN(Number(val))) {
    return Number(val);
  }
  return 0.7;
}

function setStoredTemperature(temp: number): void {
  localStorage.setItem('spark_temp_val', temp.toString());
}

function getStoredThinkingLevel(): ThinkingLevel {
  const saved = (localStorage.getItem('spark_thinking_level') || '').toLowerCase();
  if (saved === 'low' || saved === 'medium' || saved === 'high' || saved === 'xhigh') {
    return saved;
  }
  const legacyBudget = localStorage.getItem('spark_thinking_budget');
  if (legacyBudget !== null && legacyBudget !== '' && !isNaN(Number(legacyBudget))) {
    const budget = Number(legacyBudget);
    if (budget > 0 && budget <= 1024) return 'low';
    if (budget > 1024 && budget <= 2048) return 'medium';
    return 'high';
  }
  return 'high';
}

function setStoredThinkingLevel(level: ThinkingLevel): void {
  localStorage.setItem('spark_thinking_level', level);
  const budgetMap: Record<ThinkingLevel, string> = {
    low: '1024',
    medium: '2048',
    high: '4096',
    xhigh: '4096',
  };
  localStorage.setItem('spark_thinking_budget', budgetMap[level]);
}

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, IconComponent, LojongCleansingComponent],
  template: `
    <section class="space-y-8 animate-in fade-in pb-12">
      <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="p-2 bg-[#21211b] rounded-xl border border-(--border-accent) overflow-hidden shrink-0">
             <img [src]="logoPath()" alt="" class="h-12 w-auto object-contain">
          </div>
          <div>
            <h2 class="text-transparent bg-clip-text bg-linear-to-r from-(--text-highlight) to-(--text-accent)">{{ t('settings.title') }}</h2>
            <p class="text-(--text-color-muted) mt-1">Get the most out of Pivot & Pulse in {{ appMode() === 'creative' ? 'Creative' : 'Care' }} Mode.</p>
          </div>
        </div>
      </header>

      <!-- What's New in v2.1 (Release Highlights) -->
      <div class="bg-linear-to-r from-(--card-bg) via-emerald-950/20 to-(--card-bg) p-5 rounded-2xl border border-emerald-500/30 shadow-lg">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs flex items-center gap-1.5 border border-emerald-500/30">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              v2.1 Release
            </span>
            <h3 class="text-sm sm:text-base font-bold text-(--text-highlight)">
              New Grounding Anchors, Care Closure Checklists & On-Device AI
            </h3>
          </div>
          <button (click)="toggleChangelog()"
                  class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-(--border-color) transition-all flex items-center gap-1.5 text-(--text-accent) self-start sm:self-auto cursor-pointer">
            <span>{{ showChangelog() ? 'Hide Highlights' : "View What's New" }}</span>
            <app-icon [name]="showChangelog() ? 'chevron-up' : 'chevron-down'" [size]="14"></app-icon>
          </button>
        </div>

        @if (showChangelog()) {
          <div class="mt-4 pt-4 border-t border-(--border-color)/40 space-y-4 text-xs animate-in fade-in duration-200">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div class="p-3 bg-black/20 rounded-xl border border-white/5 space-y-1">
                <div class="font-bold text-(--text-accent) flex items-center gap-1.5">
                  <app-icon name="shield-check" [size]="14"></app-icon>
                  <span>6 New Strategy Models</span>
                </div>
                <p class="text-(--text-color-muted) leading-relaxed">
                  Added <strong>Sensory Bridge</strong>, <strong>Chosen Family</strong>, <strong>Time Dilation</strong>, <strong>Respite Safeguards</strong>, <strong>Ethical Dignity</strong>, and <strong>Home Hazard Pre-Mortems</strong> across both Creative and Care modes.
                </p>
              </div>

              <div class="p-3 bg-black/20 rounded-xl border border-white/5 space-y-1">
                <div class="font-bold text-(--text-accent) flex items-center gap-1.5">
                  <app-icon name="clipboard-list" [size]="14"></app-icon>
                  <span>Care Transition Checklists</span>
                </div>
                <p class="text-(--text-color-muted) leading-relaxed">
                  Standardized 72h acute discharge and 30d handoff checklists with pen-and-paper refrigerator plan formatting and HL7 FHIR R4 ServiceRequest resource mapping.
                </p>
              </div>

              <div class="p-3 bg-black/20 rounded-xl border border-white/5 space-y-1">
                <div class="font-bold text-(--text-accent) flex items-center gap-1.5">
                  <app-icon name="sparkles" [size]="14"></app-icon>
                  <span>DPO Alignment & Multi-Agent</span>
                </div>
                <p class="text-(--text-color-muted) leading-relaxed">
                  Export pairwise preference datasets for Hugging Face TRL with ORCID provenance (<a href="https://orcid.org/0009-0008-1372-5381" target="_blank" class="underline hover:text-(--text-highlight)">Phil Gear</a>) plus 5-phase multi-agent dialectical synthesis closure.
                </p>
              </div>

              <div class="p-3 bg-black/20 rounded-xl border border-white/5 space-y-1">
                <div class="font-bold text-emerald-400 flex items-center gap-1.5">
                  <app-icon name="leaf" [size]="14"></app-icon>
                  <span>Chill & Dignity-First UX</span>
                </div>
                <p class="text-(--text-color-muted) leading-relaxed">
                  Calm presence with zero alarm sirens, ongoing recovery acknowledgement override, and one-click <strong>"✨ Tidy details for me"</strong> privacy protection.
                </p>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-(--text-color-muted)">
              <span>Explore complete version history and architecture notes:</span>
              <a href="https://github.com/philgear/InsightSpark/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer" class="text-(--text-accent) hover:underline font-semibold flex items-center gap-1">
                <span>View Full CHANGELOG.md on GitHub</span>
                <span>&rarr;</span>
              </a>
            </div>
          </div>
        }
      </div>
      
      @if (appMode() === 'creative') {
        <div class="space-y-6">
          <div class="bg-(--card-bg) p-6 rounded-2xl border border-(--border-color)">
              <h3 class="text-(--text-accent) flex items-center gap-2 mb-2">
                <app-icon name="sparkles" [size]="20"></app-icon>
                Crafting the Perfect Creative Prompt
              </h3>
              <p class="text-sm text-(--text-color-muted) mb-3">
                A good prompt gives the AI constraints to build against while leaving room for unexpected lateral connections. Use this simple formula:
              </p>
              <div class="mb-4 p-3 bg-white/5 border border-(--border-color)/30 rounded-xl text-xs font-mono text-(--text-highlight)">
                Formula: Challenge + Context/Target + Desired Outcome/Style
              </div>
              <ul class="list-disc pl-6 space-y-2 text-(--text-color) text-sm/relaxed">
                <li><strong>Provide Rich Context:</strong> Instead of "write a story about a key," try: <em>"A sci-fi short story about an ancient brass key found on a metallic asteroid (Context) that doesn't fit any mechanical lock but reacts to light frequencies (Challenge)."</em></li>
                <li><strong>Introduce Creative Roles or Voices:</strong> Use the <strong>Perspective (Gist)</strong> field to guide the tone of the insights. Ask for unique angles: <em>"Explain this like a cynical 1940s noir detective"</em> or <em>"Filter through the lens of a landscape architect."</em></li>
                <li><strong>Identify the Real Obstacles:</strong> Be clear about what is holding you back. If you are designing a product, list the core constraints (e.g., "no electricity available", "needs to fit in a pocket").</li>
              </ul>
          </div>

          <div class="bg-(--card-bg) p-6 rounded-2xl border border-(--border-color)">
              <h3 class="text-(--text-accent) flex items-center gap-2 mb-2">
                <app-icon name="book" [size]="20" fallback="sparkles"></app-icon>
                Unlocking Creative Blocks with Lateral Thinking
              </h3>
              <p class="text-sm text-(--text-color)/90 leading-relaxed mb-3">
                Most brainstorming fails because we think in a straight line (<strong>Vertical Thinking</strong>: logical, sequential, building on existing assumptions). Pivot & Pulse forces you to think sideways (<strong>Lateral Thinking</strong>):
              </p>
              <ul class="list-disc pl-6 space-y-2 text-(--text-color) text-sm/relaxed">
                <li><strong>Pattern Disruption:</strong> Our brains are pattern-matching machines that default to the most obvious solution. Lateral thinking deliberately introduces constraints and contradictions to shatter these default patterns.</li>
                <li><strong>Connecting the Unrelated:</strong> Smashing two completely different concepts together (e.g., "municipal park" + "sponge") is where true innovation starts.</li>
                <li><strong>Creating Action Plans:</strong> Once you find insights that excite you, bookmark them. You can then synthesize your bookmarks into a structured <strong>Creative Action Plan</strong> detailing a sequential Critical Path, Risk Assessment, and next actions.</li>
              </ul>
          </div>
        </div>
      } @else {
        <div class="space-y-6">
          <div class="bg-(--card-bg) p-6 rounded-2xl border border-(--border-color)">
              <h3 class="text-(--text-accent) flex items-center gap-2 mb-2">
                <app-icon name="heart" [size]="20"></app-icon>
                Framing Holistic, Person-Centered Goals
              </h3>
              <p class="text-sm text-(--text-color-muted) mb-3">
                In Care Mode, Pivot & Pulse shifts focus away from clinical deficits toward dignity, autonomy, and achievable steps.
              </p>
              <div class="mb-4 p-3 bg-white/5 border border-(--border-color)/30 rounded-xl text-xs font-mono text-(--text-highlight)">
                Formula: Person + Current Context + Meaningful Life Goal + Real-World Barrier
              </div>
              <ul class="list-disc pl-6 space-y-2 text-(--text-color) text-sm/relaxed">
                <li><strong>Start with What Matters to Them:</strong> Focus on personal meaning, e.g. <em>"Able to attend granddaughter's outdoor wedding"</em> rather than solely <em>"achieve 90 degrees knee flexion."</em></li>
                <li><strong>Leverage Diverse Care Perspectives:</strong> Toggle between the <em>Bedside Nurse</em>, <em>Positive Psychologist</em>, <em>Kinship Coordinator</em>, and <em>Family Circle</em> to uncover blind spots.</li>
                <li><strong>De-Identification Safeguards:</strong> Always exclude direct names, addresses, or phone numbers. The built-in scanner helps ensure HIPAA compliance before querying.</li>
              </ul>
          </div>

          <div class="bg-(--card-bg) p-6 rounded-2xl border border-(--border-color)">
              <h3 class="text-(--text-accent) flex items-center gap-2 mb-2">
                <app-icon name="sparkles" [size]="20"></app-icon>
                PERMA+H & Positive Psychology Foundations
              </h3>
              <p class="text-sm text-(--text-color-muted) mb-3">
                Pivot & Pulse care strategies are grounded in the pioneering work of <strong>Dr. Martin E.P. Seligman</strong> and the University of Pennsylvania (UPenn) Positive Psychology Center:
              </p>
              <ul class="list-disc pl-6 space-y-1.5 text-(--text-color) text-sm/relaxed mb-4">
                <li><strong>PERMA+H Pillars:</strong> <em>Positive Emotion, Engagement/Flow, Relationships, Meaning, Accomplishment, and Health/Vitality</em>.</li>
                <li><strong>VIA Signature Strengths:</strong> Catalyzing signature character strengths (curiosity, kindness, perseverance, love of learning) rather than deficit remediation.</li>
                <li><strong>Learned Optimism (ABCDE):</strong> Reframing adversity into temporary, specific, and actionable growth steps.</li>
              </ul>
              <div class="p-3 bg-white/5 border border-(--border-color)/30 rounded-xl text-xs flex items-center justify-between gap-3">
                <span class="text-(--text-color-muted)">Learn directly from Dr. Martin Seligman:</span>
                <a href="https://www.coursera.org/specializations/positivepsychology" target="_blank" rel="noopener noreferrer" class="text-(--text-accent) hover:underline font-semibold flex items-center gap-1 shrink-0">
                  <span>Foundations of Positive Psychology on Coursera</span>
                  <span>&rarr;</span>
                </a>
              </div>
          </div>

          <!-- Universal Systems Thinking & Academic Disclaimer -->
          <div class="bg-(--card-bg) p-6 rounded-2xl border border-(--border-color)">
              <h3 class="text-(--text-accent) flex items-center gap-2 mb-2">
                <app-icon name="mandala" [size]="20"></app-icon>
                Universal Systems Thinking Patterns
              </h3>
              <p class="text-sm text-(--text-color-muted) mb-3">
                Cognitive architecture inspired by universal systems science and the research of Drs. Derek & Laura Cabrera (Cornell University).
              </p>
              <ul class="list-disc pl-6 space-y-1 text-(--text-color) text-sm/relaxed mb-3">
                <li><strong>Distinctions (D):</strong> Boundary recognition — separating unaffected human identity from clinical symptoms.</li>
                <li><strong>Systems (S):</strong> Whole/part nesting — autonomic nervous system, circadian pacing, and home ecology.</li>
                <li><strong>Relationships (R):</strong> Relational bridges, feedback loops, and protected caregiver respite.</li>
                <li><strong>Perspectives (P):</strong> Triad alignment across clinical safety, lived experience, and future flourishing.</li>
              </ul>
              <p class="text-[11px] text-(--text-color-muted) border-t border-(--border-color)/40 pt-2.5">
                ⚖️ <strong>Legal Notice:</strong> Pivot & Pulse is an independent open-source tool. It is not affiliated with, sponsored by, or endorsed by Cabrera Research Lab, STSI, Cornell University, or De Bono Thinking Systems. HL7®, HEALTH LEVEL SEVEN®, and FHIR® are registered trademarks of Health Level Seven International.
              </p>
          </div>
        </div>
      }

      <!-- Gemini Model Tier Selection -->
      <div class="bg-(--card-bg) p-6 rounded-2xl border border-(--border-color)">
        <h3 class="text-(--text-accent) flex items-center gap-2 mb-2">
          <app-icon name="sparkles" [size]="20"></app-icon>
          {{ t('settings.model.title') }}
        </h3>
        <p class="text-sm text-(--text-color-muted) mb-4">
          {{ t('settings.model.desc') }}
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <!-- Gemini 4 Hydrogen -->
          <button (click)="updateModel('gemini-4-hydrogen')"
                  [class.bg-(--text-accent)]="userModel() === 'gemini-4-hydrogen'"
                  [class.text-(--primary-cta-text)]="userModel() === 'gemini-4-hydrogen'"
                  [class.bg-(--button-bg)]="userModel() !== 'gemini-4-hydrogen'"
                  [class.hover:bg-(--button-bg-hover)]="userModel() !== 'gemini-4-hydrogen'"
                  class="text-xs font-semibold p-3.5 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex flex-col justify-between cursor-pointer">
            <div>
              <div class="font-bold text-sm flex items-center gap-1.5">
                <span>Gemini 4 Hydrogen</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">NEW</span>
              </div>
              <div class="opacity-80 text-[11px] font-normal mt-1 leading-snug">Frontier Gemini 4 intelligence via Interactions API with deep reasoning</div>
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-1.5">
              <span class="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/20 text-current w-fit">Default</span>
              <span class="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-black/25 text-current w-fit">{{ formatUsd(pricingCatalog['gemini-4-hydrogen'].inputPer1M) }} / {{ formatUsd(pricingCatalog['gemini-4-hydrogen'].outputPer1M) }} per 1M · Free Tier / Paid</span>
            </div>
          </button>

          <!-- Gemini 4 Argon -->
          <button (click)="updateModel('gemini-4-argon')"
                  [class.bg-(--text-accent)]="userModel() === 'gemini-4-argon'"
                  [class.text-(--primary-cta-text)]="userModel() === 'gemini-4-argon'"
                  [class.bg-(--button-bg)]="userModel() !== 'gemini-4-argon'"
                  [class.hover:bg-(--button-bg-hover)]="userModel() !== 'gemini-4-argon'"
                  class="text-xs font-semibold p-3.5 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex flex-col justify-between cursor-pointer">
            <div>
              <div class="font-bold text-sm">Gemini 4 Argon</div>
              <div class="opacity-80 text-[11px] font-normal mt-1 leading-snug">Ultra-fast Gemini 4 tier with low, medium & high thinking levels</div>
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-1.5">
              <span class="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/20 text-current w-fit">High Speed</span>
              <span class="inline-block text-[10px] font-mono px-2 py-0.5 rounded tone-amber-badge w-fit">$2 / $10 per 1M (→ $4 / $20 Dec 1) · Paid Only</span>
            </div>
          </button>

          <!-- Gemini 3.5 Flash-Lite -->
          <button (click)="updateModel('gemini-3.5-flash-lite')"
                  [class.bg-(--text-accent)]="userModel() === 'gemini-3.5-flash-lite'"
                  [class.text-(--primary-cta-text)]="userModel() === 'gemini-3.5-flash-lite'"
                  [class.bg-(--button-bg)]="userModel() !== 'gemini-3.5-flash-lite'"
                  [class.hover:bg-(--button-bg-hover)]="userModel() !== 'gemini-3.5-flash-lite'"
                  class="text-xs font-semibold p-3.5 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex flex-col justify-between cursor-pointer">
            <div>
              <div class="font-bold text-sm">Gemini 3.5 Flash-Lite</div>
              <div class="opacity-80 text-[11px] font-normal mt-1 leading-snug">Lightweight high-throughput cloud model for rapid structured synthesis</div>
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-1.5">
              <span class="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded tone-purple-badge w-fit">Lightweight</span>
              <span class="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-black/25 text-current w-fit">$0.30 / $2.50 per 1M · Budget Cloud</span>
            </div>
          </button>

          <!-- On-Device Browser AI (Gemini Nano & WebGPU) -->
          <button (click)="updateModel('on-device-nano')"
                  [class.bg-(--text-accent)]="isWebGpuActive()"
                  [class.text-(--primary-cta-text)]="isWebGpuActive()"
                  [class.bg-(--button-bg)]="!isWebGpuActive()"
                  [class.hover:bg-(--button-bg-hover)]="!isWebGpuActive()"
                  class="text-xs font-semibold p-3.5 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex flex-col justify-between cursor-pointer">
            <div>
              <div class="font-bold text-sm flex items-center gap-1.5">
                <span>In-Browser RAM (window.ai & WebGPU)</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded tone-cyan-badge font-mono">CLIENT RAM</span>
              </div>
              <div class="opacity-80 text-[11px] font-normal mt-1 leading-snug">Runs on-device inside visitor browser RAM/NPU via Chrome Prompt API or WebGPU. 0 network calls.</div>
            </div>
            <div class="flex flex-wrap items-center gap-1.5 mt-3">
              @if (chromeAiAvailable()) {
                <span class="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded tone-emerald-badge w-fit">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Nano Ready
                </span>
              } @else if (webGpuAvailable()) {
                <span class="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded tone-cyan-badge w-fit">
                  <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span> WebGPU Active
                </span>
              } @else {
                <span class="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded tone-amber-badge w-fit">Chrome 127+ / Safari 17.4</span>
              }
              <span class="inline-block text-[10px] font-mono px-2 py-0.5 rounded tone-cyan-badge w-fit">$0 Cloud · 0 Bytes Egress</span>
            </div>
          </button>

          <!-- Workstation VRAM Engine: pivotpulse (Ollama / Gemma 4) -->
          <button (click)="updateModel('ollama:pivotpulse')"
                  [class.bg-(--text-accent)]="userModel() === 'ollama:pivotpulse' || userModel() === 'pivotpulse' || (userModel().startsWith('ollama:') && !userModel().includes('gemma2'))"
                  [class.text-(--primary-cta-text)]="userModel() === 'ollama:pivotpulse' || userModel() === 'pivotpulse' || (userModel().startsWith('ollama:') && !userModel().includes('gemma2'))"
                  [class.bg-(--button-bg)]="userModel() !== 'ollama:pivotpulse' && userModel() !== 'pivotpulse' && (!userModel().startsWith('ollama:') || userModel().includes('gemma2'))"
                  [class.hover:bg-(--button-bg-hover)]="userModel() !== 'ollama:pivotpulse' && userModel() !== 'pivotpulse' && (!userModel().startsWith('ollama:') || userModel().includes('gemma2'))"
                  class="text-xs font-semibold p-3.5 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex flex-col justify-between cursor-pointer">
            <div>
              <div class="font-bold text-sm flex items-center gap-1.5">
                <span>pivotpulse (Gemma 4 VRAM)</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded tone-emerald-badge font-mono">HOT VRAM</span>
              </div>
              <div class="opacity-80 text-[11px] font-normal mt-1 leading-snug">Gemma 4 VRAM workstation engine (keep_alive: -1). High-speed local synthesis with zero cloud quota.</div>
            </div>
            <div class="flex flex-wrap items-center gap-1.5 mt-3">
              @if (ollamaAvailable()) {
                <span class="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded tone-emerald-badge w-fit">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Pre-Warmed in VRAM
                </span>
              } @else {
                <span class="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/20 text-current w-fit">Ollama Daemon</span>
              }
              <span class="inline-block text-[10px] font-mono px-2 py-0.5 rounded tone-emerald-badge w-fit">$0 Cloud · Local GPU</span>
            </div>
          </button>

          <!-- Gemma 4 31B (Google Cloud) -->
          <button (click)="updateModel('gemma-4-31b-it')"
                  [class.bg-(--text-accent)]="userModel() === 'gemma-4-31b-it'"
                  [class.text-(--primary-cta-text)]="userModel() === 'gemma-4-31b-it'"
                  [class.bg-(--button-bg)]="userModel() !== 'gemma-4-31b-it'"
                  [class.hover:bg-(--button-bg-hover)]="userModel() !== 'gemma-4-31b-it'"
                  class="text-xs font-semibold p-3.5 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex flex-col justify-between cursor-pointer">
            <div>
              <div class="font-bold text-sm flex items-center gap-1.5">
                <span>Gemma 4 31B</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded tone-blue-badge font-mono">OPEN</span>
              </div>
              <div class="opacity-80 text-[11px] font-normal mt-1 leading-snug">Open-weights Gemma 4 research architecture hosted via Gemini Interactions API</div>
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-1.5">
              <span class="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded tone-blue-badge w-fit">Google Gemma 4</span>
              <span class="inline-block text-[10px] font-mono px-2 py-0.5 rounded tone-emerald-badge w-fit">$0 / 1M · Free Hosted Open</span>
            </div>
          </button>

          <!-- Gemma 4 26B A4B MoE (Google Cloud) -->
          <button (click)="updateModel('gemma-4-26b-a4b-it')"
                  [class.bg-(--text-accent)]="userModel() === 'gemma-4-26b-a4b-it'"
                  [class.text-(--primary-cta-text)]="userModel() === 'gemma-4-26b-a4b-it'"
                  [class.bg-(--button-bg)]="userModel() !== 'gemma-4-26b-a4b-it'"
                  [class.hover:bg-(--button-bg-hover)]="userModel() !== 'gemma-4-26b-a4b-it'"
                  class="text-xs font-semibold p-3.5 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex flex-col justify-between cursor-pointer">
            <div>
              <div class="font-bold text-sm flex items-center gap-1.5">
                <span>Gemma 4 26B A4B (MoE)</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded tone-cyan-badge font-mono">3.8B ACTIVE</span>
              </div>
              <div class="opacity-80 text-[11px] font-normal mt-1 leading-snug">Mixture-of-Experts Gemma 4: 26B capability with fast 3.8B active compute via Gemini Interactions API</div>
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-1.5">
              <span class="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded tone-blue-badge w-fit">Google Gemma 4 MoE</span>
              <span class="inline-block text-[10px] font-mono px-2 py-0.5 rounded tone-emerald-badge w-fit">$0 / 1M · Free Hosted MoE</span>
            </div>
          </button>
        </div>

        <!-- Live Engine Diagnostics & Open Models Console -->
        <div class="mt-5 pt-4 border-t border-(--border-color)/60 space-y-4">
          <!-- WebGPU / In-Browser RAM Console -->
          <div class="p-4 rounded-xl console-panel-cyan border border-cyan-500/30 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="space-y-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs font-bold tone-cyan-text flex items-center gap-1.5 font-mono">
                    <span class="h-2 w-2 rounded-full bg-cyan-400" [class.animate-pulse]="webGpuAvailable()"></span>
                    WebGPU On-Device Engine
                  </span>
                  <span class="text-[10px] px-2 py-0.5 rounded font-mono font-semibold"
                        [class.tone-emerald-badge]="webGpuAvailable()"
                        [class.tone-amber-badge]="!webGpuAvailable()">
                    {{ webGpuAvailable() ? 'Hardware GPU Available' : 'Software Fallback' }}
                  </span>
                  @if (webGpuReadyModel(); as readyKey) {
                    <span class="text-[10px] px-2 py-0.5 rounded font-mono font-semibold tone-emerald-badge">
                      ✓ {{ readyKey }} Ready
                    </span>
                  }
                </div>
                <p class="text-xs text-(--text-color-muted)">
                  Runs Hugging Face ONNX weights directly in browser GPU memory via Transformers.js & self-hosted <code class="font-mono">/assets/ort/</code> WASM (or Chrome Prompt API). 0 prompt bytes leave your machine.
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-2 shrink-0">
                <button (click)="loadWebGpuModel()"
                        type="button"
                        [disabled]="webGpuProgress()?.status === 'checking' || webGpuProgress()?.status === 'loading' || webGpuProgress()?.status === 'generating'"
                        class="py-2 px-3 rounded-xl text-xs font-bold border border-cyan-500/40 tone-cyan-badge hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer">
                  @if (webGpuProgress()?.status === 'checking' || webGpuProgress()?.status === 'loading') {
                    Loading Weights...
                  } @else if (webGpuReadyModel() === selectedWebGpuModel()) {
                    ✓ Loaded in WebGPU
                  } @else {
                    Load into WebGPU
                  }
                </button>
                <button (click)="activateWebGpu()" 
                        type="button"
                        [class.bg-cyan-600]="isWebGpuActive()"
                        [class.text-white]="isWebGpuActive()"
                        [class.console-subcard]="!isWebGpuActive()"
                        class="py-2 px-3.5 rounded-xl text-xs font-bold border border-cyan-500/40 hover:opacity-90 transition-all cursor-pointer">
                  {{ isWebGpuActive() ? '✓ WebGPU In-Memory Active' : 'Switch to WebGPU' }}
                </button>
              </div>
            </div>

            <!-- Hugging Face ONNX WebGPU Model Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              @for (wg of webGpuCatalog; track wg.key) {
                <button (click)="selectWebGpuModel(wg.key)"
                        type="button"
                        [class.border-cyan-400]="selectedWebGpuModel() === wg.key"
                        [class.console-subcard-active]="selectedWebGpuModel() === wg.key"
                        [class.border-cyan-500/25]="selectedWebGpuModel() !== wg.key"
                        [class.console-subcard]="selectedWebGpuModel() !== wg.key"
                        class="p-2.5 rounded-xl border text-left transition-all hover:border-cyan-400/70 cursor-pointer flex flex-col justify-between gap-1">
                  <div>
                    <div class="flex items-center justify-between gap-1">
                      <span class="text-xs font-bold text-(--text-color)">{{ wg.shortLabel }}</span>
                      <span class="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded tone-cyan-badge">{{ wg.dtype }}</span>
                    </div>
                    <div class="text-[10px] font-mono tone-cyan-text truncate mt-0.5">{{ wg.hfModelId }}</div>
                    <div class="text-[11px] text-(--text-color-muted) mt-1 leading-snug">{{ wg.recommendedRole }}</div>
                  </div>
                  <div class="text-[10px] font-mono text-(--text-color-muted) pt-1">{{ wg.approxDownloadLabel }}</div>
                </button>
              }
            </div>

            @if (webGpuProgress(); as prog) {
              <div class="p-2.5 rounded-lg border text-xs space-y-1.5"
                   [class.border-rose-500/40]="prog.status === 'error'"
                   [class.bg-rose-950/30]="prog.status === 'error'"
                   [class.text-rose-200]="prog.status === 'error'"
                   [class.border-cyan-500/30]="prog.status !== 'error'"
                   [class.console-subcard]="prog.status !== 'error'">
                <div class="flex items-center justify-between gap-2 font-mono text-[11px]">
                  <span class="truncate">{{ prog.message }}</span>
                  @if (prog.progress !== undefined) {
                    <span class="shrink-0 font-bold">{{ prog.progress }}%</span>
                  }
                </div>
                @if (prog.status === 'loading' || prog.status === 'checking' || prog.status === 'ready') {
                  <div class="w-full h-1.5 rounded-full bg-black/50 overflow-hidden">
                    <div class="h-full bg-cyan-400 transition-all duration-200"
                         [style.width.%]="prog.progress ?? (prog.status === 'ready' ? 100 : 12)"></div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Open Models via Localhost / Ollama Console -->
          <div class="p-4 rounded-xl console-panel-purple border border-purple-500/30 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold tone-purple-text flex items-center gap-1.5 font-mono">
                  <span class="h-2 w-2 rounded-full bg-purple-400" [class.animate-pulse]="ollamaAvailable()"></span>
                  Open Models & Workstation GPU
                </span>
                <span class="text-[10px] px-2 py-0.5 rounded font-mono font-semibold"
                      [class.tone-emerald-badge]="ollamaAvailable()"
                      [class.bg-(--button-bg)]="!ollamaAvailable()"
                      [class.text-(--text-color-muted)]="!ollamaAvailable()">
                  {{ ollamaAvailable() ? 'Ollama Bridge Connected' : 'Ollama Offline' }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <button (click)="prewarmVram('pivotpulse')" 
                        type="button"
                        class="text-[11px] font-semibold px-2.5 py-1 rounded-lg tone-purple-badge hover:opacity-90 border border-purple-500/40 transition-colors cursor-pointer flex items-center gap-1">
                  <span>{{ prewarmStatus() === 'ready' ? '⚡ Locked in VRAM' : (prewarmStatus() === 'prewarming' ? 'Warming...' : 'Pre-Warm VRAM') }}</span>
                </button>
              </div>
            </div>

            <!-- Discovered Models or Quick Selection -->
            <div>
              <span class="text-[11px] font-semibold text-(--text-color-muted) block mb-1.5">Quick-Select Open Model:</span>
              <div class="flex flex-wrap gap-1.5">
                @for (m of (ollamaModels().length > 0 ? ollamaModels() : ['pivotpulse:latest', 'pocketgull-clinical:latest', 'branddesk:latest', 'pocketgull-prosody-gemma:latest', 'gemma4:latest']); track m) {
                  <button (click)="selectOpenModel(m)" 
                          type="button"
                          [class.bg-purple-600]="userModel() === 'ollama:' + m || (m.startsWith('pivotpulse') && userModel().includes('pivotpulse'))"
                          [class.text-white]="userModel() === 'ollama:' + m || (m.startsWith('pivotpulse') && userModel().includes('pivotpulse'))"
                          [class.console-subcard]="userModel() !== 'ollama:' + m && !(m.startsWith('pivotpulse') && userModel().includes('pivotpulse'))"
                          class="px-2.5 py-1 rounded-lg text-xs font-mono border border-purple-500/30 hover:border-purple-400 transition-all cursor-pointer">
                    {{ m }}
                  </button>
                }
              </div>
            </div>

            <!-- Custom Open Model Input & Host Address -->
            <div class="pt-2 border-t border-purple-500/20 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div>
                <label for="custom-ollama-input" class="block text-[11px] font-medium text-(--text-color-muted) mb-1">Custom Open Model Name</label>
                <div class="flex gap-1.5">
                  <input #customModelBox
                         id="custom-ollama-input"
                         type="text" 
                         placeholder="e.g., gemma4:e4b, gemma4:e2b, qwen3:4b, smollm3:3b" 
                         [value]="customModelInput()"
                         class="flex-1 console-subcard border border-purple-500/30 rounded-lg py-1.5 px-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-purple-400"
                         (keyup.enter)="selectOpenModel(customModelBox.value)">
                  <button (click)="selectOpenModel(customModelBox.value)" 
                          type="button"
                          class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 transition-colors cursor-pointer">
                    Use
                  </button>
                </div>
              </div>
              <div>
                <label for="ollama-host-input" class="block text-[11px] font-medium text-(--text-color-muted) mb-1">Ollama Host Address (Local or LAN)</label>
                <div class="flex gap-1.5">
                  <input #hostBox
                         id="ollama-host-input"
                         type="text" 
                         [value]="ollamaHost()"
                         placeholder="http://localhost:11434"
                         class="flex-1 console-subcard border border-purple-500/30 rounded-lg py-1.5 px-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-purple-400"
                         (keyup.enter)="updateOllamaHost(hostBox.value)">
                  <button (click)="updateOllamaHost(hostBox.value)" 
                          type="button"
                          class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 transition-colors cursor-pointer">
                    Connect
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Hyperparameter Fine-Tuning: Temperature & Reasoning Level -->
      <div class="bg-(--card-bg) p-6 rounded-2xl border border-(--border-color)">
        <h3 class="text-(--text-accent) flex items-center gap-2 mb-2">
          <app-icon name="activity" [size]="20"></app-icon>
          {{ t('settings.temperature.title') }}
        </h3>
        <p class="text-sm text-(--text-color-muted) mb-4">
          {{ t('settings.temperature.desc') }}
          <span class="block text-xs text-(--text-color-muted) mt-1">Custom temperature applies to local Ollama & open models (Gemini 4 uses automatic server sampling).</span>
        </p>

        <!-- Temperature Slider -->
        <div class="space-y-4 max-w-xl">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-(--text-color)">Generation Temperature: <span class="font-mono text-(--text-highlight)">{{ userTemperature() }}</span></span>
            <div class="flex gap-2">
              <button (click)="updateTemperature(0.2)" class="px-2.5 py-1 text-[11px] rounded-lg border border-(--border-color) hover:bg-white/5 transition-colors cursor-pointer" [class.border-emerald-500]="userTemperature() === 0.2">
                0.2 Strict
              </button>
              <button (click)="updateTemperature(0.7)" class="px-2.5 py-1 text-[11px] rounded-lg border border-(--border-color) hover:bg-white/5 transition-colors cursor-pointer" [class.border-emerald-500]="userTemperature() === 0.7">
                0.7 Balanced
              </button>
              <button (click)="updateTemperature(0.95)" class="px-2.5 py-1 text-[11px] rounded-lg border border-(--border-color) hover:bg-white/5 transition-colors cursor-pointer" [class.border-emerald-500]="userTemperature() === 0.95">
                0.95 Creative
              </button>
            </div>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05" 
            [value]="userTemperature()" 
            (input)="updateTemperature(+$any($event.target).value)" 
            class="w-full accent-(--text-accent) cursor-pointer"
          />

          <!-- Thinking / Reasoning Level (Gemini 4 Interactions API) -->
          <div class="pt-4 border-t border-(--border-color)/50">
            <h4 class="text-xs font-semibold text-(--text-color) mb-1.5">{{ t('settings.thinking.title') }}</h4>
            <p class="text-[11px] text-(--text-color-muted) mb-3">{{ t('settings.thinking.desc') }}</p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button (click)="updateThinkingLevel('low')"
                      [class.bg-(--text-accent)]="userThinkingLevel() === 'low'"
                      [class.text-(--primary-cta-text)]="userThinkingLevel() === 'low'"
                      [class.bg-(--button-bg)]="userThinkingLevel() !== 'low'"
                      class="text-xs font-medium py-2 px-3 rounded-lg border border-(--border-color) transition-all cursor-pointer">
                Low (Fast)
              </button>
              <button (click)="updateThinkingLevel('medium')"
                      [class.bg-(--text-accent)]="userThinkingLevel() === 'medium'"
                      [class.text-(--primary-cta-text)]="userThinkingLevel() === 'medium'"
                      [class.bg-(--button-bg)]="userThinkingLevel() !== 'medium'"
                      class="text-xs font-medium py-2 px-3 rounded-lg border border-(--border-color) transition-all cursor-pointer">
                Medium
              </button>
              <button (click)="updateThinkingLevel('high')"
                      [class.bg-(--text-accent)]="userThinkingLevel() === 'high'"
                      [class.text-(--primary-cta-text)]="userThinkingLevel() === 'high'"
                      [class.bg-(--button-bg)]="userThinkingLevel() !== 'high'"
                      class="text-xs font-medium py-2 px-3 rounded-lg border border-(--border-color) transition-all cursor-pointer">
                High (Default)
              </button>
              <button (click)="updateThinkingLevel('xhigh')"
                      [class.bg-(--text-accent)]="userThinkingLevel() === 'xhigh'"
                      [class.text-(--primary-cta-text)]="userThinkingLevel() === 'xhigh'"
                      [class.bg-(--button-bg)]="userThinkingLevel() !== 'xhigh'"
                      class="text-xs font-medium py-2 px-3 rounded-lg border border-(--border-color) transition-all cursor-pointer">
                xHigh (Deepest)
              </button>
            </div>
            <p class="text-[11px] text-(--text-color-muted) mt-2.5 leading-relaxed">
              Reasoning tokens are billed at the model's output rate (Low ≈ 1×, Medium ≈ 1.6×, High ≈ 2.5×, xHigh ≈ 4× output spend; 4-phase Agentic Debate executes 4 sequential calls). Hosted defaults cap reasoning at Medium (Low on 4-phase debates); supply your own API key or local GPU for High/xHigh and Argon.
            </p>
          </div>
        </div>
      </div>

      <!-- Session Compute & Cost Receipt -->
      <div class="bg-(--card-bg) p-6 rounded-2xl border border-(--border-color)">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 class="text-(--text-accent) flex items-center gap-2">
              <app-icon name="layers" [size]="20"></app-icon>
              Session Compute &amp; Cost Receipt
            </h3>
            <p class="text-xs text-(--text-color-muted) mt-1">
              In-memory session telemetry only — never written to disk or databases.
            </p>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <a href="/transparency"
               target="_blank"
               rel="noopener noreferrer"
               class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-(--border-color) hover:border-(--text-accent) text-(--text-accent) transition-colors">
              Full Cost Ledger &rarr;
            </a>
            @if (sessionSummary().callCount > 0) {
              <button (click)="resetSessionReceipt()"
                      type="button"
                      class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-(--button-bg) hover:bg-(--button-bg-hover) border border-(--border-color) flex items-center gap-1.5 transition-colors cursor-pointer">
                <app-icon name="refresh" [size]="13"></app-icon>
                <span>Reset Receipt</span>
              </button>
            }
          </div>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="p-3.5 rounded-xl bg-white/5 border border-(--border-color)/50">
            <div class="text-[11px] uppercase tracking-wider text-(--text-color-muted)">Requests</div>
            <div class="text-lg font-bold font-mono text-(--text-color) mt-1">{{ sessionSummary().requestCount }}</div>
            <div class="text-[11px] text-(--text-color-muted) mt-0.5">{{ sessionSummary().callCount }} model calls</div>
          </div>

          <div class="p-3.5 rounded-xl bg-white/5 border border-(--border-color)/50">
            <div class="text-[11px] uppercase tracking-wider text-(--text-color-muted)">Tokens</div>
            <div class="text-lg font-bold font-mono text-(--text-color) mt-1">{{ sessionSummary().totalTokens | number }}</div>
            <div class="text-[11px] text-(--text-color-muted) mt-0.5 font-mono">
              {{ sessionSummary().totalInputTokens | number }} in / {{ sessionSummary().totalOutputTokens | number }} out / {{ sessionSummary().totalThoughtTokens | number }} thought
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-white/5 border border-(--border-color)/50">
            <div class="text-[11px] uppercase tracking-wider text-(--text-color-muted)">Est. Cloud Cost</div>
            <div class="text-lg font-bold font-mono text-(--text-highlight) mt-1">{{ formatUsd(sessionSummary().totalEstimatedCostUsd) }}</div>
            <div class="text-[11px] text-(--text-color-muted) mt-0.5">Live session estimate</div>
          </div>

          <div class="p-3.5 rounded-xl bg-white/5 border border-(--border-color)/50">
            <div class="text-[11px] uppercase tracking-wider text-(--text-color-muted)">$0 Local/Free Share</div>
            <div class="text-lg font-bold font-mono text-emerald-300 mt-1">{{ sessionSummary().zeroCostPercent }}%</div>
            <div class="text-[11px] text-(--text-color-muted) mt-0.5">Est. saved: {{ formatUsd(sessionSummary().estimatedCloudSavingsUsd) }}</div>
          </div>
        </div>

        @if (sessionEntries().length > 0) {
          <div class="mt-4 pt-3 border-t border-(--border-color)/50">
            <button (click)="toggleReceiptDetails()"
                    type="button"
                    class="text-xs font-semibold text-(--text-accent) hover:underline flex items-center gap-1.5 cursor-pointer">
              <app-icon [name]="showReceiptDetails() ? 'chevron-up' : 'chevron-down'" [size]="14"></app-icon>
              <span>{{ showReceiptDetails() ? 'Hide per-call breakdown' : 'Show per-call breakdown (' + sessionEntries().length + ')' }}</span>
            </button>

            @if (showReceiptDetails()) {
              <div class="mt-3 overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="border-b border-(--border-color) text-(--text-color-muted)">
                      <th scope="col" class="py-2 pr-3 font-semibold">Endpoint</th>
                      <th scope="col" class="py-2 pr-3 font-semibold">Model</th>
                      <th scope="col" class="py-2 pr-3 font-semibold">Source</th>
                      <th scope="col" class="py-2 pr-3 font-semibold text-right">Tokens (In/Out/Thought)</th>
                      <th scope="col" class="py-2 font-semibold text-right">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (entry of sessionEntries(); track entry.timestamp + entry.endpoint + $index) {
                      <tr class="border-b border-(--border-color)/30 font-mono text-[11px]">
                        <td class="py-2 pr-3 text-(--text-color)">{{ entry.endpoint }}</td>
                        <td class="py-2 pr-3 text-(--text-color-muted)">{{ entry.model }}</td>
                        <td class="py-2 pr-3">
                          <span class="px-1.5 py-0.5 rounded bg-white/5 border border-(--border-color)/40">{{ entry.billingSource }}</span>
                        </td>
                        <td class="py-2 pr-3 text-right text-(--text-color-muted)">
                          {{ entry.inputTokens | number }} / {{ entry.outputTokens | number }} / {{ entry.thoughtTokens | number }}
                        </td>
                        <td class="py-2 text-right font-semibold text-(--text-highlight)">
                          {{ formatUsd(entry.estimatedCostUsd) }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }
      </div>

      <!-- Multilingual & Portland Sister Cities Target Language -->
      <div class="bg-(--card-bg) p-6 rounded-2xl border border-(--border-color) mb-6">
        <h3 class="text-(--text-accent) flex items-center gap-2 mb-2">
          <app-icon name="globe" [size]="20"></app-icon>
          {{ t('settings.language.title') }}
        </h3>
        <p class="text-sm text-(--text-color-muted) mb-4">
          {{ t('settings.language.desc') }}
        </p>

        <!-- Sister Cities Section -->
        <div class="mb-4">
          <span class="text-[11px] font-bold uppercase tracking-wider text-(--text-highlight) block mb-2">Portland, Oregon Official Sister Cities 🌹</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            @for (lang of sisterCityLanguages; track lang.code) {
              <button (click)="updateLanguage(lang.code)"
                      [class.bg-(--text-accent)]="userLanguage() === lang.code"
                      [class.text-(--primary-cta-text)]="userLanguage() === lang.code"
                      [class.bg-(--button-bg)]="userLanguage() !== lang.code"
                      [class.hover:bg-(--button-bg-hover)]="userLanguage() !== lang.code"
                      class="text-xs font-semibold p-3 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex items-center justify-between cursor-pointer">
                <span class="flex items-center gap-2">
                  <span class="text-base">{{ lang.flag }}</span>
                  <span>{{ lang.nativeName }}</span>
                </span>
                <span class="opacity-75 text-[10px]">{{ lang.cityContext }}</span>
              </button>
            }
          </div>
        </div>

        <!-- Global Languages Section -->
        <div class="pt-3 border-t border-(--border-color)/50">
          <span class="text-[11px] font-bold uppercase tracking-wider text-(--text-color-muted) block mb-2">Global Languages & Regions 🌐</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            @for (lang of globalLanguages; track lang.code) {
              <button (click)="updateLanguage(lang.code)"
                      [class.bg-(--text-accent)]="userLanguage() === lang.code"
                      [class.text-(--primary-cta-text)]="userLanguage() === lang.code"
                      [class.bg-(--button-bg)]="userLanguage() !== lang.code"
                      [class.hover:bg-(--button-bg-hover)]="userLanguage() !== lang.code"
                      class="text-xs font-semibold p-3 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex items-center justify-between cursor-pointer">
                <span class="flex items-center gap-2">
                  <span class="text-base">{{ lang.flag }}</span>
                  <span>{{ lang.nativeName }}</span>
                </span>
                <span class="opacity-75 text-[10px]">{{ lang.cityContext }}</span>
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Gemini API Key Settings -->
      <div class="bg-(--card-bg) p-6 rounded-2xl border border-(--border-color)">
        <h3 class="text-(--text-accent) flex items-center gap-2 mb-2">
          <app-icon name="key" [size]="20"></app-icon>
          Custom Gemini API Key
        </h3>
        <p class="text-sm text-(--text-color-muted) mb-4">
          Optional. Provide your own Gemini API key to bypass default server limits and use your own quota. The key is stored securely in your browser's local storage.
        </p>
        <div class="relative max-w-lg">
          <input
            id="user-api-key"
            name="user-api-key"
            type="password"
            [value]="userApiKey()"
            (input)="updateApiKey($any($event.target).value)"
            placeholder="AIzaSy..."
            aria-label="Custom Gemini API Key"
            class="w-full p-3 bg-(--card-bg-subtle) border border-(--border-color) rounded-lg focus:ring-2 focus:ring-(--ring-color) focus:outline-none transition-all text-sm font-mono"
            autocomplete="off"
          >
          @if (userApiKey()) {
            <button (click)="updateApiKey('')" class="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-color-muted) hover:text-(--text-color) focus:outline-none" aria-label="Clear API Key">
              <app-icon name="x" [size]="16"></app-icon>
            </button>
          }
        </div>
      </div>
      
      <!-- Lojong Anxiety Cleansing Component -->
      <div class="mt-8 mb-6">
        <app-lojong-cleansing></app-lojong-cleansing>
      </div>

      <div class="text-center pt-8 border-t border-(--border-color)">
        <button (click)="back.emit()" class="bg-(--primary-cta-bg) text-(--primary-cta-text) font-bold py-3 px-8 min-h-12 rounded-lg shadow-lg hover:bg-(--primary-cta-hover-bg) transition-all flex items-center justify-center gap-2 mx-auto focus:outline-none focus:ring-2 focus:ring-(--ring-color) hover:scale-105 active:scale-95 mb-6 cursor-pointer">
          <app-icon name="sparkles" [size]="20"></app-icon>
          Let's Get Started
        </button>

        <div class="text-xs text-(--text-color-muted) flex flex-wrap justify-center gap-x-4 gap-y-1 opacity-80 pt-4 border-t border-(--border-color) max-w-md mx-auto">
          <a href="/terms" target="_blank" rel="noopener noreferrer" class="hover:text-(--text-accent) transition-colors">Terms &amp; Conditions</a>
          <span class="text-(--border-color)">•</span>
          <a href="/privacy" target="_blank" rel="noopener noreferrer" class="hover:text-(--text-accent) transition-colors">Privacy Policy</a>
          <span class="text-(--border-color)">•</span>
          <a href="/transparency" target="_blank" rel="noopener noreferrer" class="hover:text-(--text-accent) transition-colors">Cost Transparency</a>
        </div>
      </div>
    </section>
  `
})
export class HelpComponent implements OnInit {
  public translationService = inject(TranslationService);
  private geminiService = inject(GeminiService);

  appMode = input.required<'creative' | 'care'>();
  logoPath = input.required<string>();
  back = output<void>();
  
  chaosType = model<'429' | '500' | 'drop' | null>(null);
  chaosBehavior = model<'transient' | 'permanent'>('transient');

  userApiKey = signal(getStoredApiKey());
  userModel = signal(getStoredModel());
  userLanguage = signal(this.translationService.currentLang());
  userTemperature = signal(getStoredTemperature());
  userThinkingLevel = signal<ThinkingLevel>(getStoredThinkingLevel());
  showChangelog = signal(false);
  pricingCatalog = MODEL_PRICING_CATALOG;
  sessionSummary = this.geminiService.sessionCostSummary;
  sessionEntries = this.geminiService.sessionUsageEntries;
  showReceiptDetails = signal(false);
  formatUsd = formatUsd;

  toggleChangelog() {
    this.showChangelog.update(v => !v);
  }

  toggleReceiptDetails() {
    this.showReceiptDetails.update(v => !v);
  }

  resetSessionReceipt() {
    this.geminiService.clearSessionUsage();
  }

  chromeAiAvailable = signal(false);
  ollamaAvailable = signal(false);
  ollamaModels = signal<string[]>([]);
  webGpuAvailable = signal(false);
  webGpuCatalog = Object.values(WEBGPU_MODEL_CATALOG);
  selectedWebGpuModel = signal<WebGpuModelKey>(this.geminiService.getSelectedWebGpuModelKey());
  webGpuProgress = this.geminiService.webGpuProgress;
  webGpuReadyModel = this.geminiService.webGpuReadyModel;

  isWebGpuActive(): boolean {
    const model = this.userModel();
    return model === 'on-device-nano' || model === 'window.ai' || model.startsWith('webgpu:');
  }
  
  // Categorized languages
  sisterCityLanguages = this.translationService.supportedLanguages.filter(l => l.isSisterCity || l.code === 'en');
  globalLanguages = this.translationService.supportedLanguages.filter(l => !l.isSisterCity && l.code !== 'en');

  async ngOnInit() {
    try {
      const caps = await this.geminiService.checkOnDeviceCapabilities();
      this.chromeAiAvailable.set(caps.chromeAiAvailable);
      this.ollamaAvailable.set(caps.ollamaAvailable);
      this.ollamaModels.set(caps.ollamaModels);
      this.webGpuAvailable.set(caps.webGpuAvailable);
    } catch {
      // Ignore capability check failure
    }
  }

  t(key: string): string {
    return this.translationService.t(key);
  }

  updateApiKey(val: string) {
    const trimmed = val.trim();
    this.userApiKey.set(trimmed);
    if (trimmed) {
      setStoredApiKey(trimmed);
    } else {
      removeStoredApiKey();
    }
  }

  updateModel(val: string) {
    this.userModel.set(val);
    setStoredModel(val);
  }

  updateLanguage(val: string) {
    this.userLanguage.set(val);
    this.translationService.setLanguage(val);
  }

  updateTemperature(val: number) {
    this.userTemperature.set(val);
    setStoredTemperature(val);
  }

  updateThinkingLevel(val: ThinkingLevel) {
    this.userThinkingLevel.set(val);
    setStoredThinkingLevel(val);
  }

  ollamaHost = signal(localStorage.getItem('spark_ollama_host') || 'http://localhost:11434');
  customModelInput = signal(localStorage.getItem('spark_custom_ollama_model') || '');
  prewarmStatus = signal<'idle' | 'prewarming' | 'ready' | 'error'>('idle');

  selectWebGpuModel(key: WebGpuModelKey) {
    this.selectedWebGpuModel.set(key);
    this.geminiService.setSelectedWebGpuModelKey(key);
    if (this.isWebGpuActive()) {
      this.updateModel(`webgpu:${key}`);
    }
  }

  activateWebGpu() {
    const key = this.selectedWebGpuModel();
    this.geminiService.setSelectedWebGpuModelKey(key);
    this.updateModel(`webgpu:${key}`);
    setStoredApiKey('webgpu-active');
    this.userApiKey.set('webgpu-active');
  }

  async loadWebGpuModel() {
    const key = this.selectedWebGpuModel();
    this.activateWebGpu();
    await this.geminiService.preloadWebGpuModel(key);
  }

  selectOpenModel(modelName: string) {
    if (!modelName || !modelName.trim()) return;
    const trimmed = modelName.trim();
    const fullModel = trimmed.startsWith('ollama:') ? trimmed : `ollama:${trimmed}`;
    this.updateModel(fullModel);
    localStorage.setItem('spark_custom_ollama_model', trimmed);
    this.customModelInput.set(trimmed);
    setStoredApiKey('local-ollama-active');
    this.userApiKey.set('local-ollama-active');
  }

  updateOllamaHost(url: string) {
    const trimmed = url.trim() || 'http://localhost:11434';
    this.ollamaHost.set(trimmed);
    localStorage.setItem('spark_ollama_host', trimmed);
    this.refreshOllamaCapabilities();
  }

  async prewarmVram(modelName = 'pivotpulse') {
    this.prewarmStatus.set('prewarming');
    try {
      const ok = await this.geminiService.prewarmLocalVram(modelName);
      this.prewarmStatus.set(ok ? 'ready' : 'error');
    } catch {
      this.prewarmStatus.set('error');
    }
  }

  async refreshOllamaCapabilities() {
    try {
      const caps = await this.geminiService.checkOnDeviceCapabilities();
      this.ollamaAvailable.set(caps.ollamaAvailable);
      this.ollamaModels.set(caps.ollamaModels);
    } catch {
      // ignore
    }
  }
}