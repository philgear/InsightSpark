import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lojong-cleansing',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    /* ── Container ── */
    .river-wrap {
      position: relative;
      overflow: hidden;
      border-radius: 1.75rem;
      border: 1px solid var(--border-accent);
      background: var(--card-bg);
      padding: 2.5rem 2rem;
      min-height: 260px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2rem;
    }

    /* ── Ambient breathing background — much darker & bigger ── */
    .ambient-orb-1 {
      position: absolute;
      width: 280px; height: 280px;
      border-radius: 50%;
      background: var(--text-accent);
      filter: blur(80px);
      top: 50%; left: 15%;
      transform: translate(-50%, -50%);
      animation: breatheBg1 7s ease-in-out infinite alternate;
      opacity: 0;
      animation-fill-mode: forwards;
    }
    .ambient-orb-2 {
      position: absolute;
      width: 220px; height: 220px;
      border-radius: 50%;
      background: var(--text-highlight);
      filter: blur(70px);
      top: 40%; right: 0%;
      transform: translate(30%, -50%);
      animation: breatheBg2 9s ease-in-out infinite alternate;
      opacity: 0;
      animation-delay: 0.5s;
      animation-fill-mode: forwards;
    }
    /* fade in the orbs on load */
    @keyframes breatheBg1 {
      0%   { transform: translate(-50%, -50%) scale(0.85); opacity: 0.22; }
      100% { transform: translate(-50%, -50%) scale(1.35); opacity: 0.38; }
    }
    @keyframes breatheBg2 {
      0%   { transform: translate(30%, -50%) scale(1);    opacity: 0.18; }
      100% { transform: translate(30%, -50%) scale(1.45); opacity: 0.32; }
    }

    /* Top vignette to keep text readable */
    .vignette {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at center, transparent 40%, var(--card-bg) 100%);
      pointer-events: none;
    }

    /* ── Three stream columns ── */
    .streams {
      display: flex;
      gap: 1.5rem;
      align-items: center;
      width: 100%;
      position: relative;
      z-index: 1;
    }
    .stream-divider {
      width: 1px;
      height: 130px;
      background: linear-gradient(to bottom, transparent, var(--border-accent), transparent);
      flex-shrink: 0;
    }
    .stream {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      min-height: 150px;
    }

    /* Chrome (label) fades out after 4s */
    .stream-label {
      font-size: 0.55rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-family: var(--font-sans, sans-serif);
      color: var(--text-color-muted);
      opacity: 0.5;
      transition: opacity 1.5s ease;
    }
    .chrome-hidden .stream-label {
      opacity: 0;
    }

    /* ═══════════════════════════════════════════
       STREAM 1 — BREATH: expanding concentric rings
       ═══════════════════════════════════════════ */
    .breath-rings {
      position: relative;
      width: 80px; height: 80px;
    }
    .breath-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 1.5px solid var(--text-accent);
      animation: breatheRing 5s ease-in-out infinite;
      opacity: 0;
    }
    .breath-ring:nth-child(1) { animation-delay: 0s; }
    .breath-ring:nth-child(2) { animation-delay: 1.25s; }
    .breath-ring:nth-child(3) { animation-delay: 2.5s; }
    .breath-ring:nth-child(4) { animation-delay: 3.75s; }
    .breath-core {
      position: absolute;
      inset: 26px;
      border-radius: 50%;
      background: var(--text-accent);
      animation: breatheCore 5s ease-in-out infinite;
    }
    @keyframes breatheRing {
      0%   { transform: scale(0.25); opacity: 0.8; }
      100% { transform: scale(2.8);  opacity: 0; }
    }
    @keyframes breatheCore {
      0%, 100% { transform: scale(0.8);  opacity: 0.35; }
      50%       { transform: scale(1.2);  opacity: 0.8; }
    }

    /* ═══════════════════════════════════════════
       STREAM 2 — FLOW: sine-wave river particles
       ═══════════════════════════════════════════ */
    .flow-stage {
      position: relative;
      width: 84px; height: 80px;
      overflow: visible;
    }
    .flow-line {
      position: absolute;
      top: 50%; left: 0; right: 0;
      height: 1px;
      background: linear-gradient(to right, transparent, var(--text-highlight), transparent);
      opacity: 0.2;
    }
    .flow-particle {
      position: absolute;
      top: 50%; left: 0;
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--text-highlight);
      margin-top: -3px;
      animation: flowPath 4s ease-in-out infinite;
      opacity: 0;
    }
    .flow-particle:nth-child(2) { animation-delay: 0.8s; }
    .flow-particle:nth-child(3) { animation-delay: 1.6s; }
    .flow-particle:nth-child(4) { animation-delay: 2.4s; }
    .flow-particle:nth-child(5) { animation-delay: 3.2s; }
    @keyframes flowPath {
      0%   { transform: translate(-8px,   0px);  opacity: 0; }
      10%  { opacity: 0.85; }
      25%  { transform: translate(18px, -18px); }
      50%  { transform: translate(42px,  18px);  opacity: 0.65; }
      75%  { transform: translate(68px, -14px);  opacity: 0.4; }
      100% { transform: translate(92px,   4px);  opacity: 0; }
    }

    /* ═══════════════════════════════════════════
       STREAM 3 — WALK: pendulum
       ═══════════════════════════════════════════ */
    .walk-stage {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .pendulum-pivot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--text-color-muted);
      opacity: 0.4;
    }
    .pendulum-arm {
      width: 1.5px;
      height: 46px;
      background: linear-gradient(to bottom, var(--text-color-muted), var(--text-accent));
      transform-origin: top center;
      animation: pendulumSwing 2.6s cubic-bezier(0.45,0.05,0.55,0.95) infinite alternate;
      opacity: 0.65;
      position: relative;
    }
    .pendulum-bob {
      position: absolute;
      bottom: -7px; left: 50%;
      transform: translateX(-50%);
      width: 12px; height: 12px;
      border-radius: 50%;
      background: var(--text-accent);
      animation: bobGlow 2.6s ease-in-out infinite alternate;
    }
    .pendulum-shadow {
      width: 22px; height: 4px;
      border-radius: 50%;
      background: var(--text-accent);
      opacity: 0.15;
      margin-top: 8px;
      animation: shadowStretch 2.6s ease-in-out infinite alternate;
    }
    @keyframes pendulumSwing {
      from { transform: rotate(-30deg); }
      to   { transform: rotate( 30deg); }
    }
    @keyframes bobGlow {
      from { box-shadow: 0 0 4px 2px var(--text-accent); }
      to   { box-shadow: 0 0 12px 4px var(--text-accent); }
    }
    @keyframes shadowStretch {
      from { transform: scaleX(0.5) translateX(-28%); opacity: 0.08; }
      to   { transform: scaleX(1.3) translateX(16%);  opacity: 0.22; }
    }

    /* ── Breath dot footer — fades out with chrome ── */
    .breath-dots-wrap {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: opacity 1.5s ease;
    }
    .chrome-hidden .breath-dots-wrap {
      opacity: 0;
    }
    .breath-dot {
      width: 4px; height: 4px;
      border-radius: 50%;
      background: var(--text-accent);
      animation: breathDot 3s ease-in-out infinite;
    }
    .breath-dot:nth-child(2) { animation-delay: 1s; }
    .breath-dot:nth-child(3) { animation-delay: 2s; }
    .breath-label {
      font-size: 0.55rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--text-color-muted);
      opacity: 0.4;
      font-family: var(--font-sans, sans-serif);
    }
    @keyframes breathDot {
      0%, 100% { transform: scale(1);   opacity: 0.25; }
      50%       { transform: scale(2);   opacity: 0.9; }
    }
  `],
  template: `
    <div class="river-wrap" [class.chrome-hidden]="chromeHidden">
      <!-- Intensified ambient breathing orbs -->
      <div class="ambient-orb-1" aria-hidden="true"></div>
      <div class="ambient-orb-2" aria-hidden="true"></div>
      <div class="vignette" aria-hidden="true"></div>

      <!-- Three independent animation streams -->
      <div class="streams">

        <!-- Breath: expanding rings -->
        <div class="stream">
          <div class="breath-rings" aria-hidden="true">
            <div class="breath-ring"></div>
            <div class="breath-ring"></div>
            <div class="breath-ring"></div>
            <div class="breath-ring"></div>
            <div class="breath-core"></div>
          </div>
          <span class="stream-label">Breathe</span>
        </div>

        <div class="stream-divider" aria-hidden="true"></div>

        <!-- Flow: sine-wave particles -->
        <div class="stream">
          <div class="flow-stage" aria-hidden="true">
            <div class="flow-line"></div>
            <div class="flow-particle"></div>
            <div class="flow-particle"></div>
            <div class="flow-particle"></div>
            <div class="flow-particle"></div>
            <div class="flow-particle"></div>
          </div>
          <span class="stream-label">Flow</span>
        </div>

        <div class="stream-divider" aria-hidden="true"></div>

        <!-- Move: pendulum -->
        <div class="stream">
          <div class="walk-stage" aria-hidden="true">
            <div class="pendulum-pivot"></div>
            <div class="pendulum-arm">
              <div class="pendulum-bob"></div>
            </div>
            <div class="pendulum-shadow"></div>
          </div>
          <span class="stream-label">Move</span>
        </div>

      </div>

      <!-- Breath dots + label — fades with chrome -->
      <div class="breath-dots-wrap">
        <span class="breath-label">breathe</span>
        <div class="breath-dot"></div>
        <div class="breath-dot"></div>
        <div class="breath-dot"></div>
      </div>
    </div>
  `
})
export class LojongCleansingComponent implements OnInit, OnDestroy {
  chromeHidden = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    // After 5s, fade out labels/footer leaving only pure animations
    this.timer = setTimeout(() => {
      this.chromeHidden = true;
    }, 5000);
  }

  ngOnDestroy() {
    if (this.timer) clearTimeout(this.timer);
  }
}
