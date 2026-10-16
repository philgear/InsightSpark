import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrandDriftCalibratorService } from '../../services/brand-drift-calibrator.service';

@Component({
  selector: 'app-brand-drift-calibrator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="mt-6 rounded-2xl border border-(--border-color) bg-(--card-bg) p-5 shadow-xl transition-all"
      aria-label="Brand and Strategy Behavioral Drift Calibrator"
    >
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-(--border-color) pb-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
            <span class="text-[11px] font-mono uppercase tracking-widest text-(--text-accent)">
              J++ Workspace Lens × MIT Drift Calibrator · Local 3.2B Telemetry
            </span>
          </div>
          <h3 class="mt-1 font-serif text-lg font-bold text-(--text-color)">
            6-Axis Brand &amp; Strategy Drift Calibrator
          </h3>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            (click)="calibrator.activeModel.set('pivotpulse:latest')"
            class="rounded-lg border px-2.5 py-1 text-xs font-mono transition-all cursor-pointer"
            [class.border-emerald-500]="calibrator.activeModel() === 'pivotpulse:latest'"
            [class.bg-emerald-500/15]="calibrator.activeModel() === 'pivotpulse:latest'"
            [class.border-(--border-color)]="calibrator.activeModel() !== 'pivotpulse:latest'"
          >
            pivotpulse:latest (3.2B)
          </button>
          <button
            type="button"
            (click)="calibrator.activeModel.set('branddesk:latest')"
            class="rounded-lg border px-2.5 py-1 text-xs font-mono transition-all cursor-pointer"
            [class.border-amber-500]="calibrator.activeModel() === 'branddesk:latest'"
            [class.bg-amber-500/15]="calibrator.activeModel() === 'branddesk:latest'"
            [class.border-(--border-color)]="calibrator.activeModel() !== 'branddesk:latest'"
          >
            branddesk:latest (3.2B)
          </button>
          <button
            type="button"
            (click)="calibrator.applyBrandSteeringVector()"
            class="rounded-lg bg-(--text-accent) px-3 py-1.5 text-xs font-mono font-bold text-white shadow-sm hover:opacity-90 transition-all cursor-pointer"
          >
            ⚡ Apply Steering (-0.70·v_slop + 0.55·v_craft)
          </button>
        </div>
      </div>

      <!-- Turn Selector Pills -->
      <div class="mt-4 flex flex-wrap items-center gap-2">
        @for (turn of calibrator.turns(); track turn.turnIndex; let idx = $index) {
          <button
            type="button"
            (click)="calibrator.selectedTurnIndex.set(idx)"
            class="rounded-lg border px-3 py-1.5 text-xs font-mono transition-all cursor-pointer"
            [class.border-rose-500]="turn.isDrifting"
            [class.text-rose-400]="turn.isDrifting"
            [class.border-emerald-500]="!turn.isDrifting && calibrator.selectedTurnIndex() === idx"
            [class.bg-(--card-bg-subtle)]="calibrator.selectedTurnIndex() === idx"
            [class.border-(--border-color)]="!turn.isDrifting && calibrator.selectedTurnIndex() !== idx"
          >
            {{ turn.label }}
            @if (turn.isDrifting) {
              <span class="ml-1 text-[10px] font-bold uppercase text-rose-400">[SLOP DRIFT]</span>
            }
          </button>
        }
      </div>

      <!-- Main 2-Column Grid: 12-Pole Sunburst + J++ Layer Readout -->
      <div class="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12 items-center">
        <!-- Left: 12-Pole Radial Sunburst SVG -->
        <div class="lg:col-span-5 flex flex-col items-center">
          <svg viewBox="0 0 280 280" class="w-60 h-60 overflow-visible" role="img" aria-label="12-Pole Brand and Strategy Sunburst">
            <circle cx="140" cy="140" r="105" fill="none" stroke="currentColor" stroke-opacity="0.12" stroke-dasharray="3 3" />
            <circle cx="140" cy="140" r="65" fill="none" stroke="currentColor" stroke-opacity="0.15" stroke-dasharray="2 2" />
            <circle cx="140" cy="140" r="24" fill="none" stroke="currentColor" stroke-opacity="0.2" />

            @for (wedge of sunburstWedges(); track wedge.index) {
              <g>
                <path
                  [attr.d]="wedge.path"
                  [attr.fill]="wedge.isPositive ? '#10b981' : '#f43f5e'"
                  [attr.fill-opacity]="wedge.isPositive ? 0.68 : (wedge.score >= 0.55 ? 0.85 : 0.38)"
                  [attr.stroke]="wedge.isPositive ? '#059669' : '#e11d48'"
                  stroke-width="1.2"
                />
                <text
                  [attr.x]="wedge.labelX"
                  [attr.y]="wedge.labelY"
                  text-anchor="middle"
                  dominant-baseline="middle"
                  class="text-[8px] font-mono fill-current opacity-85"
                >
                  {{ wedge.shortLabel }}
                </text>
              </g>
            }

            <circle cx="140" cy="140" r="22" class="fill-(--card-bg)" stroke="currentColor" stroke-opacity="0.25" />
            <text x="140" y="137" text-anchor="middle" class="text-[9px] font-mono font-bold fill-current">
              {{ calibrator.currentTurn().isDrifting ? 'DRIFT' : 'LOCKED' }}
            </text>
            <text x="140" y="149" text-anchor="middle" class="text-[8px] font-mono fill-current opacity-75">
              {{ (calibrator.currentTurn().maxHazardScore * 100).toFixed(0) }}% haz
            </text>
          </svg>

          <div class="mt-2 flex items-center gap-4 text-[11px] font-mono text-(--text-color-muted)">
            <span class="flex items-center gap-1.5">
              <span class="h-2.5 w-2.5 rounded-xs bg-emerald-500 inline-block"></span>
              House Craft Poles (1–6)
            </span>
            <span class="flex items-center gap-1.5">
              <span class="h-2.5 w-2.5 rounded-xs bg-rose-500 inline-block"></span>
              Slop / Hype Hazards (7–12)
            </span>
          </div>
        </div>

        <!-- Right: Turn Diagnostics & J++ Early-Layer Readout -->
        <div class="lg:col-span-7 space-y-4">
          <div class="rounded-xl border border-(--border-color) bg-(--card-bg-subtle) p-4">
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span class="font-bold text-(--text-accent)">
                Model: {{ calibrator.currentTurn().sourceModel }}
              </span>
              <span
                class="rounded-full px-2.5 py-0.5 font-bold"
                [class.bg-rose-500/20]="calibrator.currentTurn().isDrifting"
                [class.text-rose-400]="calibrator.currentTurn().isDrifting"
                [class.bg-emerald-500/20]="!calibrator.currentTurn().isDrifting"
                [class.text-emerald-400]="!calibrator.currentTurn().isDrifting"
              >
                {{ calibrator.currentTurn().isDrifting ? '⚠️ Hazard: ' + calibrator.currentTurn().dominantHazardPole : '✓ Dominant: ' + calibrator.currentTurn().dominantPositivePole }}
              </span>
            </div>
            <p class="mt-2 text-xs italic text-(--text-color) leading-relaxed">
              "{{ calibrator.currentTurn().excerpt }}"
            </p>
          </div>

          <!-- J++ Workspace Layer Readout -->
          <div class="rounded-xl border border-(--border-color) bg-(--card-bg-subtle) p-4 space-y-2">
            <div class="text-[11px] font-mono font-bold uppercase tracking-wider text-(--text-color-muted)">
              J++ Workspace Residual Stream Readout (L6 → L32)
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div class="rounded-lg border border-(--border-color) p-2">
                <div class="text-[10px] text-(--text-color-muted)">L6 · Early Concept</div>
                <div class="mt-1 font-semibold text-(--text-color)">{{ calibrator.currentTurn().jppLayers.l6.join(', ') }}</div>
              </div>
              <div class="rounded-lg border border-(--border-color) p-2">
                <div class="text-[10px] text-(--text-color-muted)">L16 · Strategy Frame</div>
                <div class="mt-1 font-semibold text-(--text-color)">{{ calibrator.currentTurn().jppLayers.l16.join(', ') }}</div>
              </div>
              <div class="rounded-lg border border-(--border-color) p-2">
                <div class="text-[10px] text-(--text-color-muted)">L24 · Editorial Tone</div>
                <div class="mt-1 font-semibold text-(--text-color)">{{ calibrator.currentTurn().jppLayers.l24.join(', ') }}</div>
              </div>
              <div class="rounded-lg border border-(--border-color) p-2">
                <div class="text-[10px] text-(--text-color-muted)">L32 · Unembedding</div>
                <div class="mt-1 font-semibold text-(--text-accent)">{{ calibrator.currentTurn().jppLayers.l32.join(', ') }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class BrandDriftCalibratorComponent {
  readonly calibrator = inject(BrandDriftCalibratorService);

  readonly poleLabels = [
    'Craft',
    'Falsifiable',
    'Caslon',
    'Synthesis',
    'Agency',
    '4-Slot',
    'AI Slop',
    'Hype',
    'Filler',
    'Orthodoxy',
    'Paternalism',
    'Overload',
  ];

  readonly sunburstWedges = computed(() => {
    const turn = this.calibrator.currentTurn();
    const cx = 140;
    const cy = 140;
    const innerR = 24;
    const maxOuterR = 104;
    const stepDeg = 360 / 12;

    return turn.poleScores.map((score, i) => {
      const startDeg = i * stepDeg - 90;
      const endDeg = (i + 1) * stepDeg - 90 - 2;
      const midDeg = (startDeg + endDeg) / 2;
      const outerR = innerR + Math.max(0.08, score) * (maxOuterR - innerR);

      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const x1 = cx + innerR * Math.cos(toRad(startDeg));
      const y1 = cy + innerR * Math.sin(toRad(startDeg));
      const x2 = cx + outerR * Math.cos(toRad(startDeg));
      const y2 = cy + outerR * Math.sin(toRad(startDeg));
      const x3 = cx + outerR * Math.cos(toRad(endDeg));
      const y3 = cy + outerR * Math.sin(toRad(endDeg));
      const x4 = cx + innerR * Math.cos(toRad(endDeg));
      const y4 = cy + innerR * Math.sin(toRad(endDeg));

      const path = `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)} A ${outerR.toFixed(1)} ${outerR.toFixed(1)} 0 0 1 ${x3.toFixed(1)} ${y3.toFixed(1)} L ${x4.toFixed(1)} ${y4.toFixed(1)} A ${innerR} ${innerR} 0 0 0 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`;

      const labelR = 118;
      const labelX = cx + labelR * Math.cos(toRad(midDeg));
      const labelY = cy + labelR * Math.sin(toRad(midDeg));

      return {
        index: i,
        score,
        isPositive: i < 6,
        path,
        labelX: labelX.toFixed(1),
        labelY: labelY.toFixed(1),
        shortLabel: this.poleLabels[i],
      };
    });
  });
}
