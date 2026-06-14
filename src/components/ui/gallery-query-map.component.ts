import { Component, input, output, ElementRef, AfterViewInit, OnChanges, SimpleChanges, ViewChild, effect, untracked } from '@angular/core';
import { IconComponent } from './icon.component';
import { CommonModule } from '@angular/common';
import { ArtWork } from '../../models/skills-data';
import * as d3 from 'd3';

interface QueryNode extends d3.SimulationNodeDatum {
  id: string; // e.g. "art-1" or "tag-pnw"
  text: string;
  type: 'artwork' | 'tag';
  color: string;
  radius: number;
  image?: string;
  rawItem?: ArtWork;
}

interface QueryLink extends d3.SimulationLinkDatum<QueryNode> {
  source: string | QueryNode;
  target: string | QueryNode;
}

@Component({
  selector: 'app-gallery-query-map',
  standalone: true,
  imports: [IconComponent, CommonModule,],
  template: `
    <div class="relative w-full h-full min-h-[350px]">
      <!-- SVG Canvas Container -->
      <div #mapContainer class="w-full h-full min-h-[350px] overflow-hidden bg-white select-none border-2 border-black" style="border-radius: 0px !important;"></div>
      
      <!-- Inset White Shadow Overlay & Non-Teal Border -->
      <div class="absolute inset-0 pointer-events-none border-2 border-black" style="box-shadow: inset 0 0 30px #ffffff; border-radius: 0px !important;"></div>
      
      <!-- Graph Zoom Controls -->
      <div class="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
        <button (click)="zoomIn()" class="flex items-center justify-center w-9 h-9 bg-white border-2 border-black hover:bg-neutral-100 text-black transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400" aria-label="Zoom In" style="border-radius: 0px !important;">
          <app-icon name="plus" [size]="14"></app-icon>
        </button>
        <button (click)="zoomOut()" class="flex items-center justify-center w-9 h-9 bg-white border-2 border-black hover:bg-neutral-100 text-black transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400" aria-label="Zoom Out" style="border-radius: 0px !important;">
          <app-icon name="minus" [size]="16"></app-icon>
        </button>
        <button (click)="resetZoom()" class="flex items-center justify-center w-9 h-9 bg-white border-2 border-black hover:bg-neutral-100 text-black transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400" aria-label="Reset Zoom" style="border-radius: 0px !important;">
          <app-icon name="maximize" [size]="16"></app-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .map-link {
      stroke: #cccccc;
      stroke-opacity: 0.5;
      stroke-width: 1.5px;
      transition: stroke 0.3s, stroke-opacity 0.3s, stroke-width 0.3s;
    }
    :host ::ng-deep .map-link.highlighted {
      stroke: var(--tertiary-color);
      stroke-opacity: 0.9;
      stroke-width: 2.5px;
    }
    :host ::ng-deep .map-node {
      cursor: pointer;
      transition: opacity 0.3s;
    }
    :host ::ng-deep .map-node circle {
      stroke: var(--border-color);
      stroke-width: 2px;
      transition: stroke 0.3s, stroke-width 0.3s, r 0.3s;
    }
    :host ::ng-deep .map-node.tag-node circle {
      stroke: #000000;
      stroke-dasharray: 4 2;
    }
    :host ::ng-deep .map-node.artwork-node circle {
      stroke: var(--primary-color);
    }
    :host ::ng-deep .map-node.highlighted circle {
      stroke: var(--secondary-color) !important;
      stroke-width: 3px;
    }
    :host ::ng-deep .map-node.dimmed {
      opacity: 0.25;
    }
    :host ::ng-deep .map-node text {
      font-family: 'Inter', sans-serif;
      font-size: 9px;
      font-weight: bold;
      fill: #000000;
      pointer-events: none;
      text-anchor: middle;
      transition: fill 0.3s, font-size 0.3s;
      paint-order: stroke;
      stroke: #ffffff;
      stroke-width: 3px;
      stroke-linecap: butt;
      stroke-linejoin: miter;
    }
    :host ::ng-deep .map-node.highlighted text {
      fill: var(--secondary-color);
      font-size: 11px;
    }
    :host ::ng-deep .map-node.tag-node text {
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  `],})
export class GalleryQueryMapComponent implements AfterViewInit, OnChanges {
  @ViewChild('mapContainer') private mapContainer!: ElementRef;
  
  artworks = input.required<ArtWork[]>();
  selectedTags = input<Set<string>>(new Set());
  activeCategory = input<'all' | 'genai' | 'photography'>('all');
  
