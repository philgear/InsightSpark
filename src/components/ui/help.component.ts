import { Component, input, output } from '@angular/core';
import { LojongCleansingComponent } from './lojong-cleansing.component';
import { IconComponent } from './icon.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [LojongCleansingComponent, IconComponent, CommonModule],
  template: `
    <section class="space-y-8 animate-in fade-in pb-12">
      <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="p-2 bg-[#21211b] rounded-xl border border-[var(--border-accent)] overflow-hidden shrink-0">
             <img [src]="logoPath()" alt="" class="h-12 w-auto object-contain">
          </div>
          <div>
            <h2>Help & Pro Tips</h2>
            <p class="text-[var(--text-color-muted)] mt-1">Get the most out of GearArts.</p>
          </div>
        </div>
      </header>
      
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
      </div>
      
      <!-- Lojong Anxiety Cleansing Component -->
      <div class="mt-8 mb-6">
        <app-lojong-cleansing></app-lojong-cleansing>
      </div>

      <div class="text-center pt-8 border-t border-[var(--border-color)]">
        <button (click)="back.emit()" class="bg-[var(--primary-cta-bg)] text-[var(--primary-cta-text)] font-bold py-3 px-8 min-h-[48px] rounded-lg  hover:bg-[var(--primary-cta-hover-bg)] transition-all flex items-center justify-center gap-2 mx-auto focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)] hover:scale-105 active:scale-95">
          <app-icon name="sparkles" [size]="20"></app-icon>
          Let's Get Started
        </button>
      </div>
    </section>
  `,})
export class HelpComponent {
  logoPath = input.required<string>();
  back = output<void>();
}