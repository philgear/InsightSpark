import { Component, input, output, ElementRef, AfterViewInit, OnChanges, SimpleChanges, ViewChild, effect, untracked } from '@angular/core';
import { IconComponent } from './icon.component';
import { CommonModule } from '@angular/common';
import { Project, Lesson } from '../../models/portfolio-data';

import * as d3 from 'd3';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  text: string;
  fullText?: string;
  type: 'project' | 'discipline' | 'technology' | 'lesson';
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
  imports: [IconComponent, CommonModule,],
  template: `
    <div class="relative w-full h-full min-h-[300px]">
      <!-- SVG Canvas Container -->
      <div #graphContainer class="w-full h-full min-h-[300px] overflow-hidden bg-white select-none border border-black" style="border-radius: 0px !important;"></div>
      
      <!-- Inset White Shadow Overlay & Non-Teal Border -->
      <div class="absolute inset-0 pointer-events-none border border-black" style="box-shadow: inset 0 0 30px #ffffff; border-radius: 0px !important;"></div>
      
      <!-- Tooltip Element -->
      <div #tooltip class="hidden absolute pointer-events-none bg-black border border-black text-white p-3 z-30 font-sans max-w-xs transition-opacity duration-200" style="border-radius: 0px !important;">
        <div id="tooltip-type" class="text-[8px] font-black uppercase tracking-widest text-[var(--text-accent)] mb-1"></div>
        <div id="tooltip-text" class="text-[10px] leading-relaxed whitespace-pre-wrap"></div>
      </div>
      
      <!-- Graph Zoom Controls -->
      <div class="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
        <button (click)="zoomIn()" class="flex items-center justify-center w-9 h-9 bg-white border border-black hover:bg-neutral-100 text-black transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400" aria-label="Zoom In" style="border-radius: 0px !important;">
          <app-icon name="plus" [size]="16"></app-icon>
        </button>
        <button (click)="zoomOut()" class="flex items-center justify-center w-9 h-9 bg-white border border-black hover:bg-neutral-100 text-black transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400" aria-label="Zoom Out" style="border-radius: 0px !important;">
          <app-icon name="minus" [size]="18"></app-icon>
        </button>
        <button (click)="resetZoom()" class="flex items-center justify-center w-9 h-9 bg-white border border-black hover:bg-neutral-100 text-black transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400" aria-label="Reset Zoom" style="border-radius: 0px !important;">
          <app-icon name="maximize" [size]="18"></app-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .graph-link {
      stroke: #cccccc;
      stroke-opacity: 0.6;
      stroke-width: 1.5px;
      transition: stroke 0.3s, stroke-opacity 0.3s, stroke-width 0.3s;
    }
    :host ::ng-deep .graph-link.highlighted {
      stroke: var(--tertiary-color);
      stroke-opacity: 1;
      stroke-width: 3px;
    }
    :host ::ng-deep .graph-node {
      cursor: pointer;
      transition: opacity 0.3s, transform 0.3s;
    }
    :host ::ng-deep .graph-node circle {
      stroke: #000000;
      stroke-width: 1.5px;
      transition: stroke 0.3s, stroke-width 0.3s, r 0.3s;
    }
    :host ::ng-deep .graph-node.highlighted circle {
      stroke: var(--secondary-color) !important;
      stroke-width: 3px;
    }
    :host ::ng-deep .graph-node.dimmed {
      opacity: 0.2;
    }
    :host ::ng-deep .graph-node text {
      font-family: 'Inter', sans-serif;
      font-size: 9px;
      font-weight: bold;
      fill: #000000;
      pointer-events: none;
      text-anchor: middle;
      transition: fill 0.3s, font-size 0.3s, opacity 0.3s;
      paint-order: stroke;
      stroke: #ffffff;
      stroke-width: 3px;
      stroke-linecap: butt;
      stroke-linejoin: miter;
    }
    :host ::ng-deep .graph-node.highlighted text {
      fill: var(--secondary-color);
      font-size: 12px;
      font-weight: 700;
    }
    :host ::ng-deep .graph-node.project-node text,
    :host ::ng-deep .graph-node.lesson-node text {
      font-family: var(--font-serif);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: normal;
    }
    :host ::ng-deep .graph-node.discipline-node text,
    :host ::ng-deep .graph-node.technology-node text {
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  `],})
export class GraphViewComponent implements AfterViewInit, OnChanges {
  @ViewChild('graphContainer') private graphContainer!: ElementRef;
  @ViewChild('tooltip') private tooltipElement!: ElementRef;
  
