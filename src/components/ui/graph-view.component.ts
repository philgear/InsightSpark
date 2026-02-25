import { Component, input, ElementRef, AfterViewInit, OnChanges, SimpleChanges, ViewChild, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InsightResult, CreativeStrategy } from '../../models/creative-types';
import { IconComponent } from './icon.component';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const d3: any;

interface GraphNode {
  id: string;
  text: string;
  fullText?: string;
  type: 'problem' | 'strategy' | 'insight';
  color: string;
  radius: number;
}

interface GraphLink {
  source: string;
  target: string;
}

@Component({
  selector: 'app-graph-view',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="relative w-full h-[600px] organic-shape overflow-hidden bg-[var(--card-bg-subtle)] border border-[var(--border-color)]">
      <div #graphContainer class="w-full h-full non-printable"></div>
      
      <!-- Tooltip -->
      <div #tooltip class="absolute hidden pointer-events-none z-30 max-w-xs p-4 bg-[var(--header-bg)] backdrop-blur-md border border-[var(--border-color-strong)] rounded-xl shadow-2xl text-sm animate-pop">
        <p class="font-medium text-[var(--text-accent)] mb-1 uppercase tracking-wider text-[10px]" id="tooltip-type"></p>
        <p class="text-[var(--text-color)] leading-relaxed" id="tooltip-text"></p>
      </div>

      <!-- Graph Controls -->
      <div class="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
        <button (click)="zoomIn()" class="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] shadow-lg hover:bg-[var(--button-bg-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)]" aria-label="Zoom In">
          <app-icon name="plus" [size]="18"></app-icon>
        </button>
        <button (click)="zoomOut()" class="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] shadow-lg hover:bg-[var(--button-bg-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)]" aria-label="Zoom Out">
          <app-icon name="minus" [size]="18"></app-icon>
        </button>
        <button (click)="resetZoom()" class="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] shadow-lg hover:bg-[var(--button-bg-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)]" aria-label="Reset Zoom">
          <app-icon name="maximize" [size]="18"></app-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .graph-link {
      stroke: var(--border-color);
      stroke-opacity: 0.3;
      stroke-width: 1.5px;
      transition: stroke 0.3s, stroke-opacity 0.3s, stroke-width 0.3s;
    }
    :host ::ng-deep .graph-link.highlighted {
      stroke: var(--text-accent);
      stroke-opacity: 1;
      stroke-width: 3px;
    }
    :host ::ng-deep .graph-node {
      cursor: pointer;
      transition: opacity 0.3s, transform 0.3s;
    }
    :host ::ng-deep .graph-node circle {
      transition: stroke 0.3s, stroke-width 0.3s, r 0.3s;
    }
    :host ::ng-deep .graph-node.highlighted circle {
      stroke: var(--text-highlight);
      stroke-width: 3px;
    }
    :host ::ng-deep .graph-node.dimmed {
      opacity: 0.2;
    }
    :host ::ng-deep .graph-node text {
      font-size: 10px;
      font-weight: 500;
      fill: var(--text-color-muted);
      pointer-events: none;
      transition: fill 0.3s, font-size 0.3s;
    }
    :host ::ng-deep .graph-node.highlighted text {
      fill: var(--text-color);
      font-size: 12px;
      font-weight: 700;
    }
  `]
})
export class GraphViewComponent implements AfterViewInit, OnChanges {
  @ViewChild('graphContainer') private graphContainer!: ElementRef;
  @ViewChild('tooltip') private tooltipElement!: ElementRef;
  
  results = input.required<InsightResult[]>();
  problem = input.required<string>();
  strategies = input.required<CreativeStrategy[]>();
  
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

  private getStrategyColor(strategyName: string): string {
    const strategyId = strategyName.toLowerCase().replace('’', '').replace(/\s+/g, '-');
    const style = getComputedStyle(document.documentElement);
    return style.getPropertyValue(`--strategy-${strategyId}`).trim() || 'gray';
  }

  private createGraphData(): { nodes: GraphNode[], links: GraphLink[] } {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const problemText = this.problem();
    const resultsData = this.results();

    // 1. Problem Node
    const problemId = 'problem-root';
    nodes.push({
      id: problemId,
      text: problemText.length > 50 ? problemText.substring(0, 47) + '...' : problemText,
      fullText: problemText,
      type: 'problem',
      color: 'var(--text-accent)',
      radius: 30,
    });

    // 2. Strategy and Insight Nodes
    resultsData.forEach((result, i) => {
      const strategyId = `strategy-${i}`;
      const strategyName = result.strategyName;
      
      // Strategy Node
      nodes.push({
        id: strategyId,
        text: strategyName,
        fullText: strategyName,
        type: 'strategy',
        color: this.getStrategyColor(strategyName),
        radius: 20,
      });

      // Link from Problem to Strategy
      links.push({
        source: problemId,
        target: strategyId,
      });

      // Insight Nodes
      result.insights.forEach((insight, j) => {
        const insightId = `insight-${i}-${j}`;
        nodes.push({
          id: insightId,
          text: insight.text.length > 30 ? insight.text.substring(0, 27) + '...' : insight.text,
          fullText: insight.text,
          type: 'insight',
          color: this.getStrategyColor(strategyName),
          radius: 10,
        });

        // Link from Strategy to Insight
        links.push({
          source: strategyId,
          target: insightId,
        });
      });
    });

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
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance((d:any) => d.source.type === 'problem' ? 220 : 110))
        .force("charge", d3.forceManyBody().strength(-800))
        .force("center", d3.forceCenter(width / 2, height / 2))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .force("collide", d3.forceCollide().radius((d: any) => d.radius + 18));

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
        
    node.append("circle")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("r", (d: any) => d.radius)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("fill", (d: any) => d.color);

    node.append("text")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("dy", (d: any) => d.radius + 12)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .text((d: any) => d.text)
        .clone(true).lower()
        .attr("stroke", "var(--bg-color)");

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