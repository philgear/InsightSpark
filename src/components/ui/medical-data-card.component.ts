import { Component, signal, computed, WritableSignal, inject, effect, untracked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './icon.component';
import { AppComponent } from '../../app.component';
import { VitalsService } from '../../services/vitals.service';
import { VitalsTrendGraphComponent } from './vitals-trend-graph.component';

// Define a type for patient status for clarity
type PatientStatus = {
  text: string;
  colorClass: string; // Tailwind CSS class for color
};

@Component({
  selector: 'app-medical-data-card',
  standalone: true,
  imports: [CommonModule, IconComponent, VitalsTrendGraphComponent],
  templateUrl: './medical-data-card.component.html',
})
export class MedicalDataCardComponent implements OnDestroy {
  // Inject the parent component to access its signals and methods
  public parent = inject(AppComponent);
  private vitalsService = inject(VitalsService);
  private debounceTimer: any;

  // --- Component state for unique IDs for a11y ---
  readonly heartRateId = 'hr-' + crypto.randomUUID();
  readonly bloodOxygenId = 'bo-' + crypto.randomUUID();
  readonly glucoseId = 'gl-' + crypto.randomUUID();
  readonly activityId = 'ac-' + crypto.randomUUID();

  // --- State Signals ---
  heartRate = signal(72);
  bloodOxygen = signal(98);
  glucose = signal(105);
  activity = signal(8450);

  // Trend graph visibility
  showTrends = signal(false);

  // --- Computed Patient Status ---
  patientStatus = computed<PatientStatus>(() => {
    const hr = this.heartRate();
    const spo2 = this.bloodOxygen();
    const glu = this.glucose();

    if (spo2 < 95) {
      return { text: 'Low Oxygen', colorClass: 'bg-red-500' };
    }
    if (hr > 110 || hr < 50) {
      return { text: 'Heart Rate Alert', colorClass: 'bg-red-500' };
    }
    if (glu > 140) {
      return { text: 'High Glucose', colorClass: 'bg-yellow-500' };
    }
    if (hr > 100) {
      return { text: 'High Heart Rate', colorClass: 'bg-yellow-500' };
    }
    if (spo2 < 97) {
        return { text: 'Oxygen Monitor', colorClass: 'bg-yellow-500' };
    }
    return { text: 'Vitals Stable', colorClass: 'bg-green-500' };
  });

  constructor() {
    // Record initial state
    this.recordVitals();

    // Record subsequent changes, debounced
    effect(() => {
      // Subscribe effect to all vitals signals
      this.heartRate(); this.bloodOxygen(); this.glucose(); this.activity();

      untracked(() => {
          clearTimeout(this.debounceTimer);
          this.debounceTimer = setTimeout(() => this.recordVitals(), 1000);
      });
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.debounceTimer);
  }

  private recordVitals() {
    this.vitalsService.addVitalsRecord({
        heartRate: this.heartRate(),
        bloodOxygen: this.bloodOxygen(),
        glucose: this.glucose(),
        activity: this.activity()
    });
  }
  
  // --- UI Methods ---
  toggleTrends = () => this.showTrends.update(v => !v);

  // --- Methods to adjust values ---
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
  }
  
  adjustVital(
    valueSignal: WritableSignal<number>,
    amount: number,
    min: number,
    max: number,
    event?: Event
  ) {
    if (event) {
        event.preventDefault(); // Prevent focus loss on button click
    }
    valueSignal.update(current => this.clamp(current + amount, min, max));
    
    // Side effect for activity changes
    if (valueSignal === this.activity) {
      if (amount > 0) {
          this.heartRate.update(hr => this.clamp(hr - 1, 40, 200));
          this.glucose.update(g => this.clamp(g - 1, 50, 400));
      } else if (amount < 0) {
          this.heartRate.update(hr => this.clamp(hr + 1, 40, 200));
      }
    }
  }

  onValueChange(
    event: Event,
    valueSignal: WritableSignal<number>,
    min: number,
    max: number
  ) {
    const inputElement = event.target as HTMLInputElement;
    let numericValue = parseInt(inputElement.value, 10);

    if (isNaN(numericValue)) {
      inputElement.value = String(valueSignal());
      return; 
    }
    
    const clampedValue = this.clamp(numericValue, min, max);
    valueSignal.set(clampedValue);

    if (String(clampedValue) !== inputElement.value) {
      inputElement.value = String(clampedValue);
    }
  }

  useAsContext() {
    const dataPoints = [
      `Heart Rate: ${this.heartRate()} BPM`,
      `Blood Oxygen: ${this.bloodOxygen()}% SpO2`,
      `Glucose: ${this.glucose()} mg/dL`,
      `Recent Activity: ${this.activity()} steps`,
      `Current Status: ${this.patientStatus().text}`
    ];
    
    const context = `Considering the following health data:\n- ${dataPoints.join('\n- ')}`;
    this.parent.applyDataContext(context.trim());
  }
}