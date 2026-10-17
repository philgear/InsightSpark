import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrandDriftCalibratorService } from '../../services/brand-drift-calibrator.service';

@Component({
  selector: 'app-brand-drift-calibrator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="rounded-2xl border border-(--border-color) bg-(--card-bg) p-5 shadow-xl transition-all"
      aria-label="6-Axis Brand and Strategy Drift Calibrator"
    >
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-color) pb-3">
        <div>
          <div class="flex items-center gap-2">
            <span
              class="inline-block h-2.5 w-2.5 rounded-full"
              [class.bg-emerald-400]="!calibrator.currentTurn().isDrifting"
              [class.bg-rose-500]="calibrator.currentTurn().isDrifting"
            ></span>
            <span class="text-[11px] font-mono uppercase tracking-widest text-(--text-accent)">
              J++ Workspace Lens × MIT Drift Calibrator · Local 3.2B Telemetry
            </span>
          </div>
          <h3 class="mt-1 font-serif text-lg font-bold text-(--text-color)">
            6-Axis Brand &amp; Strategy Drift Calibrator
          </h3>
        </div>

        <div class="flex items-center gap-1.5">
          @if (calibrator.selectionLockMode() === 'manual') {
            <button
              type="button"
              (click)="calibrator.unlockWheel()"
              class="rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-xs font-mono font-bold text-amber-400 hover:bg-amber-500/25 transition-all cursor-pointer"
              title="Unlock the 6-Axis Wheel to override your manual provocation picks"
            >
              🔒 Manual Picks (Unlock Wheel)
            </button>
          } @else {
            <button
              type="button"
              (click)="calibrator.applyBrandSteeringVector()"
              class="rounded-lg bg-(--text-accent) px-2.5 py-1 text-xs font-mono font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer"
            >
              ⚡ Apply Steering
            </button>
          }
          <button
            type="button"
            (click)="isExpanded.set(!isExpanded())"
            [attr.aria-expanded]="isExpanded()"
            class="xl:hidden rounded-lg border border-(--border-color) bg-(--button-bg) px-2.5 py-1 text-xs font-semibold text-(--text-color-muted) hover:text-(--text-color) transition-all cursor-pointer"
          >
            {{ isExpanded() ? 'Hide' : 'Show' }}
          </button>
        </div>
      </div>

      <!-- Interactive Body -->
      @if (isExpanded()) {
        <div class="mt-4 space-y-4">
          <!-- Mode Toggle: 12-Pole Sunburst Wheel vs. 4-Petal Fibonacci Sunflower -->
          <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                (click)="lensMode.set('sunburst')"
                class="rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer"
                [class.border-emerald-500]="lensMode() === 'sunburst'"
                [class.bg-emerald-500/15]="lensMode() === 'sunburst'"
                [class.border-(--border-color)]="lensMode() !== 'sunburst'"
              >
                🎯 12-Pole Axis Wheel
              </button>
              <button
                type="button"
                (click)="lensMode.set('sunflower')"
                class="rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer"
                [class.border-amber-500]="lensMode() === 'sunflower'"
                [class.bg-amber-500/15]="lensMode() === 'sunflower'"
                [class.border-(--border-color)]="lensMode() !== 'sunflower'"
              >
                🌻 4-Petal Sunflower
              </button>
            </div>

            <div class="flex flex-wrap items-center gap-1">
              @for (turn of recentTurns(); track turn.turnIndex) {
                <button
                  type="button"
                  (click)="calibrator.selectedTurnIndex.set(turn.turnIndex - 1)"
                  class="rounded-lg border px-2 py-0.5 text-[10px] font-mono transition-all cursor-pointer"
                  [class.border-rose-500]="turn.isDrifting"
                  [class.text-rose-400]="turn.isDrifting"
                  [class.border-emerald-500]="!turn.isDrifting && calibrator.currentTurn().turnIndex === turn.turnIndex"
                  [class.border-(--border-color)]="!turn.isDrifting && calibrator.currentTurn().turnIndex !== turn.turnIndex"
                >
                  T{{ turn.turnIndex }}
                </button>
              }
            </div>
          </div>

          @if (lensMode() === 'sunburst') {
            <!-- Compact 12-Pole Connected Sunburst + Connected Axis Control Panel -->
            <div class="space-y-3">
              @if (calibrator.selectionLockMode() === 'manual') {
                <div class="flex items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300">
                  <span>🔒 <strong>Wheel Locked to Manual Provocations:</strong> Reflecting your custom picks on the left.</span>
                  <button
                    type="button"
                    (click)="calibrator.unlockWheel()"
                    class="shrink-0 rounded-md bg-amber-500/20 px-2 py-0.5 font-mono font-bold text-amber-200 hover:bg-amber-500/30 cursor-pointer"
                  >
                    Switch to Wheel
                  </button>
                </div>
              }

              <!-- Compact Interactive 12-Pole Sunburst SVG -->
              <div class="flex flex-col items-center">
                <svg viewBox="0 0 280 280" class="w-44 h-44 overflow-visible select-none" [class.opacity-80]="calibrator.selectionLockMode() === 'manual'" role="img" aria-label="Interactive 12-Pole Brand and Strategy Sunburst">
                  <circle cx="140" cy="140" r="105" fill="none" stroke="currentColor" stroke-opacity="0.12" stroke-dasharray="3 3" />
                  <circle cx="140" cy="140" r="65" fill="none" stroke="currentColor" stroke-opacity="0.15" stroke-dasharray="2 2" />

                  <!-- Opposite-Axis Connection Line (Shows how Green Pole i connects 180° across to Red Hazard i+6) -->
                  <line
                    [attr.x1]="axisConnectionLine().x1"
                    [attr.y1]="axisConnectionLine().y1"
                    [attr.x2]="axisConnectionLine().x2"
                    [attr.y2]="axisConnectionLine().y2"
                    stroke="#fbbf24"
                    stroke-width="2"
                    stroke-dasharray="4 3"
                  />

                  @for (wedge of sunburstWedges(); track wedge.index) {
                    <g
                      (click)="calibrator.manipulateWedge(wedge.index)"
                      [class.cursor-pointer]="calibrator.selectionLockMode() !== 'manual'"
                      [class.cursor-not-allowed]="calibrator.selectionLockMode() === 'manual'"
                      class="transition-opacity hover:opacity-95"
                    >
                      <path
                        [attr.d]="wedge.path"
                        [attr.fill]="wedge.isPositive ? '#10b981' : '#f43f5e'"
                        [attr.fill-opacity]="wedge.isConnectedAxis ? 0.90 : (wedge.isPositive ? 0.62 : (wedge.score >= 0.55 ? 0.82 : 0.32))"
                        [attr.stroke]="wedge.isConnectedAxis ? '#fbbf24' : (wedge.isPositive ? '#059669' : '#e11d48')"
                        [attr.stroke-width]="wedge.isConnectedAxis ? 2.4 : 1.1"
                      />
                      <text
                        [attr.x]="wedge.labelX"
                        [attr.y]="wedge.labelY"
                        text-anchor="middle"
                        dominant-baseline="middle"
                        class="text-[9px] font-mono fill-current"
                        [class.font-bold]="wedge.isConnectedAxis"
                      >
                        {{ wedge.shortLabel }}
                      </text>
                    </g>
                  }

                  <circle cx="140" cy="140" r="23" class="fill-(--card-bg)" stroke="currentColor" stroke-opacity="0.25" />
                  <text x="140" y="137" text-anchor="middle" class="text-[9px] font-mono font-bold fill-current">
                    {{ calibrator.selectionLockMode() === 'manual' ? 'MANUAL' : (calibrator.currentTurn().isDrifting ? 'DRIFT' : 'LOCKED') }}
                  </text>
                  <text x="140" y="149" text-anchor="middle" class="text-[8px] font-mono fill-current opacity-75">
                    {{ (calibrator.currentTurn().maxHazardScore * 100).toFixed(0) }}% haz
                  </text>
                </svg>

                <div class="mt-1 flex flex-wrap items-center justify-center gap-3 text-[10px] font-mono text-(--text-color-muted)">
                  <span class="flex items-center gap-1">
                    <span class="h-2 w-2 rounded-xs bg-emerald-500 inline-block"></span>
                    Click Green (1–6) to Boost &amp; Sync Provocations
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="h-2 w-2 rounded-xs bg-rose-500 inline-block"></span>
                    Click Red (7–12) to Ban
                  </span>
                </div>
              </div>

              <!-- Connected Opposite-Axis Explainer & Live Steering -->
              <div class="space-y-2">
                <!-- 6 Connected Axis Pills -->
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  @for (axis of calibrator.axes; track axis.id; let idx = $index) {
                    <button
                      type="button"
                      [disabled]="calibrator.selectionLockMode() === 'manual'"
                      (click)="calibrator.manipulateWedge(idx)"
                      class="rounded-lg border px-2 py-1 text-left text-[11px] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      [class.border-amber-400]="calibrator.focusedAxisIndex() === idx"
                      [class.bg-amber-500/10]="calibrator.focusedAxisIndex() === idx"
                      [class.border-(--border-color)]="calibrator.focusedAxisIndex() !== idx"
                      [class.bg-(--card-bg-subtle)]="calibrator.focusedAxisIndex() !== idx"
                    >
                      <div class="font-bold text-emerald-400 leading-tight">✓ {{ idx + 1 }}. {{ poleLabels[idx] }}</div>
                      <div class="text-[9.5px] font-mono text-rose-400 leading-tight">↔ ✕ {{ idx + 7 }}. {{ poleLabels[idx + 6] }}</div>
                    </button>
                  }
                </div>

                <!-- Connected Pair Card -->
                <div class="rounded-xl border border-(--border-color) bg-(--card-bg-subtle) p-3 space-y-1.5 text-xs">
                  <div class="font-bold text-(--text-color)">
                    Axis {{ calibrator.focusedAxisPair().axisIndex + 1 }}:
                    <span class="text-emerald-400">{{ calibrator.focusedAxisPair().axis.positivePole }} ({{ (calibrator.focusedAxisPair().posScore * 100).toFixed(0) }}%)</span>
                    ↔
                    <span class="text-rose-400">{{ calibrator.focusedAxisPair().axis.negativePole }} ({{ (calibrator.focusedAxisPair().negScore * 100).toFixed(0) }}%)</span>
                  </div>

                  <div class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2 text-[11px]">
                    <span class="font-bold text-emerald-400">Boosted (+{{ calibrator.steeringBeta().toFixed(2) }}): </span>
                    <span class="text-(--text-color)">{{ calibrator.focusedAxisPair().axis.positiveAnchor }}</span>
                  </div>

                  <div class="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[10.5px] text-(--text-color-muted)">
                    <span>🛡️ {{ calibrator.focusedAxisPair().connectedFallacy }}</span>
                    <button
                      type="button"
                      (click)="showUnderTheHood.set(!showUnderTheHood())"
                      class="font-mono text-(--text-accent) hover:underline cursor-pointer"
                    >
                      {{ showUnderTheHood() ? 'Hide J++' : 'J++ (L6→L32)' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          } @else {
            <!-- Compact 4-Petal Fibonacci Sunflower View -->
            <div class="space-y-3">
              <div class="flex flex-col items-center">
                <svg
                  viewBox="0 0 280 280"
                  class="w-44 h-44 overflow-visible select-none"
                  role="img"
                  aria-label="Interactive 4-Petal Fibonacci Sunflower"
                >
                  @for (petal of petalGeometry(); track petal.id) {
                    <g
                      (click)="calibrator.activePetalId.set(petal.id)"
                      class="cursor-pointer transition-opacity hover:opacity-95"
                    >
                      <path
                        [attr.d]="petal.path"
                        [attr.fill]="petal.isSelected ? palette().petalActiveFill : palette().petalFill"
                        [attr.stroke]="petal.isSelected ? palette().petalActiveStroke : palette().petalStroke"
                        [attr.stroke-width]="petal.isSelected ? 2.4 : 1.2"
                      />
                      <text
                        [attr.x]="petal.labelX"
                        [attr.y]="petal.labelY - 5"
                        text-anchor="middle"
                        dominant-baseline="middle"
                        class="text-[9px] font-bold fill-current"
                      >
                        {{ petal.petalNumber }}. {{ petal.shortTitle }}
                      </text>
                      <text
                        [attr.x]="petal.labelX"
                        [attr.y]="petal.labelY + 7"
                        text-anchor="middle"
                        dominant-baseline="middle"
                        class="text-[8px] font-mono fill-current opacity-80"
                      >
                        {{ (petal.score * 100).toFixed(0) }}% clear
                      </text>
                    </g>
                  }

                  <g (click)="toggleBreathPacer()" class="cursor-pointer">
                    <circle
                      cx="140"
                      cy="140"
                      [attr.r]="isBreathing() ? (breathPhase() === 'inhale' ? 56 : 46) : 50"
                      [attr.fill]="palette().discFill"
                      [attr.stroke]="palette().petalActiveStroke"
                      stroke-width="1.5"
                      style="transition: r 4.8s ease-in-out;"
                    />
                    @for (seed of fibonacciSeeds(); track seed.index) {
                      <circle
                        [attr.cx]="seed.x"
                        [attr.cy]="seed.y"
                        [attr.r]="seed.r"
                        [attr.fill]="palette().seedFill"
                        [attr.fill-opacity]="seed.opacity"
                      />
                    }
                    <circle cx="140" cy="140" r="19" class="fill-(--card-bg)" [attr.stroke]="palette().petalActiveStroke" stroke-width="1.2" />
                    <text x="140" y="137" text-anchor="middle" class="text-[8px] font-bold fill-current">
                      {{ isBreathing() ? (breathPhase() === 'inhale' ? 'INHALE' : 'EXHALE') : 'BREATHE' }}
                    </text>
                    <text x="140" y="147" text-anchor="middle" class="text-[7px] font-mono fill-current opacity-75">
                      {{ isBreathing() ? '5s pace' : '137.5° ϕ' }}
                    </text>
                  </g>
                </svg>
              </div>

              <div class="space-y-2.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-(--text-accent)">
                    Shielding Against: {{ calibrator.selectedPetal().fallacyName }}
                  </span>
                  <button
                    type="button"
                    (click)="calibrator.cycleCircadianScene()"
                    class="rounded-lg border border-(--border-color) bg-(--card-bg-subtle) px-2.5 py-1 text-[11px] font-mono text-(--text-color) cursor-pointer"
                  >
                    ☀️ {{ circadianLabel() }}
                  </button>
                </div>
                <div class="rounded-lg border border-(--border-color) bg-(--card-bg-subtle) p-3 text-xs space-y-2">
                  <div><span class="font-bold text-rose-400">Common Trap: </span><span class="italic">{{ calibrator.selectedPetal().trap }}</span></div>
                  <div><span class="font-bold text-emerald-400">Calm Reframe: </span><span>{{ calibrator.selectedPetal().antidote }}</span></div>
                </div>
              </div>
            </div>
          }

          @if (showUnderTheHood()) {
            <div class="rounded-xl border border-(--border-color) bg-(--card-bg-subtle) p-3 grid grid-cols-2 gap-2 text-xs font-mono">
              <div class="rounded border border-(--border-color) p-2">
                <div class="text-[10px] text-(--text-color-muted)">L6 · Core Concepts</div>
                <div class="mt-1 font-semibold">{{ calibrator.currentTurn().jppLayers.l6.join(', ') }}</div>
              </div>
              <div class="rounded border border-(--border-color) p-2">
                <div class="text-[10px] text-(--text-color-muted)">L16 · Strategy Frame</div>
                <div class="mt-1 font-semibold">{{ calibrator.currentTurn().jppLayers.l16.join(', ') }}</div>
              </div>
              <div class="rounded border border-(--border-color) p-2">
                <div class="text-[10px] text-(--text-color-muted)">L24 · Tone Check</div>
                <div class="mt-1 font-semibold">{{ calibrator.currentTurn().jppLayers.l24.join(', ') }}</div>
              </div>
              <div class="rounded border border-(--border-color) p-2">
                <div class="text-[10px] text-(--text-color-muted)">L32 · Output Status</div>
                <div class="mt-1 font-semibold text-(--text-accent)">{{ calibrator.currentTurn().jppLayers.l32.join(', ') }}</div>
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class BrandDriftCalibratorComponent implements OnDestroy {
  readonly calibrator = inject(BrandDriftCalibratorService);
  readonly isExpanded = signal<boolean>(true);
  readonly lensMode = signal<'sunburst' | 'sunflower'>('sunburst');
  readonly showUnderTheHood = signal<boolean>(false);
  readonly isBreathing = signal<boolean>(false);
  readonly breathPhase = signal<'inhale' | 'exhale'>('inhale');
  private breathTimer: ReturnType<typeof setInterval> | null = null;

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

  readonly recentTurns = computed(() => {
    return this.calibrator.turns().slice(-4);
  });

  readonly sunburstWedges = computed(() => {
    const turn = this.calibrator.currentTurn();
    const focusedAxis = this.calibrator.focusedAxisIndex() % 6;
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
        isConnectedAxis: i % 6 === focusedAxis,
        midDeg,
        path,
        labelX: labelX.toFixed(1),
        labelY: labelY.toFixed(1),
        shortLabel: this.poleLabels[i],
      };
    });
  });

  /**
   * Draws a diameter line connecting the selected Green Craft Wedge (i) directly across (180°) to its opposite Red Hazard Wedge (i+6).
   */
  readonly axisConnectionLine = computed(() => {
    const focusedAxis = this.calibrator.focusedAxisIndex() % 6;
    const stepDeg = 360 / 12;
    const posMidDeg = focusedAxis * stepDeg - 90 + (stepDeg - 2) / 2;
    const negMidDeg = (focusedAxis + 6) * stepDeg - 90 + (stepDeg - 2) / 2;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const r = 104;
    return {
      x1: (140 + r * Math.cos(toRad(posMidDeg))).toFixed(1),
      y1: (140 + r * Math.sin(toRad(posMidDeg))).toFixed(1),
      x2: (140 + r * Math.cos(toRad(negMidDeg))).toFixed(1),
      y2: (140 + r * Math.sin(toRad(negMidDeg))).toFixed(1),
    };
  });

  readonly circadianLabel = computed(() => {
    const scene = this.calibrator.circadianScene();
    if (scene === 'washi') return 'Morning Washi';
    if (scene === 'hemp') return 'Afternoon Hemp (2700K)';
    return 'Night Scotopic (670nm)';
  });

  readonly palette = computed(() => {
    const scene = this.calibrator.circadianScene();
    if (scene === 'scotopic') {
      return {
        petalFill: 'rgba(190, 18, 60, 0.22)',
        petalActiveFill: 'rgba(225, 29, 72, 0.42)',
        petalStroke: '#9f1239',
        petalActiveStroke: '#fb7185',
        discFill: 'rgba(136, 19, 55, 0.35)',
        seedFill: '#fda4af',
      };
    }
    if (scene === 'hemp') {
      return {
        petalFill: 'rgba(217, 119, 6, 0.20)',
        petalActiveFill: 'rgba(245, 158, 11, 0.38)',
        petalStroke: '#b45309',
        petalActiveStroke: '#fbbf24',
        discFill: 'rgba(120, 53, 15, 0.35)',
        seedFill: '#fcd34d',
      };
    }
    return {
      petalFill: 'rgba(234, 179, 8, 0.18)',
      petalActiveFill: 'rgba(16, 185, 129, 0.30)',
      petalStroke: '#ca8a04',
      petalActiveStroke: '#10b981',
      discFill: 'rgba(6, 95, 70, 0.25)',
      seedFill: '#fde047',
    };
  });

  readonly petalGeometry = computed(() => {
    const cx = 140;
    const cy = 140;
    const innerR = 54;
    const activeId = this.calibrator.activePetalId();

    return this.calibrator.fallacyPetals().map((p) => {
      const startDeg = p.angleDeg - 38;
      const endDeg = p.angleDeg + 38;
      const midDeg = p.angleDeg;
      const outerR = 118;
      const tipR = 132;

      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const x1 = cx + innerR * Math.cos(toRad(startDeg));
      const y1 = cy + innerR * Math.sin(toRad(startDeg));
      const cx1 = cx + outerR * Math.cos(toRad(startDeg + 12));
      const cy1 = cy + outerR * Math.sin(toRad(startDeg + 12));
      const tx = cx + tipR * Math.cos(toRad(midDeg));
      const ty = cy + tipR * Math.sin(toRad(midDeg));
      const cx2 = cx + outerR * Math.cos(toRad(endDeg - 12));
      const cy2 = cy + outerR * Math.sin(toRad(endDeg - 12));
      const x2 = cx + innerR * Math.cos(toRad(endDeg));
      const y2 = cy + innerR * Math.sin(toRad(endDeg));

      const path = `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx1.toFixed(1)} ${cy1.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)} Q ${cx2.toFixed(1)} ${cy2.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} A ${innerR} ${innerR} 0 0 0 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`;

      const labelR = 92;
      const labelX = cx + labelR * Math.cos(toRad(midDeg));
      const labelY = cy + labelR * Math.sin(toRad(midDeg));

      return {
        ...p,
        isSelected: p.id === activeId,
        path,
        labelX,
        labelY,
      };
    });
  });

  readonly fibonacciSeeds = computed(() => {
    const cx = 140;
    const cy = 140;
    const goldenAngleRad = (137.50776 * Math.PI) / 180;
    const scale = this.isBreathing() && this.breathPhase() === 'inhale' ? 4.2 : 3.5;
    const seeds = [];

    for (let n = 6; n <= 55; n++) {
      const r = scale * Math.sqrt(n) + 14;
      const theta = n * goldenAngleRad;
      seeds.push({
        index: n,
        x: (cx + r * Math.cos(theta)).toFixed(1),
        y: (cy + r * Math.sin(theta)).toFixed(1),
        r: n % 5 === 0 ? 2.6 : 1.9,
        opacity: (0.45 + (n / 55) * 0.5).toFixed(2),
      });
    }
    return seeds;
  });

  toggleBreathPacer(): void {
    if (this.isBreathing()) {
      this.stopBreathPacer();
    } else {
      this.isBreathing.set(true);
      this.breathPhase.set('inhale');
      this.breathTimer = setInterval(() => {
        this.breathPhase.update(p => (p === 'inhale' ? 'exhale' : 'inhale'));
      }, 5000);
    }
  }

  private stopBreathPacer(): void {
    this.isBreathing.set(false);
    if (this.breathTimer) {
      clearInterval(this.breathTimer);
      this.breathTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.stopBreathPacer();
  }
}



