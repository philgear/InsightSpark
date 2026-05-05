import { Component, ElementRef, AfterViewInit, ViewChild, inject, signal, effect, untracked, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VitalsService, VitalsRecord } from '../../services/vitals.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as d3 from 'd3';

type VitalKey = 'heartRate' | 'bloodOxygen' | 'glucose' | 'activity';

interface VitalMetric {
  key: VitalKey;
  name: string;
  color: string;
  icon: string;
  unit: string;
}

@Component({
  selector: 'app-vitals-trend-graph',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vitals-trend-graph.component.html',
})
export class VitalsTrendGraphComponent implements AfterViewInit {
  @ViewChild('chartContainer') private chartContainer!: ElementRef;
  
  private vitalsService = inject(VitalsService);
  
  vitalsHistory = this.vitalsService.vitalsHistory;
  
  metrics: VitalMetric[] = [
    { key: 'heartRate', name: 'Heart Rate', color: 'var(--strategy-what-if)', icon: 'heart', unit: 'BPM' },
    { key: 'glucose', name: 'Glucose', color: 'var(--strategy-simplify)', icon: 'droplet', unit: 'mg/dL' },
    { key: 'bloodOxygen', name: 'Blood Oxygen', color: 'var(--text-highlight)', icon: 'percent', unit: '%' },
    { key: 'activity', name: 'Activity', color: 'var(--strategy-nature)', icon: 'activity', unit: 'steps' },
  ];

  visibleVitals = signal<Set<VitalKey>>(new Set(['heartRate']));
  
  private isInitialized = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private svg: any;

  chartSummary = computed(() => {
    const data = this.vitalsHistory();
    const visibleKeys = Array.from(this.visibleVitals());
    if (data.length < 2 || visibleKeys.length === 0) {
      return 'Not enough data to display trends.';
    }

    const summary = 'Graph showing trends for: ';
    const trendSummaries = visibleKeys.map(key => {
      const metric = this.metrics.find(m => m.key === key);
      const firstValue = data[0][key];
      const lastValue = data[data.length - 1][key];
      let trend = 'stable';
      if (lastValue > firstValue) trend = 'trending up';
      if (lastValue < firstValue) trend = 'trending down';
      
      return `${metric?.name || key} is ${trend} at ${lastValue} ${metric?.unit || ''}.`;
    });

    return summary + trendSummaries.join(' ');
  });

  constructor() {
    effect(() => {
      // Re-render chart when data or visibility changes
      this.vitalsHistory();
      this.visibleVitals();
      if (this.isInitialized) {
        untracked(() => this.renderChart());
      }
    });
  }

  ngAfterViewInit(): void {
    this.isInitialized = true;
    this.renderChart();
  }

  toggleVital(key: VitalKey) {
    this.visibleVitals.update(current => {
      const newSet = new Set(current);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }

  private renderChart(): void {
    if (!this.chartContainer) return;
    
    const element = this.chartContainer.nativeElement;
    d3.select(element).select('svg').remove();

    const data = this.vitalsHistory();
    const visibleKeys = Array.from(this.visibleVitals());

    if (data.length < 2 || visibleKeys.length === 0) return;

    const margin = { top: 20, right: 50, bottom: 30, left: 50 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    this.svg = d3.select(element).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    const x = d3.scaleTime()
      .domain(d3.extent(data, (d: VitalsRecord) => new Date(d.timestamp)) as [Date, Date])
      .range([0, width]);

    this.svg.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%H:%M")));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const yScales: Record<VitalKey, any> = {} as Record<VitalKey, any>;
    
    // FIX: Explicitly type 'key' to prevent type inference issues.
    visibleKeys.forEach((key: VitalKey) => {
      const domain = d3.extent(data, (d: VitalsRecord) => d[key]) as [number, number];
      const padding = (domain[1] - domain[0]) * 0.1 || 1; // Add padding or a default for flat lines
      yScales[key] = d3.scaleLinear()
        .domain([domain[0] - padding, domain[1] + padding])
        .range([height, 0]);
    });

    const axesToDraw = visibleKeys.slice(0, 2);
    // FIX: Explicitly type 'key' to prevent type inference issues.
    axesToDraw.forEach((key: VitalKey, index) => {
      const metric = this.metrics.find(m => m.key === key);
      const axisGenerator = index === 0 ? d3.axisLeft(yScales[key]).ticks(5) : d3.axisRight(yScales[key]).ticks(5);
      this.svg.append('g')
        .attr('transform', index === 1 ? `translate(${width}, 0)` : '')
        .style('color', metric?.color || 'white')
        .call(axisGenerator);
    });

    // FIX: Explicitly type 'key' to prevent type inference issues.
    visibleKeys.forEach((key: VitalKey) => {
      const metric = this.metrics.find(m => m.key === key);
      const yScale = yScales[key];
      if (!metric || !yScale) return;

      this.svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', metric.color)
        .attr('stroke-width', 2.5)
        .attr('d', d3.line<VitalsRecord>()
          // FIX: Explicitly type 'd' as VitalsRecord for type safety in accessors.
          .x((d: VitalsRecord) => x(new Date(d.timestamp)))
          .y((d: VitalsRecord) => yScale(d[key]))
        );
    });
  }
}