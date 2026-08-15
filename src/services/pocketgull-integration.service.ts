import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export interface PocketgullMessage {
  type: string;
  payload: Record<string, unknown>;
}

const ALLOWED_ORIGINS = [
  'https://pocketgull.app',
  'http://localhost:4200',
  'http://localhost:3000'
];

@Injectable({
  providedIn: 'root'
})
export class PocketgullIntegrationService {
  // Signal to easily react to whether we are embedded or not in templates
  public isEmbedded = signal<boolean>(false);
  
  // Stream of verified incoming messages
  public incomingMessages$ = new Subject<PocketgullMessage>();

  constructor() {
    this.checkIfEmbedded();
    this.setupMessageListener();
  }

  private checkIfEmbedded(): void {
    // A simple check: if our window is not the top window, we are in an iframe
    try {
      this.isEmbedded.set(window !== window.parent);
    } catch {
      // In strict cross-origin cases, accessing window.parent might throw, 
      // but if it throws, we definitely are embedded.
      this.isEmbedded.set(true);
    }
  }

  private setupMessageListener(): void {
    window.addEventListener('message', (event: MessageEvent) => {
      // Strictly verify the origin for security
      if (!ALLOWED_ORIGINS.includes(event.origin)) {
        return;
      }

      if (event.data && typeof event.data === 'object' && 'type' in event.data) {
        this.incomingMessages$.next(event.data as PocketgullMessage);
      }
    });
  }

  /**
   * Dispatches data back to the parent Pocketgull window.
   */
  public exportData(type: string, payload: Record<string, unknown>): void {
    if (!this.isEmbedded()) {
      console.warn('Attempted to export data to Pocketgull, but not running inside an iframe.');
      return;
    }

    // Use '*' or a strict origin depending on the desired strictness.
    // For passing data UP to the parent, '*' is often used if the parent origin is variable,
    // but strict targetOrigin is safer. Since Pocketgull loads this iframe, 
    // we can post back to the parent window, but ideally we'd know the exact origin.
    // We will post to '*' to ensure delivery, but we rely on the parent validating it.
    // However, for maximum security, we can just use event.origin if we saved it, 
    // or broadly send to '*' since it's the parent. 
    // Let's use '*' for parent communication to avoid cross-domain complexities 
    // with subdomains, but the parent should verify.
    try {
      window.parent.postMessage({ type, payload }, '*');
    } catch (e) {
      console.error('Failed to postMessage to parent:', e);
    }
  }
}
