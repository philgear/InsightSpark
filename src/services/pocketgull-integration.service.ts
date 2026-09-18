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
  private verifiedParentOrigin: string | null = null;

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

      this.verifiedParentOrigin = event.origin;

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

    // Resolve target origin strictly to prevent CWE-345 data interception
    let targetOrigin = this.verifiedParentOrigin;
    if (!targetOrigin && typeof document !== 'undefined' && document.referrer) {
      targetOrigin = ALLOWED_ORIGINS.find(o => document.referrer.startsWith(o)) || null;
    }
    if (!targetOrigin) {
      targetOrigin = 'https://pocketgull.app';
    }

    try {
      window.parent.postMessage({ type, payload }, targetOrigin);
    } catch (e) {
      console.error('Failed to postMessage to parent:', e);
    }
  }
}
