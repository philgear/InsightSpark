import { Component, input, output, model, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './icon.component';
import { LojongCleansingComponent } from './lojong-cleansing.component';
import { TranslationService } from '../../services/translation.service';
import { GeminiService } from '../../services/gemini.service';

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

function setStoredApiKey(key: string): void {
  if (key === 'demo-key-active') {
    localStorage.setItem('spark_cfg_val', key);
  } else {
    localStorage.setItem('spark_cfg_val', btoa(key));
  }
}

function removeStoredApiKey(): void {
  localStorage.removeItem('spark_cfg_val');
  localStorage.removeItem('user_gemini_api_key');
}

function getStoredModel(): string {
  return localStorage.getItem('spark_model_val') || localStorage.getItem('user_gemini_model') || 'gemini-3.6-flash';
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

function getStoredThinkingBudget(): number {
  const val = localStorage.getItem('spark_thinking_budget');
  if (val !== null && !isNaN(Number(val))) {
    return Number(val);
  }
  return 0; // 0 = standard / auto
}

function setStoredThinkingBudget(budget: number): void {
  localStorage.setItem('spark_thinking_budget', budget.toString());
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
          <!-- Gemini 3.7 Flash -->
          <button (click)="updateModel('gemini-3.7-flash')"
                  [class.bg-(--text-accent)]="userModel() === 'gemini-3.7-flash'"
                  [class.text-(--primary-cta-text)]="userModel() === 'gemini-3.7-flash'"
                  [class.bg-(--button-bg)]="userModel() !== 'gemini-3.7-flash'"
                  [class.hover:bg-(--button-bg-hover)]="userModel() !== 'gemini-3.7-flash'"
                  class="text-xs font-semibold p-3.5 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex flex-col justify-between cursor-pointer">
            <div>
              <div class="font-bold text-sm flex items-center gap-1.5">
                <span>Gemini 3.7 Flash</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">NEW</span>
              </div>
              <div class="opacity-80 text-[11px] font-normal mt-1 leading-snug">Cutting-edge speed with hybrid thinking & reasoning</div>
            </div>
            <span class="inline-block text-[10px] uppercase font-bold tracking-wider mt-3 px-2 py-0.5 rounded bg-black/20 text-current w-fit">Next-Gen</span>
          </button>

          <!-- Gemini 3.6 Flash -->
          <button (click)="updateModel('gemini-3.6-flash')"
                  [class.bg-(--text-accent)]="userModel() === 'gemini-3.6-flash'"
                  [class.text-(--primary-cta-text)]="userModel() === 'gemini-3.6-flash'"
                  [class.bg-(--button-bg)]="userModel() !== 'gemini-3.6-flash'"
                  [class.hover:bg-(--button-bg-hover)]="userModel() !== 'gemini-3.6-flash'"
                  class="text-xs font-semibold p-3.5 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex flex-col justify-between cursor-pointer">
            <div>
              <div class="font-bold text-sm">Gemini 3.6 Flash</div>
              <div class="opacity-80 text-[11px] font-normal mt-1 leading-snug">Sub-second latency & highest lateral consistency</div>
            </div>
            <span class="inline-block text-[10px] uppercase font-bold tracking-wider mt-3 px-2 py-0.5 rounded bg-black/20 text-current w-fit">Default</span>
          </button>

          <!-- Gemini 2.5 Pro -->
          <button (click)="updateModel('gemini-2.5-pro')"
                  [class.bg-(--text-accent)]="userModel() === 'gemini-2.5-pro'"
                  [class.text-(--primary-cta-text)]="userModel() === 'gemini-2.5-pro'"
                  [class.bg-(--button-bg)]="userModel() !== 'gemini-2.5-pro'"
                  [class.hover:bg-(--button-bg-hover)]="userModel() !== 'gemini-2.5-pro'"
                  class="text-xs font-semibold p-3.5 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex flex-col justify-between cursor-pointer">
            <div>
              <div class="font-bold text-sm">Gemini 2.5 Pro</div>
              <div class="opacity-80 text-[11px] font-normal mt-1 leading-snug">Deep analytical synthesis for complex clinical edge cases</div>
            </div>
            <span class="inline-block text-[10px] uppercase font-bold tracking-wider mt-3 px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 w-fit">Deep Reasoning</span>
          </button>

          <!-- Chrome Built-in AI (Gemini Nano on Device) -->
          <button (click)="updateModel('on-device-nano')"
                  [class.bg-(--text-accent)]="userModel() === 'on-device-nano'"
                  [class.text-(--primary-cta-text)]="userModel() === 'on-device-nano'"
                  [class.bg-(--button-bg)]="userModel() !== 'on-device-nano'"
                  [class.hover:bg-(--button-bg-hover)]="userModel() !== 'on-device-nano'"
                  class="text-xs font-semibold p-3.5 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex flex-col justify-between cursor-pointer">
            <div>
              <div class="font-bold text-sm flex items-center gap-1.5">
                <span>Chrome On-Device AI</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">100% PRIVATE</span>
              </div>
              <div class="opacity-80 text-[11px] font-normal mt-1 leading-snug">Runs Gemini Nano locally on your device NPU/GPU via Chrome Prompt API. 0 data sent.</div>
            </div>
            <div class="flex items-center gap-1.5 mt-3">
              @if (chromeAiAvailable()) {
                <span class="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 w-fit">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Available
                </span>
              } @else {
                <span class="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 w-fit">Chrome 127+ API</span>
              }
            </div>
          </button>

          <!-- Local Gemma on-device (Ollama) -->
          <button (click)="updateModel('ollama:gemma2')"
                  [class.bg-(--text-accent)]="userModel() === 'ollama:gemma2' || userModel().startsWith('ollama:')"
                  [class.text-(--primary-cta-text)]="userModel() === 'ollama:gemma2' || userModel().startsWith('ollama:')"
                  [class.bg-(--button-bg)]="userModel() !== 'ollama:gemma2' && !userModel().startsWith('ollama:')"
                  [class.hover:bg-(--button-bg-hover)]="userModel() !== 'ollama:gemma2' && !userModel().startsWith('ollama:')"
                  class="text-xs font-semibold p-3.5 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex flex-col justify-between cursor-pointer">
            <div>
              <div class="font-bold text-sm flex items-center gap-1.5">
                <span>Local Gemma (Ollama)</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">LOCAL</span>
              </div>
              <div class="opacity-80 text-[11px] font-normal mt-1 leading-snug">Runs Gemma 2/3 on your local PC/Mac (localhost:11434) with zero server hops.</div>
            </div>
            <div class="flex items-center gap-1.5 mt-3">
              @if (ollamaAvailable()) {
                <span class="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 w-fit">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Connected
                </span>
              } @else {
                <span class="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/20 text-current w-fit">Ollama Daemon</span>
              }
            </div>
          </button>

          <!-- Gemma 2 27B (Google Cloud) -->
          <button (click)="updateModel('gemma-2-27b-it')"
                  [class.bg-(--text-accent)]="userModel() === 'gemma-2-27b-it'"
                  [class.text-(--primary-cta-text)]="userModel() === 'gemma-2-27b-it'"
                  [class.bg-(--button-bg)]="userModel() !== 'gemma-2-27b-it'"
                  [class.hover:bg-(--button-bg-hover)]="userModel() !== 'gemma-2-27b-it'"
                  class="text-xs font-semibold p-3.5 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex flex-col justify-between cursor-pointer">
            <div>
              <div class="font-bold text-sm flex items-center gap-1.5">
                <span>Gemma 2 27B</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">OPEN</span>
              </div>
              <div class="opacity-80 text-[11px] font-normal mt-1 leading-snug">Open-weights research architecture hosted on Google AI Studio</div>
            </div>
            <span class="inline-block text-[10px] uppercase font-bold tracking-wider mt-3 px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 w-fit">Google Gemma</span>
          </button>
        </div>
      </div>

      <!-- Hyperparameter Fine-Tuning: Temperature & Reasoning Budget -->
      <div class="bg-(--card-bg) p-6 rounded-2xl border border-(--border-color)">
        <h3 class="text-(--text-accent) flex items-center gap-2 mb-2">
          <app-icon name="activity" [size]="20"></app-icon>
          {{ t('settings.temperature.title') }}
        </h3>
        <p class="text-sm text-(--text-color-muted) mb-4">
          {{ t('settings.temperature.desc') }}
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

          <!-- Thinking / Reasoning Budget -->
          <div class="pt-4 border-t border-(--border-color)/50">
            <h4 class="text-xs font-semibold text-(--text-color) mb-1.5">{{ t('settings.thinking.title') }}</h4>
            <p class="text-[11px] text-(--text-color-muted) mb-3">{{ t('settings.thinking.desc') }}</p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button (click)="updateThinkingBudget(0)"
                      [class.bg-(--text-accent)]="userThinkingBudget() === 0"
                      [class.text-(--primary-cta-text)]="userThinkingBudget() === 0"
                      [class.bg-(--button-bg)]="userThinkingBudget() !== 0"
                      class="text-xs font-medium py-2 px-3 rounded-lg border border-(--border-color) transition-all cursor-pointer">
                {{ t('settings.thinking.off') }}
              </button>
              <button (click)="updateThinkingBudget(1024)"
                      [class.bg-(--text-accent)]="userThinkingBudget() === 1024"
                      [class.text-(--primary-cta-text)]="userThinkingBudget() === 1024"
                      [class.bg-(--button-bg)]="userThinkingBudget() !== 1024"
                      class="text-xs font-medium py-2 px-3 rounded-lg border border-(--border-color) transition-all cursor-pointer">
                {{ t('settings.thinking.low') }}
              </button>
              <button (click)="updateThinkingBudget(2048)"
                      [class.bg-(--text-accent)]="userThinkingBudget() === 2048"
                      [class.text-(--primary-cta-text)]="userThinkingBudget() === 2048"
                      [class.bg-(--button-bg)]="userThinkingBudget() !== 2048"
                      class="text-xs font-medium py-2 px-3 rounded-lg border border-(--border-color) transition-all cursor-pointer">
                {{ t('settings.thinking.med') }}
              </button>
              <button (click)="updateThinkingBudget(4096)"
                      [class.bg-(--text-accent)]="userThinkingBudget() === 4096"
                      [class.text-(--primary-cta-text)]="userThinkingBudget() === 4096"
                      [class.bg-(--button-bg)]="userThinkingBudget() !== 4096"
                      class="text-xs font-medium py-2 px-3 rounded-lg border border-(--border-color) transition-all cursor-pointer">
                {{ t('settings.thinking.high') }}
              </button>
            </div>
          </div>
        </div>
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

        <div class="text-xs text-(--text-color-muted) flex flex-wrap justify-center gap-x-4 gap-y-1 opacity-80 pt-4 border-t border-(--border-color) max-w-sm mx-auto">
          <a href="/terms" target="_blank" class="hover:text-(--text-accent) transition-colors">Terms & Conditions</a>
          <span class="text-(--border-color)">•</span>
          <a href="/privacy" target="_blank" class="hover:text-(--text-accent) transition-colors">Privacy Policy</a>
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
  userThinkingBudget = signal(getStoredThinkingBudget());

  chromeAiAvailable = signal(false);
  ollamaAvailable = signal(false);
  ollamaModels = signal<string[]>([]);
  
  // Categorized languages
  sisterCityLanguages = this.translationService.supportedLanguages.filter(l => l.isSisterCity || l.code === 'en');
  globalLanguages = this.translationService.supportedLanguages.filter(l => !l.isSisterCity && l.code !== 'en');

  async ngOnInit() {
    try {
      const caps = await this.geminiService.checkOnDeviceCapabilities();
      this.chromeAiAvailable.set(caps.chromeAiAvailable);
      this.ollamaAvailable.set(caps.ollamaAvailable);
      this.ollamaModels.set(caps.ollamaModels);
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

  updateThinkingBudget(val: number) {
    this.userThinkingBudget.set(val);
    setStoredThinkingBudget(val);
  }
}