import { Injectable, signal } from '@angular/core';

export interface VitalsRecord {
  timestamp: number;
  heartRate: number;
  bloodOxygen: number;
  glucose: number;
  activity: number;
}

const MAX_RECORDS = 100; // Keep the last 100 records

@Injectable({
  providedIn: 'root'
})
export class VitalsService {
  private _vitalsHistory = signal<VitalsRecord[]>([]);
  readonly vitalsHistory = this._vitalsHistory.asReadonly();

  addVitalsRecord(vitals: Omit<VitalsRecord, 'timestamp'>): void {
    const newRecord: VitalsRecord = {
      ...vitals,
      timestamp: Date.now()
    };
    this._vitalsHistory.update(history => {
      const newHistory = [...history, newRecord];
      // Keep the history array from growing indefinitely
      if (newHistory.length > MAX_RECORDS) {
        return newHistory.slice(newHistory.length - MAX_RECORDS);
      }
      return newHistory;
    });
  }

  clearHistory(): void {
    this._vitalsHistory.set([]);
  }
}
