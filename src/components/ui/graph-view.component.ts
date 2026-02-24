import { Component, input, ElementRef, AfterViewInit, OnChanges, SimpleChanges, ViewChild, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InsightResult, CreativeStrategy } from '../../models/creative-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const d3: any;

interface GraphNode {
  id: string;
  text: string;
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
  imports: [CommonModule],
  template: `<div #graphContainer class="graph-container w-full h-[600px] non-printable"></div>`,
})
export class GraphViewComponent implements AfterViewInit, OnChanges {
  @ViewChild('graphContainer') private graphContainer!: ElementRef;
  
  results = input.required<InsightResult[]>();
  problem = input.required<string>();
  strategies = input.required<CreativeStrategy[]>();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private svg: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private simulation: any;
  private isInitialized = false;

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
        .attr("viewBox", [0, 0, width, height]);
    
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on("zoom", (event: any) => {
          g.attr("transform", event.transform);
        });

    this.svg.call(zoom);

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
}