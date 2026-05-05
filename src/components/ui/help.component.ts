import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './icon.component';
import { LojongCleansingComponent } from './lojong-cleansing.component';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, IconComponent, LojongCleansingComponent],
  template: `
    <section class="space-y-8 animate-in fade-in pb-12">
      <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="p-2 bg-[#21211b] rounded-xl border border-[var(--border-accent)] overflow-hidden shrink-0">
             <img [src]="logoPath()" alt="" class="h-12 w-auto object-contain">
          </div>
          <div>
            <h2 class="text-transparent bg-clip-text bg-linear-to-r from-[var(--text-highlight)] to-[var(--text-accent)]">Help & Pro Tips</h2>
            <p class="text-[var(--text-color-muted)] mt-1">Get the most out of Insight Spark in {{ appMode() === 'creative' ? 'Creative' : 'Care' }} Mode.</p>
          </div>
        </div>
      </header>
      
      @if (appMode() === 'creative') {
        <div class="space-y-6">
          <div class="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border-color)]">
              <h3 class="text-[var(--text-accent)] flex items-center gap-2 mb-2">
                <app-icon name="sparkles" [size]="20"></app-icon>
                Crafting the Perfect Prompt
              </h3>
              <ul class="list-disc pl-6 space-y-2 text-[var(--text-color)] text-sm/relaxed">
                <li><strong>Be Specific, But Not Too Specific:</strong> Provide enough detail to set the scene, but leave room for the AI to be creative. Instead of "a red car," try "a vintage sports car the color of wine."</li>
                <li><strong>State the Goal:</strong> What are you trying to achieve? "I need a tagline for a new coffee brand" is better than just "coffee brand."</li>
                <li><strong>Include Context and Constraints:</strong> Mention the target audience, desired tone, or any limitations. "The tagline should be playful and appeal to young adults."</li>
              </ul>
          </div>
          
          <div class="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border-color)]">
              <h3 class="text-[var(--text-accent)] flex items-center gap-2 mb-2">
                <app-icon name="activity" [size]="20" fallback="sparkles"></app-icon>
                Movement & Posture for Insight
              </h3>
              <ul class="list-disc pl-6 space-y-2 text-[var(--text-color)] text-sm/relaxed">
                <li><strong>The Nietzsche Walk:</strong> "All truly great thoughts are conceived while walking." Pacing or taking a walk increases divergent thinking by engaging the motor cortex.</li>
                <li><strong>The Horizontal Incubation:</strong> Lying down can decrease locus coeruleus activity (associated with stress and hyper-focus), making your brain more receptive to "Aha!" insights.</li>
                <li><strong>Environment Shifting:</strong> Changing your physical location resets context-dependent memory, breaking creative blocks.</li>
              </ul>
          </div>

          <div class="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border-color)]">
              <h3 class="text-[var(--text-accent)] flex items-center gap-2 mb-2">
                <app-icon name="dice" [size]="20"></app-icon>
                Using the Spark Plugs
              </h3>
              <ul class="list-disc pl-6 space-y-2 text-[var(--text-color)] text-sm/relaxed">
                <li><strong>The Butterfly Effect (Chaos Theory):</strong> Use this strategy to find tiny, leverage-point changes that lead to massive outcomes. Great for plot twists or viral marketing ideas.</li>
                <li><strong>Combinatorial Evolution:</strong> Based on the idea that innovation is smashing two things together. Try this when you want to create something "novel" by merging existing concepts.</li>
                <li><strong>Go Random:</strong> If you're not sure where to start, don't select any strategies. The app will pick a random trio for you, which can be a fun way to explore.</li>
              </ul>
          </div>
        </div>
      } @else {
        <div class="space-y-6">
          <div class="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border-color)]">
              <h3 class="text-[var(--text-accent)] flex items-center gap-2 mb-2">
                <app-icon name="shield" [size]="20"></app-icon>
                HIPAA Compliance & Safety
              </h3>
              <ul class="list-disc pl-6 space-y-2 text-[var(--text-color)] text-sm/relaxed">
                <li><strong>De-identify Everything:</strong> <strong class="text-[var(--text-highlight)]">Never use real patient names, dates, addresses, or any other Protected Health Information (PHI).</strong> The app is a tool for creative problem-solving, not a medical record.</li>
                <li><strong>Focus on the Health Challenge:</strong> Describe the challenge abstractly. Good: "78 y/o M with CHF, goal to improve med adherence." Bad: "John Smith, DOB 1/1/46, needs help taking his Lasix."</li>
                <li><strong>Review All Output:</strong> Always use your clinical judgment to review and validate any suggestions before applying them in a real-world scenario.</li>
              </ul>
          </div>
          <div class="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border-color)]">
              <h3 class="text-[var(--text-accent)] flex items-center gap-2 mb-2">
                <app-icon name="heart-pulse" [size]="20"></app-icon>
                Thinking in Systems
              </h3>
              <ul class="list-disc pl-6 space-y-2 text-[var(--text-color)] text-sm/relaxed">
                <li><strong>The Patient as a System:</strong> Use the <strong>Systems Theorist</strong> role to view the patient as a "Complex Adaptive System." Look for feedback loops—does a treatment cause a side effect that feeds back into the original problem?</li>
                <li><strong>Leverage Points (Butterfly Effect):</strong> Use this strategy to find the "minimum effective dose" or the smallest behavioral change that creates the biggest ripple effect in health improvement.</li>
                <li><strong>Save the Best Insights:</strong> As insights are generated, use the bookmark icon to save the most relevant ones. A care plan can only be synthesized from your saved insights.</li>
              </ul>
          </div>
        </div>
      }
      
      <!-- Lojong Anxiety Cleansing Component -->
      <div class="mt-8 mb-6">
        <app-lojong-cleansing></app-lojong-cleansing>
      </div>

      <div class="text-center pt-8 border-t border-[var(--border-color)]">
        <button (click)="back.emit()" class="bg-[var(--primary-cta-bg)] text-[var(--primary-cta-text)] font-bold py-3 px-8 min-h-[48px] rounded-lg shadow-lg hover:bg-[var(--primary-cta-hover-bg)] transition-all flex items-center justify-center gap-2 mx-auto focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)] hover:scale-105 active:scale-95">
          <app-icon name="sparkles" [size]="20"></app-icon>
          Let's Get Started
        </button>
      </div>
    </section>
  `
})
export class HelpComponent {
  appMode = input.required<'creative' | 'care'>();
  logoPath = input.required<string>();
  back = output<void>();
}