  tagToggle = output<string>();
  artworkSelected = output<ArtWork>();

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
      const arts = this.artworks();
      this.activeCategory();
      this.selectedTags();
      if (this.isInitialized && arts) {
        untracked(() => this.renderMap());
      }
    });
  }

  ngAfterViewInit(): void {
    this.isInitialized = true;
    this.renderMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isInitialized && (
      changes['artworks'] || 
      changes['activeCategory'] || 
      changes['selectedTags']
    )) {
      this.renderMap();
    }
  }

  private renderMap(): void {
    if (!this.mapContainer) return;
    
    d3.select(this.mapContainer.nativeElement).select('svg').remove();

    const container = this.mapContainer.nativeElement;
    const width = container.offsetWidth || 500;
    const height = container.offsetHeight || 350;

    // Filter artworks by category
    const filteredArts = this.artworks().filter(art => {
      if (this.activeCategory() === 'all') return true;
      return art.category === this.activeCategory();
    });

    const nodes: QueryNode[] = [];
    const links: QueryLink[] = [];
    const addedNodes = new Set<string>();

    // 1. Gather all tags from the filtered artworks
    const uniqueTags = new Set<string>();
    filteredArts.forEach(art => art.tags.forEach(t => uniqueTags.add(t)));

    // 2. Add Tag Nodes
    uniqueTags.forEach(tag => {
      const tagId = `tag-${tag.toLowerCase()}`;
      const isSelected = this.selectedTags().has(tag);
      nodes.push({
        id: tagId,
        text: `#${tag}`,
        type: 'tag',
        color: isSelected ? 'var(--secondary-color)' : '#000000',
        radius: isSelected ? 18 : 14
      });
      addedNodes.add(tagId);
    });

    // 3. Add Artwork Nodes & Links
    filteredArts.forEach(art => {
      const artId = `art-${art.id}`;
      nodes.push({
        id: artId,
        text: art.title,
        type: 'artwork',
        color: 'var(--primary-color)',
        radius: 12,
        image: art.image,
        rawItem: art
      });
      addedNodes.add(artId);

      // Link Artwork -> Tags
      art.tags.forEach(tag => {
        const tagId = `tag-${tag.toLowerCase()}`;
        if (addedNodes.has(tagId)) {
          links.push({
            source: artId,
            target: tagId
          });
        }
      });
    });

    if (nodes.length === 0) return;

    this.simulation = d3.forceSimulation(nodes)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(70))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius(25));

    this.svg = d3.select(container).append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", [0, 0, width, height]);

    this.zoomBehavior = d3.zoom()
        .scaleExtent([0.2, 4])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on("zoom", (event: any) => {
          g.attr("transform", event.transform);
        });

    this.svg.call(this.zoomBehavior);
    const g = this.svg.append("g");

    // Draw Links
    const link = g.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("class", "map-link");

    // Draw Nodes
    const node = g.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("class", (d: any) => `map-node ${d.type}-node`)
        .attr("tabindex", "0")
        .attr("role", "button")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on("click", (event: any, d: any) => this.handleNodeClick(event, d, node, link))
        .call(this.drag(this.simulation));

    node.append("circle")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("r", (d: any) => d.radius)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("fill", (d: any) => d.type === 'tag' ? d.color : 'url(#pattern-' + d.id + ')');

    // Add patterns for artwork image fills
    const defs = this.svg.append("defs");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nodes.filter((n: any) => n.type === 'artwork').forEach((n: any) => {
      const pattern = defs.append("pattern")
        .attr("id", 'pattern-' + n.id)
        .attr("width", 1)
        .attr("height", 1)
        .attr("patternContentUnits", "objectBoundingBox");
      
      pattern.append("image")
        .attr("href", n.image)
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 1)
        .attr("height", 1)
        .attr("preserveAspectRatio", "xMidYMid slice");
    });

    node.append("text")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("dy", (d: any) => d.radius + 12)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .text((d: any) => d.type === 'tag' ? d.text : d.text.length > 15 ? d.text.substring(0, 12) + '...' : d.text)
        .clone(true).lower()
        .attr("stroke", "black")
        .attr("stroke-width", "3px");

    // Dynamic coloring matching state changes
    this.updateHighlighting(node, link);

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
  private updateHighlighting(nodeSelection: any, linkSelection: any): void {
    const activeTags = this.selectedTags();
    if (activeTags.size === 0) {
      nodeSelection.classed('dimmed', false).classed('highlighted', false);
      linkSelection.classed('highlighted', false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nodeSelection.classed('highlighted', (n: any) => {
      if (n.type === 'tag') return activeTags.has(n.text.substring(1));
      return false;
    });

    // Dim nodes that don't match any active tag
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nodeSelection.classed('dimmed', (n: any) => {
      if (n.type === 'tag') return !activeTags.has(n.text.substring(1));
      // Artwork matches if it has AT LEAST one active tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return !n.rawItem?.tags.some((t: string) => activeTags.has(t));
    });

    // Highlight links connected to active tags
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    linkSelection.classed('highlighted', (l: any) => {
      const sourceTag = l.source.type === 'tag' ? l.source.text.substring(1) : null;
      const targetTag = l.target.type === 'tag' ? l.target.text.substring(1) : null;
      return (sourceTag && activeTags.has(sourceTag)) || (targetTag && activeTags.has(targetTag));
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleNodeClick(event: any, d: any, nodeSelection: any, linkSelection: any): void {
    event.stopPropagation();
    
    if (d.type === 'tag') {
      const tagName = d.text.substring(1); // remove '#'
      this.tagToggle.emit(tagName);
    } else if (d.type === 'artwork' && d.rawItem) {
      this.artworkSelected.emit(d.rawItem);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private drag(simulation: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.2).restart();
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

  public resetZoom(): void {
    if (this.svg && this.zoomBehavior) {
      this.svg.transition().duration(500).call(this.zoomBehavior.transform, d3.zoomIdentity);
    }
  }

  public zoomIn(): void {
    if (this.svg && this.zoomBehavior) {
      this.svg.transition().duration(200).call(this.zoomBehavior.scaleBy, 1.25);
    }
  }

  public zoomOut(): void {
    if (this.svg && this.zoomBehavior) {
      this.svg.transition().duration(200).call(this.zoomBehavior.scaleBy, 1/1.25);
    }
  }
}
