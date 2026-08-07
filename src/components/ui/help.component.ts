import { Component, input, output, model, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './icon.component';
import { LojongCleansingComponent } from './lojong-cleansing.component';

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
            <h2 class="text-transparent bg-clip-text bg-linear-to-r from-(--text-highlight) to-(--text-accent)">Help & Pro Tips</h2>
            <p class="text-(--text-color-muted) mt-1">Get the most out of Pivot & Pulse in {{ appMode() === 'creative' ? 'Creative' : 'Care' }} Mode.</p>
          </div>
        </div>
      </header>
      
      @if (appMode() === 'creative') {
        <div class="space-y-6">
          <div class="bg-(--card-bg) p-6 rounded-2xl border border-[var(--border-color)]">
              <h3 class="text-(--text-accent) flex items-center gap-2 mb-2">
                <app-icon name="sparkles" [size]="20"></app-icon>
                Crafting the Perfect Creative Prompt
              </h3>
              <p class="text-sm text-(--text-color-muted) mb-3">
                A good prompt gives the AI constraints to build against while leaving room for unexpected lateral connections. Use this simple formula:
              </p>
              <div class="mb-4 p-3 bg-white/5 border border-(--border-color)/30 rounded-xl text-xs font-mono text-[var(--text-highlight)]">
                Formula: Challenge + Context/Target + Desired Outcome/Style
              </div>
              <ul class="list-disc pl-6 space-y-2 text-(--text-color) text-sm/relaxed">
                <li><strong>Provide Rich Context:</strong> Instead of "write a story about a key," try: <em>"A sci-fi short story about an ancient brass key found on a metallic asteroid (Context) that doesn't fit any mechanical lock but reacts to light frequencies (Challenge)."</em></li>
                <li><strong>Introduce Creative Roles or Voices:</strong> Use the <strong>Perspective (Gist)</strong> field to guide the tone of the insights. Ask for unique angles: <em>"Explain this like a cynical 1940s noir detective"</em> or <em>"Filter through the lens of a landscape architect."</em></li>
                <li><strong>Identify the Real Obstacles:</strong> Be clear about what is holding you back. If you are designing a product, list the core constraints (e.g., "no electricity available", "needs to fit in a pocket").</li>
              </ul>
          </div>

          <div class="bg-(--card-bg) p-6 rounded-2xl border border-[var(--border-color)]">
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
          
          <div class="bg-(--card-bg) p-6 rounded-2xl border border-[var(--border-color)]">
              <h3 class="text-(--text-accent) flex items-center gap-2 mb-2">
                <app-icon name="dice" [size]="20"></app-icon>
                Using the Thinking "Spark Plugs"
              </h3>
              <ul class="list-disc pl-6 space-y-2 text-(--text-color) text-sm/relaxed">
                <li><strong>The Butterfly Effect (Chaos Theory):</strong> Great for plot hooks, marketing, or design. It helps you search for tiny, low-cost micro-changes that trigger massive, cascading positive outcomes.</li>
                <li><strong>Combinatorial Evolution:</strong> Merges your problem with a seemingly unrelated field (like biology or music) to force a brand-new hybrid concept.</li>
                <li><strong>Go Random:</strong> If you're facing a severe block, don't select any strategies. The app will roll a random trio of strategies for you, sparking spontaneous associations.</li>
              </ul>
          </div>

          <div class="bg-(--card-bg) p-6 rounded-2xl border border-[var(--border-color)]">
              <h3 class="text-(--text-accent) flex items-center gap-2 mb-2">
                <app-icon name="activity" [size]="20" fallback="sparkles"></app-icon>
                Movement & Posture for Insight (Incubation)
              </h3>
              <ul class="list-disc pl-6 space-y-2 text-(--text-color) text-sm/relaxed">
                <li><strong>The Nietzsche Walk:</strong> <em>"All truly great thoughts are conceived while walking."</em> Light physical pacing engages the motor cortex, boosting divergent thinking and lowering rigid focus.</li>
                <li><strong>Horizontal Incubation:</strong> Lying down reduces adrenaline levels associated with hyper-focused stress, allowing the brain to wander freely and connect distant memories (the "Aha!" moment).</li>
                <li><strong>Environmental Reset:</strong> Changing your physical surroundings resets context-dependent memory blocks, freeing your mind from circular thinking patterns.</li>
              </ul>
          </div>
        </div>
      } @else {
        <div class="space-y-6">
          <div class="bg-(--card-bg) p-6 rounded-2xl border border-[var(--border-color)]">
              <h3 class="text-(--text-accent) flex items-center gap-2 mb-2">
                <app-icon name="shield" [size]="20"></app-icon>
                HIPAA Compliance & Safety
              </h3>
              <ul class="list-disc pl-6 space-y-2 text-(--text-color) text-sm/relaxed">
                <li><strong>De-identify Everything:</strong> <strong class="text-[var(--text-highlight)]">Never use real patient names, dates, addresses, or any other Protected Health Information (PHI).</strong> The app is a tool for creative problem-solving, not a medical record.</li>
                <li><strong>Focus on the Health Challenge:</strong> Describe the challenge abstractly. Good: "78 y/o M with CHF, goal to improve med adherence." Bad: "John Smith, DOB 1/1/46, needs help taking his Lasix."</li>
                <li><strong>Review All Output:</strong> Always use your clinical judgment to review and validate any suggestions before applying them in a real-world scenario.</li>
              </ul>
          </div>
          <div class="bg-(--card-bg) p-6 rounded-2xl border border-[var(--border-color)]">
              <h3 class="text-(--text-accent) flex items-center gap-2 mb-2">
                <app-icon name="heart-pulse" [size]="20"></app-icon>
                Thinking in Systems
              </h3>
              <ul class="list-disc pl-6 space-y-2 text-(--text-color) text-sm/relaxed">
                <li><strong>The Patient as a System:</strong> Use the <strong>Systems Theorist</strong> role to view the patient as a "Complex Adaptive System." Look for feedback loops—does a treatment cause a side effect that feeds back into the original problem?</li>
                <li><strong>Leverage Points (Butterfly Effect):</strong> Use this strategy to find the "minimum effective dose" or the smallest behavioral change that creates the biggest ripple effect in health improvement.</li>
                <li><strong>Save the Best Insights:</strong> As insights are generated, use the bookmark icon to save the most relevant ones. A care plan can only be synthesized from your saved insights.</li>
              </ul>
          </div>
        </div>
      }

      <!-- Copyleft & Licensing Section -->
      <div class="bg-(--card-bg) p-6 rounded-2xl border border-[var(--border-color)]">
        <h3 class="text-(--text-accent) flex items-center gap-2 mb-2">
          <app-icon name="key" [size]="20"></app-icon>
          Sharing License, Credits & Attribution (Copyleft)
        </h3>
        <p class="text-sm text-(--text-color)/90 leading-relaxed mb-3">
          All concepts, strategies, and plans generated by Pivot & Pulse are open-shared under the <strong>Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)</strong> license.
        </p>
        <ul class="list-disc pl-6 space-y-2 text-(--text-color) text-sm/relaxed">
          <li><strong>Adapt and Share Freely:</strong> You are free to modify, mix, and build upon any output generated here, even for commercial purposes.</li>
          <li><strong>Preserve the License (Copyleft):</strong> If you adapt or share these ideas, you must release them under the same CC BY-SA 4.0 license.</li>
          <li><strong>Attribute the System & Creator:</strong> Standard credit should list the creators and core foundations: 
            <br><em class="block mt-1 pl-2 border-l-2 border-(--text-accent)/30 text-(--text-highlight) text-xs font-mono">
              "Ideated via Pivot & Pulse (a GearArts Project designed by Phil Gear), powered by Google Gemini, and inspired by Edward de Bono's Lateral Thinking."
            </em>
          </li>
        </ul>
        <div class="mt-4 pt-4 border-t border-(--border-color)/40 flex flex-wrap gap-4 items-center justify-between text-xs text-[var(--text-color-muted)]">
          <div class="flex items-center gap-1.5">
            <app-icon name="book" [size]="14"></app-icon>
            <span>Inspired by <strong>Edward de Bono's "Lateral Thinking"</strong></span>
          </div>
          <div class="flex items-center gap-1.5">
            <a href="https://orcid.org/0009-0008-1372-5381" target="_blank" rel="noopener noreferrer" class="hover:text-(--text-accent) transition-colors inline-flex items-center gap-1 font-semibold">
              <img src="assets/orcid.svg" alt="ORCID iD" class="h-3.5 w-3.5 inline select-none" width="14" height="14">
              Researcher ID: 0009-0008-1372-5381 (Phil Gear)
            </a>
          </div>
          <div class="flex items-center gap-1.5">
            <app-icon name="sparkles" [size]="14"></app-icon>
            <span>Powered by <strong>Google Gemini</strong></span>
          </div>
        </div>
      </div>

      <!-- Collapsible Developer Diagnostics (Chaos Mode) -->
      <details class="bg-(--card-bg) p-6 rounded-2xl border border-(--border-color) group cursor-pointer">
        <summary class="text-(--text-accent) flex items-center justify-between font-semibold select-none list-none outline-none">
          <div class="flex items-center gap-2">
            <app-icon name="activity" [size]="20"></app-icon>
            <span>Developer Diagnostics (Chaos Mode)</span>
          </div>
          <span class="transition-transform duration-200 group-open:rotate-180">
            <app-icon name="chevron-down" [size]="16" fallback="sparkles"></app-icon>
          </span>
        </summary>
        
        <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
        <div class="mt-4 pt-4 border-t border-(--border-color)/40 cursor-default" (click)="$event.stopPropagation()">
          <p class="text-sm text-(--text-color-muted) mb-4">
            Simulate backend API failures (429, 500, or network drops) to test client-side resilience and retry patterns.
          </p>
          
          <div class="space-y-4">
            <div>
              <span class="block text-xs font-semibold uppercase tracking-wider text-(--text-color-muted) mb-2">Simulated Failure Type</span>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button (click)="chaosType.set(null)"
                        [class.bg-[var(--text-accent)]]="chaosType() === null"
                        [class.text-[var(--primary-cta-text)]]="chaosType() === null"
                        [class.bg-[var(--button-bg)]]="chaosType() !== null"
                        [class.hover:bg-(--button-bg-hover)]="chaosType() !== null"
                        class="text-xs font-medium py-2 px-3 rounded-lg border border-(--border-color) transition-colors focus:outline-none focus:ring-1 focus:ring-(--ring-color)">
                  None (Normal)
                </button>
                <button (click)="chaosType.set('429')"
                        [class.bg-[var(--text-accent)]]="chaosType() === '429'"
                        [class.text-[var(--primary-cta-text)]]="chaosType() === '429'"
                        [class.bg-[var(--button-bg)]]="chaosType() !== '429'"
                        [class.hover:bg-(--button-bg-hover)]="chaosType() !== '429'"
                        class="text-xs font-medium py-2 px-3 rounded-lg border border-(--border-color) transition-colors focus:outline-none focus:ring-1 focus:ring-(--ring-color)">
                  429 Rate Limit
                </button>
                <button (click)="chaosType.set('500')"
                        [class.bg-[var(--text-accent)]]="chaosType() === '500'"
                        [class.text-[var(--primary-cta-text)]]="chaosType() === '500'"
                        [class.bg-[var(--button-bg)]]="chaosType() !== '500'"
                        [class.hover:bg-(--button-bg-hover)]="chaosType() !== '500'"
                        class="text-xs font-medium py-2 px-3 rounded-lg border border-(--border-color) transition-colors focus:outline-none focus:ring-1 focus:ring-(--ring-color)">
                  500 Internal Error
                </button>
                <button (click)="chaosType.set('drop')"
                        [class.bg-[var(--text-accent)]]="chaosType() === 'drop'"
                        [class.text-[var(--primary-cta-text)]]="chaosType() === 'drop'"
                        [class.bg-[var(--button-bg)]]="chaosType() !== 'drop'"
                        [class.hover:bg-(--button-bg-hover)]="chaosType() !== 'drop'"
                        class="text-xs font-medium py-2 px-3 rounded-lg border border-(--border-color) transition-colors focus:outline-none focus:ring-1 focus:ring-(--ring-color)">
                  Network Drop
                </button>
              </div>
            </div>

            @if (chaosType() !== null) {
              <div class="animate-in slide-in-from-top-2 duration-200">
                <span class="block text-xs font-semibold uppercase tracking-wider text-(--text-color-muted) mb-2">Failure Behavior</span>
                <div class="flex gap-2">
                  <button (click)="chaosBehavior.set('transient')"
                          [class.bg-[var(--text-accent)]]="chaosBehavior() === 'transient'"
                          [class.text-[var(--primary-cta-text)]]="chaosBehavior() === 'transient'"
                          [class.bg-[var(--button-bg)]]="chaosBehavior() !== 'transient'"
                          [class.hover:bg-(--button-bg-hover)]="chaosBehavior() !== 'transient'"
                          class="flex-1 text-xs font-medium py-2 px-3 rounded-lg border border-(--border-color) transition-colors focus:outline-none focus:ring-1 focus:ring-(--ring-color)">
                    Transient (Recovers on 3rd attempt)
                  </button>
                  <button (click)="chaosBehavior.set('permanent')"
                          [class.bg-[var(--text-accent)]]="chaosBehavior() === 'permanent'"
                          [class.text-[var(--primary-cta-text)]]="chaosBehavior() === 'permanent'"
                          [class.bg-[var(--button-bg)]]="chaosBehavior() !== 'permanent'"
                          [class.hover:bg-(--button-bg-hover)]="chaosBehavior() !== 'permanent'"
                          class="flex-1 text-xs font-medium py-2 px-3 rounded-lg border border-(--border-color) transition-colors focus:outline-none focus:ring-1 focus:ring-(--ring-color)">
                    Permanent (Always fails)
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </details>
      
      <!-- Gemini Flash Model Selection -->
      <div class="bg-(--card-bg) p-6 rounded-2xl border border-[var(--border-color)]">
        <h3 class="text-(--text-accent) flex items-center gap-2 mb-2">
          <app-icon name="sparkles" [size]="20"></app-icon>
          Gemini Flash Model Tier
        </h3>
        <p class="text-sm text-(--text-color-muted) mb-4">
          Select the Google Gemini Flash model tier for streaming insights, multi-agent debate, and care plans.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
          <button (click)="updateModel('gemini-3.6-flash')"
                  [class.bg-[var(--text-accent)]]="userModel() === 'gemini-3.6-flash'"
                  [class.text-[var(--primary-cta-text)]]="userModel() === 'gemini-3.6-flash'"
                  [class.bg-[var(--button-bg)]]="userModel() !== 'gemini-3.6-flash'"
                  [class.hover:bg-(--button-bg-hover)]="userModel() !== 'gemini-3.6-flash'"
                  class="text-xs font-semibold p-3.5 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex flex-col justify-between cursor-pointer">
            <div>
              <div class="font-bold text-sm">Gemini 3.6 Flash</div>
              <div class="opacity-80 text-[11px] font-normal mt-1 leading-snug">Sub-second latency & highest reasoning accuracy</div>
            </div>
            <span class="inline-block text-[10px] uppercase font-bold tracking-wider mt-3 px-2 py-0.5 rounded bg-black/20 text-current w-fit">Recommended</span>
          </button>

          <button (click)="updateModel('gemini-3-flash')"
                  [class.bg-[var(--text-accent)]]="userModel() === 'gemini-3-flash'"
                  [class.text-[var(--primary-cta-text)]]="userModel() === 'gemini-3-flash'"
                  [class.bg-[var(--button-bg)]]="userModel() !== 'gemini-3-flash'"
                  [class.hover:bg-(--button-bg-hover)]="userModel() !== 'gemini-3-flash'"
                  class="text-xs font-semibold p-3.5 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex flex-col justify-between cursor-pointer">
            <div>
              <div class="font-bold text-sm">Gemini 3 Flash</div>
              <div class="opacity-80 text-[11px] font-normal mt-1 leading-snug">High speed & balanced lateral context</div>
            </div>
          </button>

          <button (click)="updateModel('gemini-2.5-flash')"
                  [class.bg-[var(--text-accent)]]="userModel() === 'gemini-2.5-flash'"
                  [class.text-[var(--primary-cta-text)]]="userModel() === 'gemini-2.5-flash'"
                  [class.bg-[var(--button-bg)]]="userModel() !== 'gemini-2.5-flash'"
                  [class.hover:bg-(--button-bg-hover)]="userModel() !== 'gemini-2.5-flash'"
                  class="text-xs font-semibold p-3.5 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex flex-col justify-between cursor-pointer">
            <div>
              <div class="font-bold text-sm">Gemini 2.5 Flash</div>
              <div class="opacity-80 text-[11px] font-normal mt-1 leading-snug">Legacy Flash engine compatibility mode</div>
            </div>
          </button>
        </div>
      </div>

      <!-- Multilingual & Portland Sister Cities Target Language -->
      <div class="bg-(--card-bg) p-6 rounded-2xl border border-[var(--border-color)] mb-6">
        <h3 class="text-(--text-accent) flex items-center gap-2 mb-2">
          <app-icon name="globe" [size]="20"></app-icon>
          Target Output Language & Portland Sister Cities
        </h3>
        <p class="text-sm text-(--text-color-muted) mb-4">
          Select native AI generation language for Creative Insights & Care Plans. Includes Portland, Oregon's official Sister Cities.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <button (click)="updateLanguage('en')"
                  [class.bg-[var(--text-accent)]]="userLanguage() === 'en'"
                  [class.text-[var(--primary-cta-text)]]="userLanguage() === 'en'"
                  [class.bg-[var(--button-bg)]]="userLanguage() !== 'en'"
                  [class.hover:bg-(--button-bg-hover)]="userLanguage() !== 'en'"
                  class="text-xs font-semibold p-3 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex items-center justify-between cursor-pointer">
            <span>🇺🇸 English</span>
            <span class="opacity-70 text-[10px]">Default</span>
          </button>
          <button (click)="updateLanguage('ja')"
                  [class.bg-[var(--text-accent)]]="userLanguage() === 'ja'"
                  [class.text-[var(--primary-cta-text)]]="userLanguage() === 'ja'"
                  [class.bg-[var(--button-bg)]]="userLanguage() !== 'ja'"
                  [class.hover:bg-(--button-bg-hover)]="userLanguage() !== 'ja'"
                  class="text-xs font-semibold p-3 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex items-center justify-between cursor-pointer">
            <span>🇯🇵 Japanese</span>
            <span class="opacity-70 text-[10px]">Sapporo 🌸</span>
          </button>
          <button (click)="updateLanguage('es')"
                  [class.bg-[var(--text-accent)]]="userLanguage() === 'es'"
                  [class.text-[var(--primary-cta-text)]]="userLanguage() === 'es'"
                  [class.bg-[var(--button-bg)]]="userLanguage() !== 'es'"
                  [class.hover:bg-(--button-bg-hover)]="userLanguage() !== 'es'"
                  class="text-xs font-semibold p-3 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex items-center justify-between cursor-pointer">
            <span>🇲🇽 Spanish</span>
            <span class="opacity-70 text-[10px]">Guadalajara 🇲🇽</span>
          </button>
          <button (click)="updateLanguage('zh')"
                  [class.bg-[var(--text-accent)]]="userLanguage() === 'zh'"
                  [class.text-[var(--primary-cta-text)]]="userLanguage() === 'zh'"
                  [class.bg-[var(--button-bg)]]="userLanguage() !== 'zh'"
                  [class.hover:bg-(--button-bg-hover)]="userLanguage() !== 'zh'"
                  class="text-xs font-semibold p-3 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex items-center justify-between cursor-pointer">
            <span>🇹🇼 Mandarin</span>
            <span class="opacity-70 text-[10px]">Kaohsiung/Suzhou 🏮</span>
          </button>
          <button (click)="updateLanguage('ko')"
                  [class.bg-[var(--text-accent)]]="userLanguage() === 'ko'"
                  [class.text-[var(--primary-cta-text)]]="userLanguage() === 'ko'"
                  [class.bg-[var(--button-bg)]]="userLanguage() !== 'ko'"
                  [class.hover:bg-(--button-bg-hover)]="userLanguage() !== 'ko'"
                  class="text-xs font-semibold p-3 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex items-center justify-between cursor-pointer">
            <span>🇰🇷 Korean</span>
            <span class="opacity-70 text-[10px]">Ulsan 🇰🇷</span>
          </button>
          <button (click)="updateLanguage('it')"
                  [class.bg-[var(--text-accent)]]="userLanguage() === 'it'"
                  [class.text-[var(--primary-cta-text)]]="userLanguage() === 'it'"
                  [class.bg-[var(--button-bg)]]="userLanguage() !== 'it'"
                  [class.hover:bg-(--button-bg-hover)]="userLanguage() !== 'it'"
                  class="text-xs font-semibold p-3 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex items-center justify-between cursor-pointer">
            <span>🇮🇹 Italian</span>
            <span class="opacity-70 text-[10px]">Bologna 🏛️</span>
          </button>
          <button (click)="updateLanguage('he')"
                  [class.bg-[var(--text-accent)]]="userLanguage() === 'he'"
                  [class.text-[var(--primary-cta-text)]]="userLanguage() === 'he'"
                  [class.bg-[var(--button-bg)]]="userLanguage() !== 'he'"
                  [class.hover:bg-(--button-bg-hover)]="userLanguage() !== 'he'"
                  class="text-xs font-semibold p-3 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex items-center justify-between cursor-pointer">
            <span>🇮🇱 Hebrew</span>
            <span class="opacity-70 text-[10px]">Ashkelon 🕊️</span>
          </button>
          <button (click)="updateLanguage('ms')"
                  [class.bg-[var(--text-accent)]]="userLanguage() === 'ms'"
                  [class.text-[var(--primary-cta-text)]]="userLanguage() === 'ms'"
                  [class.bg-[var(--button-bg)]]="userLanguage() !== 'ms'"
                  [class.hover:bg-(--button-bg-hover)]="userLanguage() !== 'ms'"
                  class="text-xs font-semibold p-3 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex items-center justify-between cursor-pointer">
            <span>🇲🇾 Malay</span>
            <span class="opacity-70 text-[10px]">Kota Kinabalu 🌴</span>
          </button>
          <button (click)="updateLanguage('sn')"
                  [class.bg-[var(--text-accent)]]="userLanguage() === 'sn'"
                  [class.text-[var(--primary-cta-text)]]="userLanguage() === 'sn'"
                  [class.bg-[var(--button-bg)]]="userLanguage() !== 'sn'"
                  [class.hover:bg-(--button-bg-hover)]="userLanguage() !== 'sn'"
                  class="text-xs font-semibold p-3 rounded-xl border border-(--border-color) transition-all focus:outline-none focus:ring-2 focus:ring-(--ring-color) text-left flex items-center justify-between cursor-pointer">
            <span>🇿🇼 Shona</span>
            <span class="opacity-70 text-[10px]">Mutare 🇿🇼</span>
          </button>
        </div>
      </div>

      <!-- Gemini API Key Settings -->
      <div class="bg-(--card-bg) p-6 rounded-2xl border border-[var(--border-color)]">
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

      <div class="text-center pt-8 border-t border-[var(--border-color)]">
        <button (click)="back.emit()" class="bg-(--primary-cta-bg) text-(--primary-cta-text) font-bold py-3 px-8 min-h-[48px] rounded-lg shadow-lg hover:bg-(--primary-cta-hover-bg) transition-all flex items-center justify-center gap-2 mx-auto focus:outline-none focus:ring-2 focus:ring-(--ring-color) hover:scale-105 active:scale-95 mb-6">
          <app-icon name="sparkles" [size]="20"></app-icon>
          Let's Get Started
        </button>

        <div class="text-xs text-(--text-color-muted) flex flex-wrap justify-center gap-x-4 gap-y-1 opacity-80 pt-4 border-t border-(--border-color) max-w-sm mx-auto">
          <a href="/terms" target="_blank" class="hover:text-(--text-accent) transition-colors">Terms & Conditions</a>
          <span class="text-[var(--border-color)]">•</span>
          <a href="/privacy" target="_blank" class="hover:text-(--text-accent) transition-colors">Privacy Policy</a>
        </div>
      </div>
    </section>
  `
})
export class HelpComponent {
  appMode = input.required<'creative' | 'care'>();
  logoPath = input.required<string>();
  back = output<void>();
  
  chaosType = model<'429' | '500' | 'drop' | null>(null);
  chaosBehavior = model<'transient' | 'permanent'>('transient');

  userApiKey = signal(getStoredApiKey());
  userModel = signal(getStoredModel());
  userLanguage = signal(getStoredLanguage());
  
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
    setStoredLanguage(val);
  }
}

function getStoredLanguage(): string {
  return localStorage.getItem('spark_lang_val') || localStorage.getItem('user_target_language') || 'en';
}

function setStoredLanguage(val: string): void {
  localStorage.setItem('spark_lang_val', val);
  localStorage.setItem('user_target_language', val);
}