  projects = input.required<Project[]>();
  activeDisciplines = input<Set<string>>(new Set());
  activeTechnologies = input<Set<string>>(new Set());
  activeLesson = input<Lesson | null>(null);
  nodeSelected = output<{ id: string; type: string; rawId: string }>();

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
      const projects = this.projects();
      this.activeLesson();
      if (this.isInitialized && projects) {
        untracked(() => this.renderGraph());
      }
    });
  }

  ngAfterViewInit(): void {
    this.isInitialized = true;
    this.renderGraph();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isInitialized && (
      changes['projects'] || 
      changes['activeLesson'] || 
      changes['activeDisciplines'] || 
      changes['activeTechnologies']
    )) {
      this.renderGraph();
    }
  }

  private getDisciplineColor(name: string): string {
    return 'var(--secondary-color)';
  }

  private getTechnologyColor(name: string): string {
    return 'var(--tertiary-color)';
  }

  private createGraphData(): { nodes: GraphNode[], links: GraphLink[] } {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const projects = this.projects();
    const lesson = this.activeLesson();

    const addedNodes = new Set<string>();

    const addNode = (n: GraphNode) => {
      if (!addedNodes.has(n.id)) {
        nodes.push(n);
        addedNodes.add(n.id);
      }
    };

    // 1. Add Active Lesson Node if present
    if (lesson) {
      const lessonNodeId = `lesson-${lesson.id}`;
      addNode({
        id: lessonNodeId,
        text: lesson.title,
        fullText: `Lesson: ${lesson.title}\n\nDiscipline: ${lesson.discipline}\n\n${lesson.description}`,
        type: 'lesson',
        color: '#ffffff', // Clean contrast white for lesson node focus
        radius: 22
      });
    }

    // 2. Add Projects, their Disciplines and Technologies
    projects.forEach(project => {
      const projNodeId = `project-${project.id}`;
      addNode({
        id: projNodeId,
        text: project.title,
        fullText: `Project: ${project.title}\nDiscipline: ${project.discipline}\nTechs: ${project.technologies.join(', ')}\n\n${project.description}`,
        type: 'project',
        color: 'var(--primary-color)',
        radius: 18
      });

      // Add associated Discipline Node
      const discNodeId = `discipline-${project.discipline.toLowerCase().replace(/\s+/g, '-')}`;
      addNode({
        id: discNodeId,
        text: project.discipline,
        fullText: `Discipline: ${project.discipline}`,
        type: 'discipline',
        color: this.getDisciplineColor(project.discipline),
        radius: 24
      });

      // Link Project -> Discipline
      links.push({
        source: projNodeId,
        target: discNodeId
      });

      // Add associated Technology Nodes
      project.technologies.forEach(tech => {
        const techNodeId = `technology-${tech.toLowerCase().replace(/\s+/g, '-')}`;
        addNode({
          id: techNodeId,
          text: tech,
          fullText: `Technology: ${tech}`,
          type: 'technology',
          color: this.getTechnologyColor(tech),
          radius: 14
        });

        // Link Project -> Technology
        links.push({
          source: projNodeId,
          target: techNodeId
        });
      });

      // If active lesson is related to this project, link them
      if (lesson && lesson.relatedProjectIds.includes(project.id)) {
        links.push({
          source: `lesson-${lesson.id}`,
          target: projNodeId
        });
      }
    });

    // If active lesson is present, add edges from lesson to its direct technologies as well
    if (lesson) {
      lesson.technologies.forEach(tech => {
        const techNodeId = `technology-${tech.toLowerCase().replace(/\s+/g, '-')}`;
        if (addedNodes.has(techNodeId)) {
          links.push({
            source: `lesson-${lesson.id}`,
            target: techNodeId
          });
        }
      });
    }

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
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance((d: any) => {
          if (d.source.type === 'lesson' || d.target.type === 'lesson') return 160;
          if (d.source.type === 'discipline' || d.target.type === 'discipline') return 140;
          return 90;
        }))
        .force("charge", d3.forceManyBody().strength(-350))
        .force("center", d3.forceCenter(width / 2, height / 2))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .force("collide", d3.forceCollide().radius((d: any) => d.radius + 15));

    this.svg = d3.select(container).append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", [0, 0, width, height])
        .attr("role", "img")
        .attr("aria-label", "Relational Node Map of Projects, Disciplines, Technologies, and Lessons");
    
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
        .attr("tabindex", "0")
        .attr("role", "button")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("aria-label", (d: any) => `${d.type}: ${d.text}`)
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

    // Emit event for linking graph to context
    let rawId = d.id;
    if (d.id.startsWith('project-')) rawId = d.id.substring(8);
    else if (d.id.startsWith('lesson-')) rawId = d.id.substring(7);
    else if (d.id.startsWith('discipline-')) rawId = d.id.substring(11);
    else if (d.id.startsWith('technology-')) rawId = d.id.substring(11);

    this.nodeSelected.emit({ id: d.id, type: d.type, rawId });
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
    
    let clientX = event.clientX;
    let clientY = event.clientY;
    
    if (clientX === undefined || clientY === undefined) {
      const targetEl = event.currentTarget || event.target;
      if (targetEl && typeof targetEl.getBoundingClientRect === 'function') {
        const rect = targetEl.getBoundingClientRect();
        clientX = rect.left + rect.width / 2;
        clientY = rect.bottom;
      } else {
        const scaleX = containerRect.width / 800;
        const scaleY = containerRect.height / 600;
        clientX = containerRect.left + (d.x ?? 0) * scaleX;
        clientY = containerRect.top + (d.y ?? 0) * scaleY;
      }
    }
    
    const x = clientX - containerRect.left + 10;
    const y = clientY - containerRect.top + 10;
    
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