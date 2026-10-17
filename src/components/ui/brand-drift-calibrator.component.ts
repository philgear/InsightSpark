import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrandDriftCalibratorService } from '../../services/brand-drift-calibrator.service';

@Component({
  selector: 'app-brand-drift-calibrator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="mt-3 rounded-xl border border-(--border-color) bg-(--card-bg) px-4 py-2.5 shadow-sm transition-all"
      aria-label="Tone and Practicality Autopilot"
    >
      <!-- 1-Line Quiet Autopilot Bar (Default Collapsed View) -->
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 text-xs">
          <span
            class="inline-block h-2 w-2 rounded-full"
            [class.bg-emerald-400]="!calibrator.currentTurn().isDrifting"
            [class.bg-amber-400]="calibrator.currentTurn().isDrifting"
          ></span>
          <span class="font-bold text-(--text-color)">
            Tone &amp; Clarity Guard:
          </span>
          <span class="text-(--text-color-muted)">
            @if (calibrator.currentTurn().isDrifting) {
              Auto-grounding buzzwords into everyday language
            } @else {
              {{ calibrator.currentTurn().dominantPositivePole }} · Grounded &amp; Practical
            }
          </span>
          @if (calibrator.selfHealingDpoQueue().length > 0) {
            <span class="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
              {{ calibrator.selfHealingDpoQueue().length }} card(s) simplified
            </span>
          }
        </div>

        <button
          type="button"
          (click)="isExpanded.set(!isExpanded())"
          [attr.aria-expanded]="isExpanded()"
          class="rounded-lg border border-(--border-color) bg-(--button-bg) px-2.5 py-1 text-xs text-(--text-color-muted) hover:text-(--text-color) transition-all cursor-pointer"
        >
          {{ isExpanded() ? 'Hide Details' : 'Inspect Tone (4 Metrics)' }}
        </button>
      </div>

      <!-- Expanded 4-Slot Calm View (Only shown when requested) -->
      @if (isExpanded()) {
        <div class="mt-4 border-t border-(--border-color) pt-4 space-y-4">
          <!-- 4 Simple Plain-English Meters (4-Slot Working Memory Ceiling) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            @for (metric of calibrator.fourSlotMetrics(); track metric.id) {
              <div class="rounded-xl border border-(--border-color) bg-(--card-bg-subtle) p-3">
                <div class="flex items-center justify-between text-xs font-bold text-(--text-color)">
                  <span>{{ metric.label }}</span>
                  <span class="text-emerald-400 font-mono">{{ (metric.score * 100).toFixed(0) }}%</span>
                </div>
                <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-(--border-color)">
                  <div
                    class="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    [style.width.%]="metric.score * 100"
                  ></div>
                </div>
                <p class="mt-1.5 text-[11px] text-(--text-color-muted) leading-snug">
                  {{ metric.description }}
                </p>
              </div>
            }
          </div>

          <!-- Audited Excerpt Preview -->
          <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-(--border-color) bg-(--card-bg-subtle) px-3.5 py-2.5 text-xs">
            <p class="italic text-(--text-color-muted) truncate max-w-2xl">
              Latest checked: "{{ calibrator.currentTurn().excerpt }}"
            </p>
            <button
              type="button"
              (click)="showUnderTheHood.set(!showUnderTheHood())"
              class="text-[11px] font-mono text-(--text-accent) hover:underline cursor-pointer shrink-0"
            >
              {{ showUnderTheHood() ? 'Hide J++ Telemetry' : 'Under the Hood (J++ Lens)' }}
            </button>
          </div>

          <!-- Optional Deep Telemetry Drawer (Hidden unless explicitly toggled) -->
          @if (showUnderTheHood()) {
            <div class="rounded-xl border border-(--border-color) bg-(--card-bg-subtle) p-4 space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-[11px] font-mono uppercase tracking-wider text-(--text-color-muted)">
                  J++ Residual Stream Readout (L6 → L32) · Steering (-{{ calibrator.steeringAlpha().toFixed(2) }}·slop + {{ calibrator.steeringBeta().toFixed(2) }}·craft)
                </span>
                <div class="flex flex-wrap items-center gap-1.5">
                  @for (turn of recentTurns(); track turn.turnIndex) {
                    <button
                      type="button"
                      (click)="calibrator.selectedTurnIndex.set(turn.turnIndex - 1)"
                      class="rounded border px-2 py-0.5 text-[11px] font-mono cursor-pointer"
                      [class.border-emerald-500]="calibrator.currentTurn().turnIndex === turn.turnIndex"
                      [class.border-(--border-color)]="calibrator.currentTurn().turnIndex !== turn.turnIndex"
                    >
                      {{ turn.label }}
                    </button>
                  }
                </div>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div class="rounded-lg border border-(--border-color) p-2">
                  <div class="text-[10px] text-(--text-color-muted)">L6 · Core Concepts</div>
                  <div class="mt-1 font-semibold text-(--text-color)">{{ calibrator.currentTurn().jppLayers.l6.join(', ') }}</div>
                </div>
                <div class="rounded-lg border border-(--border-color) p-2">
                  <div class="text-[10px] text-(--text-color-muted)">L16 · Strategy Frame</div>
                  <div class="mt-1 font-semibold text-(--text-color)">{{ calibrator.currentTurn().jppLayers.l16.join(', ') }}</div>
                </div>
                <div class="rounded-lg border border-(--border-color) p-2">
                  <div class="text-[10px] text-(--text-color-muted)">L24 · Tone Check</div>
                  <div class="mt-1 font-semibold text-(--text-color)">{{ calibrator.currentTurn().jppLayers.l24.join(', ') }}</div>
                </div>
                <div class="rounded-lg border border-(--border-color) p-2">
                  <div class="text-[10px] text-(--text-color-muted)">L32 · Output Status</div>
                  <div class="mt-1 font-semibold text-(--text-accent)">{{ calibrator.currentTurn().jppLayers.l32.join(', ') }}</div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class BrandDriftCalibratorComponent {
  readonly calibrator = inject(BrandDriftCalibratorService);
  readonly isExpanded = signal<boolean>(false);
  readonly showUnderTheHood = signal<boolean>(false);

  readonly recentTurns = computed(() => {
    return this.calibrator.turns().slice(-4);
  });
}

