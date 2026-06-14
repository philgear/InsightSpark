import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('lit-klee-grid')
export class LitKleeGrid extends LitElement {
  @state() private cols = 2;

  static override styles = css`
    :host {
      display: block;
      width: 100%;
    }
    .grid {
      display: grid;
      gap: 0.75rem; /* Matches Tailwind gap-3 */
      transition: all 0.7s ease-in-out;
    }
  `;

  constructor() {
    super();
    this.onResize = this.onResize.bind(this);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.calculateCols(window.innerWidth);
    window.addEventListener('resize', this.onResize);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.onResize);
  }

  private onResize() {
    this.calculateCols(window.innerWidth);
  }

  private calculateCols(width: number) {
    // Klee's shifting composition logic:
    // Scale columns based on available width, mimicking patchwork density.
    // 160px per patch is the base unit.
    const newCols = Math.max(2, Math.floor(width / 160));
    // Cap at 5 for this specific UI to prevent too many small items
    this.cols = Math.min(newCols, 5);
  }

  override render() {
    return html`
      <div class="grid" style="grid-template-columns: repeat(${this.cols}, minmax(0, 1fr))">
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lit-klee-grid': LitKleeGrid;
  }
}
