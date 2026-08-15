import { Component, input, ElementRef, AfterViewInit, OnChanges, SimpleChanges, ViewChild, effect, untracked, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InsightResult, CreativeStrategy } from '../../models/creative-types';
import { IconComponent } from './icon.component';
import { KleePaletteService } from '../../services/klee-palette.service';

import * as d3 from 'd3';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  text: string;
  fullText?: string;
  type: 'problem' | 'strategy' | 'insight';
  color: string;
  radius: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

@Component({
  selector: 'app-graph-view',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="relative w-full h-160 organic-shape overflow-hidden bg-(--card-bg-subtle) border border-(--border-color) shadow-xl">
      <!-- Main SVG Container -->
      <div #graphContainer class="w-full h-full non-printable"></div>
      
      <!-- Tooltip -->
      <div #tooltip class="absolute hidden pointer-events-none z-30 max-w-xs p-4 bg-(--header-bg) backdrop-blur-md border border-(--border-color-strong) rounded-xl shadow-2xl text-sm animate-pop">
        <p class="font-medium text-(--text-accent) mb-1 uppercase tracking-wider text-[10px]" id="tooltip-type"></p>
        <p class="text-(--text-color) leading-relaxed" id="tooltip-text"></p>
      </div>

      <!-- Filter Chips & Legend Bar -->
      <div class="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-20">
        <button (click)="setFilter('all')" 
                [class.bg-[var(--text-accent)]]="activeFilter() === 'all'"
                [class.text-[var(--primary-cta-text)]]="activeFilter() === 'all'"
                [class.bg-[var(--card-bg)]]="activeFilter() !== 'all'"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-(--border-color) shadow-md transition-all focus:outline-none">
          All Nodes ({{ totalNodeCount() }})
        </button>
        <button (click)="setFilter('problem')"
                [class.bg-[var(--text-accent)]]="activeFilter() === 'problem'"
                [class.text-[var(--primary-cta-text)]]="activeFilter() === 'problem'"
                [class.bg-[var(--card-bg)]]="activeFilter() !== 'problem'"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-(--border-color) shadow-md transition-all focus:outline-none flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-(--text-accent)"></span>
          Problem Root
        </button>
        <button (click)="setFilter('strategy')"
                [class.bg-[var(--text-accent)]]="activeFilter() === 'strategy'"
                [class.text-[var(--primary-cta-text)]]="activeFilter() === 'strategy'"
                [class.bg-[var(--card-bg)]]="activeFilter() !== 'strategy'"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-(--border-color) shadow-md transition-all focus:outline-none flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          Strategies
        </button>
        <button (click)="setFilter('insight')"
                [class.bg-[var(--text-accent)]]="activeFilter() === 'insight'"
                [class.text-[var(--primary-cta-text)]]="activeFilter() === 'insight'"
                [class.bg-[var(--card-bg)]]="activeFilter() !== 'insight'"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-(--border-color) shadow-md transition-all focus:outline-none flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-amber-400"></span>
          Insights
        </button>
      </div>

      <!-- Export & Action Controls (Top Right) -->
      <div class="absolute top-4 right-4 flex items-center gap-2 z-20">
        <button (click)="exportSVG()" 
                class="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-(--card-bg) border border-(--border-color) shadow-md hover:bg-(--button-bg-hover) text-xs font-bold text-(--text-color) transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-(--ring-color)">
          <app-icon name="download" [size]="16" class="text-(--text-accent)"></app-icon>
          <span>Export SVG</span>
        </button>
      </div>

      <!-- Graph Navigation Controls (Bottom Right) -->
      <div class="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
        <button (click)="zoomIn()" class="flex items-center justify-center w-10 h-10 rounded-full bg-(--card-bg) border border-(--border-color) shadow-lg hover:bg-(--button-bg-hover) transition-colors focus:outline-none focus:ring-2 focus:ring-(--ring-color)" aria-label="Zoom In">
          <app-icon name="plus" [size]="18"></app-icon>
        </button>
        <button (click)="zoomOut()" class="flex items-center justify-center w-10 h-10 rounded-full bg-(--card-bg) border border-(--border-color) shadow-lg hover:bg-(--button-bg-hover) transition-colors focus:outline-none focus:ring-2 focus:ring-(--ring-color)" aria-label="Zoom Out">
          <app-icon name="minus" [size]="18"></app-icon>
        </button>
        <button (click)="resetZoom()" class="flex items-center justify-center w-10 h-10 rounded-full bg-(--card-bg) border border-(--border-color) shadow-lg hover:bg-(--button-bg-hover) transition-colors focus:outline-none focus:ring-2 focus:ring-(--ring-color)" aria-label="Reset Zoom">
          <app-icon name="maximize" [size]="18"></app-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .graph-link {
      stroke: var(--border-color);
      stroke-opacity: 0.35;
      stroke-width: 1.8px;
      transition: stroke 0.3s, stroke-opacity 0.3s, stroke-width 0.3s;
    }
    :host ::ng-deep .graph-link.highlighted {
      stroke: var(--text-accent);
      stroke-opacity: 1;
      stroke-width: 3.5px;
    }
    :host ::ng-deep .graph-node {
      cursor: pointer;
      transition: opacity 0.3s, transform 0.3s;
    }
    :host ::ng-deep .graph-node circle.main-circle {
      transition: stroke 0.3s, stroke-width 0.3s, r 0.3s, fill 0.3s;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
    }
    :host ::ng-deep .graph-node.highlighted circle.main-circle {
      stroke: var(--text-highlight);
      stroke-width: 3.5px;
    }
    :host ::ng-deep .graph-node.dimmed {
      opacity: 0.15;
    }
    :host ::ng-deep .graph-node text {
      font-size: 11px;
      font-weight: 600;
      fill: var(--text-color);
      pointer-events: none;
      transition: fill 0.3s, font-size 0.3s;
      text-shadow: 0 1px 2px var(--bg-color);
    }
    :host ::ng-deep .graph-node.highlighted text {
      fill: var(--text-color);
      font-size: 13px;
      font-weight: 700;
    }
    :host ::ng-deep .pulse-ring {
      animation: pulse-ring 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
      transform-origin: center;
    }
    @keyframes pulse-ring {
      0% {
        r: 20px;
        opacity: 0.8;
      }
      100% {
        r: 45px;
        opacity: 0;
      }
    }
  `]
})
export class GraphViewComponent implements AfterViewInit, OnChanges {
  @ViewChild('graphContainer') private graphContainer!: ElementRef;
  @ViewChild('tooltip') private tooltipElement!: ElementRef;
  
  results = input.required<InsightResult[]>();
  problem = input.required<string>();
  strategies = input.required<CreativeStrategy[]>();

  activeFilter = signal<'all' | 'problem' | 'strategy' | 'insight'>('all');
  totalNodeCount = signal<number>(0);

  private kleePalette = inject(KleePaletteService);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private svg: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private simulation: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private zoomBehavior: any;
  private isInitialized = false;
  private selectedNodeId: string | null = null;

  constructor() {
    effect(() => {
      // Re-render graph when inputs change
      const results = this.results();
      const problem = this.problem();
      if (this.isInitialized && results && problem) {
        untracked(() => this.renderGraph());
      }
    });
  }

  ngAfterViewInit(): void {
    this.isInitialized = true;
    this.renderGraph();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isInitialized && (changes['results'] || changes['problem'])) {
      this.renderGraph();
    }
  }

  setFilter(filter: 'all' | 'problem' | 'strategy' | 'insight'): void {
    this.activeFilter.set(filter);
    this.renderGraph();
  }

  private getStrategyColor(strategyName: string): string {
    const strategyId = strategyName.toLowerCase().replace('’', '').replace(/\s+/g, '-');
    const style = getComputedStyle(document.documentElement);
    return style.getPropertyValue(`--strategy-${strategyId}`).trim() || 'gray';
  }

  private getBlendedStrategyColor(strategyName: string, blendRatio = 0): string {
    const strategyColor = this.getStrategyColor(strategyName);
    if (blendRatio === 0) return strategyColor;
    try {
      const bgColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--bg-color').trim();
      if (/^#[0-9a-f]{3,6}$/i.test(strategyColor) && /^#[0-9a-f]{3,6}$/i.test(bgColor)) {
        return this.kleePalette.blend(bgColor, strategyColor, blendRatio);
      }
    } catch {
      // Fallback
    }
    return strategyColor;
  }

  private createGraphData(): { nodes: GraphNode[], links: GraphLink[] } {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const problemText = this.problem();
    const resultsData = this.results();
    const filter = this.activeFilter();

    // 1. Problem Node
    const problemId = 'problem-root';
    if (filter === 'all' || filter === 'problem') {
      nodes.push({
        id: problemId,
        text: problemText.length > 50 ? problemText.substring(0, 47) + '...' : problemText,
        fullText: problemText,
        type: 'problem',
        color: 'var(--text-accent)',
        radius: 32,
      });
    }

    // 2. Strategy and Insight Nodes
    resultsData.forEach((result, i) => {
      const strategyId = `strategy-${i}`;
      const strategyName = result.strategyName;
      
      // Strategy Node
      if (filter === 'all' || filter === 'strategy') {
        nodes.push({
          id: strategyId,
          text: strategyName,
          fullText: strategyName,
          type: 'strategy',
          color: this.getStrategyColor(strategyName),
          radius: 22,
        });

        if (filter === 'all') {
          links.push({
            source: problemId,
            target: strategyId,
          });
        }
      }

      // Insight Nodes
      if (filter === 'all' || filter === 'insight') {
        result.insights.forEach((insight, j) => {
          const insightId = `insight-${i}-${j}`;
          nodes.push({
            id: insightId,
            text: insight.text.length > 30 ? insight.text.substring(0, 27) + '...' : insight.text,
            fullText: insight.text,
            type: 'insight',
            color: this.getBlendedStrategyColor(strategyName, 0.5),
            radius: 12,
          });

          if (filter === 'all' || filter === 'insight') {
            const linkSource = (filter === 'insight') ? (nodes.find(n => n.type === 'strategy')?.id || problemId) : strategyId;
            if (nodes.some(n => n.id === linkSource)) {
              links.push({
                source: linkSource,
                target: insightId,
              });
            }
          }
        });
      }
    });

    this.totalNodeCount.set(nodes.length);
    return { nodes, links };
  }

  private renderGraph(): void {
    if (!this.graphContainer) return;
    
    d3.select(this.graphContainer.nativeElement).select('svg').remove();

    const { nodes, links } = this.createGraphData();
    if (nodes.length === 0) return;

    const container = this.graphContainer.nativeElement;
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    this.simulation = d3.forceSimulation(nodes)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance((d: any) => d.source.type === 'problem' ? 220 : 120))
        .force("charge", d3.forceManyBody().strength(-900))
        .force("center", d3.forceCenter(width / 2, height / 2))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .force("collide", d3.forceCollide().radius((d: any) => d.radius + 20));

    this.svg = d3.select(container).append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", [0, 0, width, height]);
    
    this.zoomBehavior = d3.zoom()
        .scaleExtent([0.1, 4])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on("zoom", (event: any) => {
          g.attr("transform", event.transform);
        });

    this.svg.call(this.zoomBehavior);

    const g = this.svg.append("g");

    const link = g.append("g")
        .attr("class", "graph-links")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("class", "graph-link");

    const node = g.append("g")
        .attr("class", "graph-nodes")
        .selectAll("g")
        .data(nodes)
        .join("g")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("class", (d: any) => `graph-node ${d.type}-node`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on("click", (event: any, d: any) => this.handleNodeClick(event, d, node, link))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on("mouseover", (event: any, d: any) => this.showTooltip(event, d))
        .on("mouseout", () => this.hideTooltip())
        .call(this.drag(this.simulation));
        
    // Pulse animation ring for Strategy Nodes
    node.filter((d: GraphNode) => d.type === 'strategy')
        .append("circle")
        .attr("class", "pulse-ring")
        .attr("r", 20)
        .attr("fill", "none")
        .attr("stroke", (d: GraphNode) => d.color)
        .attr("stroke-width", 2);

    node.append("circle")
        .attr("class", "main-circle")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("r", (d: any) => d.radius)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("fill", (d: any) => d.color);

    node.append("text")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("dy", (d: any) => d.radius + 14)
        .attr("text-anchor", "middle")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .text((d: any) => d.text)
        .clone(true).lower()
        .attr("stroke", "var(--bg-color)")
        .attr("stroke-width", 3);

    this.simulation.on("tick", () => {
        link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .attr("x1", (d: any) => d.source.x)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .attr("y1", (d: any) => d.source.y)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .attr("x2", (d: any) => d.target.x)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .attr("y2", (d: any) => d.target.y);

        node
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private drag(simulation: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleNodeClick(event: any, d: any, nodeSelection: any, linkSelection: any): void {
    event.stopPropagation();
    
    if (this.selectedNodeId === d.id) {
      this.selectedNodeId = null;
    } else {
      this.selectedNodeId = d.id;
    }

    if (!this.selectedNodeId) {
      nodeSelection.classed('highlighted', false).classed('dimmed', false);
      linkSelection.classed('highlighted', false);
      return;
    }

    const connectedNodeIds = new Set<string>([d.id]);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    linkSelection.classed('highlighted', (l: any) => {
      const isConnected = l.source.id === d.id || l.target.id === d.id;
      if (isConnected) {
        connectedNodeIds.add(l.source.id);
        connectedNodeIds.add(l.target.id);
      }
      return isConnected;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nodeSelection.classed('highlighted', (n: any) => n.id === d.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nodeSelection.classed('dimmed', (n: any) => !connectedNodeIds.has(n.id));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private showTooltip(event: any, d: any): void {
    if (!this.tooltipElement) return;
    
    const tooltip = this.tooltipElement.nativeElement;
    const typeEl = tooltip.querySelector('#tooltip-type');
    const textEl = tooltip.querySelector('#tooltip-text');
    
    typeEl.textContent = d.type;
    textEl.textContent = d.fullText || d.text;
    
    tooltip.classList.remove('hidden');
    
    const containerRect = this.graphContainer.nativeElement.getBoundingClientRect();
    const x = event.clientX - containerRect.left + 10;
    const y = event.clientY - containerRect.top + 10;
    
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
  }

  private hideTooltip(): void {
    if (!this.tooltipElement) return;
    this.tooltipElement.nativeElement.classList.add('hidden');
  }

  public exportSVG(): void {
    if (!this.graphContainer) return;
    const svgElement = this.graphContainer.nativeElement.querySelector('svg');
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pivot-pulse-strategy-graph-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  public resetZoom(): void {
    if (this.svg && this.zoomBehavior) {
      this.svg.transition()
        .duration(750)
        .call(this.zoomBehavior.transform, d3.zoomIdentity);
    }
  }

  public zoomIn(): void {
    if (this.svg && this.zoomBehavior) {
      this.svg.transition()
        .duration(300)
        .call(this.zoomBehavior.scaleBy, 1.3);
    }
  }

  public zoomOut(): void {
    if (this.svg && this.zoomBehavior) {
      this.svg.transition()
        .duration(300)
        .call(this.zoomBehavior.scaleBy, 1/1.3);
    }
  }
}