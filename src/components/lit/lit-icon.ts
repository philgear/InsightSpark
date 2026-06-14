import { LitElement, html, svg, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('lit-icon')
export class LitIcon extends LitElement {
  @property({ type: String }) name = '';
  @property({ type: Number }) size = 24;
  @property({ type: String }) customClass = ''; // avoid conflict with DOM element className / class property name

  // Allow custom styling from outside via CSS variables or standard styling
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
    }
    :host(.fill-current) svg, svg.fill-current {
      fill: currentColor !important;
    }
    svg {
      display: block;
    }
  `;

  // We map the class property to customClass in constructor or attribute changed callback
  // but to make it fully compatible with both [class] and [customClass], we can use attributeChangedCallback
  // or just property mapping. In Lit, to bind `class`, it's best to name the property `customClass`
  // and handle `class` attribute manually or just define a property named `class` with attribute: 'class'.
  // Let's use @property({ type: String, attribute: 'class' }) classProp = '';
  @property({ type: String, attribute: 'class' }) classProp = '';

  private getIconPath(name: string) {
    switch (name) {
      case 'sun':
        return svg`<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>`;
      case 'github':
        return svg`<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>`;
      case '500px':
        return svg`<circle cx="8" cy="12" r="4"></circle><circle cx="16" cy="12" r="4"></circle><path d="M12 9a4 4 0 0 1 0 6"></path>`;
      case 'moon':
        return svg`<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>`;
      case 'question':
        return svg`<circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path>`;
      case 'lock':
        return svg`<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>`;
      case 'refresh':
        return svg`<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 16h5v5"></path>`;
      case 'eye':
        return svg`<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle>`;
      case 'smile':
        return svg`<circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line>`;
      case 'globe':
        return svg`<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path>`;
      case 'leaf':
        return svg`<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>`;
      case 'zap':
        return svg`<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>`;
      case 'sword':
        return svg`<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline><line x1="13" y1="19" x2="19" y2="13"></line><line x1="16" y1="16" x2="20" y2="20"></line><line x1="19" y1="21" x2="21" y2="19"></line>`;
      case 'minus':
        return svg`<line x1="5" y1="12" x2="19" y2="12"></line>`;
      case 'dice':
        return svg`<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M16 8h.01"></path><path d="M8 8h.01"></path><path d="M8 16h.01"></path><path d="M16 16h.01"></path><path d="M12 12h.01"></path>`;
      case 'sparkles':
        return svg`<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>`;
      case 'chevron-right':
        return svg`<path d="m9 18 6-6-6-6"/>`;
      case 'chevron-up':
        return svg`<polyline points="18 15 12 9 6 15"></polyline>`;
      case 'chevron-down':
        return svg`<polyline points="6 9 12 15 18 9"></polyline>`;
      case 'copy':
        return svg`<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>`;
      case 'check':
        return svg`<polyline points="20 6 9 17 4 12"></polyline>`;
      case 'bookmark':
        return svg`<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>`;
      case 'trash':
        return svg`<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>`;
      case 'collection':
        return svg`<path d="M3 6h18"></path><path d="M7 12h10"></path><path d="M10 18h4"></path>`;
      case 'arrow-up':
        return svg`<line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline>`;
      case 'arrow-down':
        return svg`<line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline>`;
      case 'heart':
        return svg`<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>`;
      case 'percent':
        return svg`<line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle>`;
      case 'droplet':
        return svg`<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path>`;
      case 'activity':
        return svg`<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>`;
      case 'brain':
        return svg`<path d="M12 2a4.5 4.5 0 0 0-4.5 4.5c0 1.42 1.83 2.5 3 3s1.58 2.5 3 2.5c1.42 0 3-1.83 3-3s-1.5-2.08-3-2.5c-1.42 0-3 1.5-3 2.5"/><path d="M21 12c-2.43 1.5-2.43 3.5 0 5"/><path d="M3 12c2.43 1.5 2.43 3.5 0 5"/><path d="M12 22c-1.5 0-3-1.83-3-3s1.5-2.5 3-2.5 3 1.83 3 3-1.5 3-3 3Z"/><path d="M18 17c-1.5 0-3-1.83-3-3s1.5-2.5 3-2.5c1.42 0 3 1.83 3 3s-1.58 3-3 3Z"/><path d="M6 17c-1.5 0-3-1.83-3-3s1.5-2.5 3-2.5c1.42 0 3 1.83 3 3s-1.58 3-3 3Z"/><path d="M9 12c0 1.42-1.83 3-3 3s-3-1.5-3-3 1.58-2.5 3-2.5c1.42 0 3 .83 3 2.5Z"/><path d="M15 12c0 1.42 1.83 3 3 3s3-1.5 3-3-1.5-2.5-3-2.5c-1.42 0-3 .83-3 2.5Z"/>`;
      case 'heart-pulse':
        return svg`<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path><path d="M22 12h-3l-1.5 3-3-6-1.5 3H2"></path>`;
      case 'edit':
        return svg`<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>`;
      case 'x':
        return svg`<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>`;
      case 'printer':
        return svg`<polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2-2h-2"></path><rect x="6" y="14" width="12" height="8"></rect>`;
      case 'shield':
        return svg`<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>`;
      case 'user-check':
        return svg`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline>`;
      case 'clipboard-list':
        return svg`<rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path>`;
      case 'utensils-crossed':
        return svg`<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8Z"></path><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"></path><path d="m2.1 2.1 6 6"></path>`;
      case 'move':
        return svg`<polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="15 19 12 22 9 19"></polyline><polyline points="19 9 22 12 19 15"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line>`;
      case 'shield-check':
        return svg`<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path>`;
      case 'loader':
        return svg`<path d="M21 12a9 9 1 1 1-6.219-8.56"/>`;
      case 'help-circle':
        return svg`<circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line>`;
      case 'git-branch':
        return svg`<line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path>`;
      case 'list':
        return svg`<line x1="8" x2="21" y1="6" y2="6"></line><line x1="8" x2="21" y1="12" y2="12"></line><line x1="8" x2="21" y1="18" y2="18"></line><line x1="3" x2="3.01" y1="6" y2="6"></line><line x1="3" x2="3.01" y1="12" y2="12"></line><line x1="3" x2="3.01" y1="18" y2="18"></line>`;
      case 'search':
        return svg`<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>`;
      case 'volume-x':
        return svg`<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>`;
      case 'volume-2':
        return svg`<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>`;
      case 'book-open':
        return svg`<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>`;
      case 'video':
        return svg`<path d="m22 8-6 4 6 4V8Z"></path><rect width="14" height="12" x="2" y="6" rx="2" ry="2"></rect>`;
      case 'plus':
        return svg`<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>`;
      case 'maximize':
        return svg`<path d="M15 3h6v6"></path><path d="M9 21H3v-6"></path><path d="M21 3l-7 7"></path><path d="M3 21l7-7"></path>`;
      case 'briefcase':
        return svg`<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>`;
      case 'linkedin':
        return svg`<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle>`;
      case 'instagram':
        return svg`<rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>`;
      case 'mail':
        return svg`<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>`;
      case 'camera':
        return svg`<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle>`;
      case 'pen-tool':
        return svg`<path d="m12 19 7-7 3 3-7 7-3-3Z"></path><path d="m18 13-1.5-1.5L4 23l8-8 1.5 1.5Z"></path><circle cx="17" cy="7" r="3"></circle>`;
      case 'terminal':
        return svg`<polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line>`;
      case 'arrow-right':
        return svg`<line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>`;
      case 'external-link':
        return svg`<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>`;
      case 'cpu':
        return svg`<rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="15" x2="23" y2="15"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="15" x2="4" y2="15"></line>`;
      case 'layers':
        return svg`<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>`;
      default:
        return svg`<circle cx="12" cy="12" r="10"></circle>`;
    }
  }

  override render() {
    const combinedClass = `${this.classProp} ${this.customClass}`.trim();
    return html`
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width=${this.size} 
        height=${this.size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        aria-hidden="true"
        class=${combinedClass || undefined}>
        ${this.getIconPath(this.name)}
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lit-icon': LitIcon;
  }
}
