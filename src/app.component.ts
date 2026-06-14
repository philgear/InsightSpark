import { Component, inject, signal, computed, OnDestroy, effect, untracked } from '@angular/core';
import { LojongCleansingComponent } from './components/ui/lojong-cleansing.component';
import { IconComponent } from './components/ui/icon.component';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SwUpdate, VersionReadyEvent, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { GeminiService } from './services/gemini.service';
import { StorageService, Theme, BgTheme } from './services/storage.service';
import { Project, Lesson, PROJECTS, LESSONS, DISCIPLINES, TECHNOLOGIES } from './models/portfolio-data';
import { HelpComponent } from './components/ui/help.component';
import { GraphViewComponent } from './components/ui/graph-view.component';
import { LessonBrowserComponent } from './components/ui/lesson-browser.component';
import { LessonDetailComponent } from './components/ui/lesson-detail.component';
import { CurriculumService } from './services/curriculum.service';
import { ExpertiseComponent } from './components/ui/expertise.component';
import { PROFILE, ARTWORKS, SKILLS, CERTIFICATIONS, EXPERIENCES, ArtWork, Skill, Certification, Experience } from './models/skills-data';
import { GalleryQueryMapComponent } from './components/ui/gallery-query-map.component';

interface Gear {
  id: number;
  x: number;
  y: number;
  teeth: number;
  radius: number;
  viewBox: string;
  path: string;
  direction: 'clockwise' | 'counter';
  speed: number;
  startX: number;
  startY: number;
}

interface TempGear {
  x: number;
  y: number;
  r: number;
  direction: 'clockwise' | 'counter';
  teeth: number;
  spokeType: number;
}

interface LiquidDrop {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  vy: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LojongCleansingComponent, IconComponent, CommonModule, 
    FormsModule, 
    HelpComponent, 
    GraphViewComponent, 
    LessonBrowserComponent,
    LessonDetailComponent,
    ExpertiseComponent,
    GalleryQueryMapComponent],  templateUrl: './app.component.html',
})
export class AppComponent implements OnDestroy {
  private geminiService = inject(GeminiService);
  private location: Location = inject(Location);
  private swUpdate: SwUpdate | null = inject(SwUpdate, { optional: true });
  public storageService = inject(StorageService);
  public curriculumService = inject(CurriculumService);

  // View State
  currentView = signal<'generator' | 'saved' | 'help' | 'teaching' | 'portfolio' | 'galleries' | 'bio' | 'contact'>('generator');
  isUpdateAvailable = signal(false);
  theme = signal<Theme>('dark');
  logoPath = computed(() => this.theme() === 'dark' ? '/assets/logo-dark.png' : '/assets/logo-light.png');

  // Profile data exposure
  profile = PROFILE;
  artworks = ARTWORKS;

  // Curated Galleries State
  selectedGalleryCategory = signal<'all' | 'genai' | 'photography'>('all');
  selectedGalleryTags = signal<Set<string>>(new Set());
  selectedLightboxArtwork = signal<ArtWork | null>(null);
  expandedArtworkId = signal<string | null>(null);
  gallerySearchQuery = signal('');

  // Contact Form State
  contactName = signal('');
  contactEmail = signal('');
  contactMessage = signal('');
  contactSuccess = signal(false);
  contactLoading = signal(false);

  // Sandbox Interactive States
  activeSandboxProjectId = signal<string | null>(null);
  selectedProjectId = signal<string | null>(null);

  collapsedStates = signal<Map<string, boolean>>(new Map());

  // Fluid Dynamics parameters
  fluidFriction = signal(0.98);
  
  // 1. Gears Sandbox
  gearTeeth = signal(24);
  gearSpeed = signal(2);
  gearIsRunning = signal(true);

  // 2. Audio Synth Sandbox
  synthOscType = signal<'sine' | 'square' | 'sawtooth' | 'triangle'>('sine');
  synthFrequency = signal(440);
  synthIsPlaying = signal(false);
  private audioCtx: AudioContext | null = null;
  private oscNode: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;

  // 3. A11y Assistant Sandbox
  simulatedSpeechText = signal('');
  isHighContrastSimulated = signal(false);
  isLowVisionSimulated = signal(false);

  // 4. GenAI Weaver Sandbox
  weaverPrompt = signal('Designing circular systems for graphic posters');
  weaverStreamingText = signal('');
  weaverIsStreaming = signal(false);

  // New Showcase Filter State
  problemInput = signal(''); // Search input query
  selectedDisciplines = signal<Set<string>>(new Set());
  selectedTechnologies = signal<Set<string>>(new Set());
  selectedLesson = signal<Lesson | null>(null);
  
  // Cognitive Science Integration State
  isReframing = signal(false);
  reframedResult = signal<{ habitualPath: string; alternativePath: string; explanation: string } | null>(null);
  activeChunkProjectId = signal<string | null>(null);
  activeDocProjectId = signal<string | null>(null);
  activeSelectedNode = signal<{
    type: 'project' | 'lesson' | 'technology' | 'discipline';
    project?: Project;
    lesson?: Lesson;
    tech?: { name: string; icon: string; color: string };
    discipline?: { name: string; icon: string; gist: string };
  } | null>(null);

  disciplines = DISCIPLINES;
  technologies = TECHNOLOGIES;
  allProjects = PROJECTS;

  // Results
  insights = signal<Project[] | null>(null); // Kept as project-results indicator
  isLoading = signal(false);
  randomBg = signal<'breathe' | 'flow' | 'move'>('move');
  bgTheme = signal<BgTheme>('none');
  error = signal<string | null>(null);
  resultsViewMode = signal<'list' | 'graph'>('graph');

  // Mathematical Gears Background State
  gears = signal<Gear[]>([]);
  crankStep = signal<number>(0);
  liquidDrops = signal<LiquidDrop[]>([]);
  liquidFillLevel = signal<number>(10);
  private animationFrameId: number | null = null;

  getGearRotation(gear: Gear): number {
    const toothAngle = 360 / gear.teeth;
    const directionSign = gear.direction === 'clockwise' ? 1 : -1;
    return this.crankStep() * toothAngle * directionSign;
  }

  startDropAnimation() {
    if (this.animationFrameId) return;
    const update = () => {
      this.liquidDrops.update(drops => {
        return drops
          .map(d => ({
            ...d,
            x: d.x - d.speed,
            y: d.y + d.vy * Math.sin(d.x / 50),
            opacity: d.opacity - 0.002
          }))
          .filter(d => d.x > -150 && d.opacity > 0);
      });
      this.animationFrameId = requestAnimationFrame(update);
    };
    this.animationFrameId = requestAnimationFrame(update);
  }

  stopDropAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  spawnDrops() {
    const newDrops: LiquidDrop[] = [];
    const rowsY = [100, 320, 540, 760, 980];
    rowsY.forEach(y => {
      const count = Math.floor(Math.random() * 2) + 2;
      for (let i = 0; i < count; i++) {
        newDrops.push({
          id: Math.random() + Date.now(),
          x: 1800 + (Math.random() - 0.5) * 80,
          y: y + (Math.random() - 0.5) * 80,
          size: Math.random() * 45 + 30,
          opacity: Math.random() * 0.4 + 0.5,
          speed: Math.random() * 1.5 + 1.2,
          vy: (Math.random() - 0.5) * 0.6
        });
      }
    });
    this.liquidDrops.update(current => [...current, ...newDrops]);
  }

  generateGearPath(numTeeth: number, spokeType: number): string {
    const module = 6;
    const pitchRadius = numTeeth * module;
    const addendum = module * 0.75;
    const dedendum = module * 0.9;
    const rOut = pitchRadius + addendum;
    const rIn = pitchRadius - dedendum;
    
    let path = '';
    const angleStep = (2 * Math.PI) / numTeeth;
    
    for (let i = 0; i < numTeeth; i++) {
      const theta0 = i * angleStep;
      const theta1 = theta0 + angleStep * 0.20;
      const theta2 = theta0 + angleStep * 0.35;
      const theta3 = theta0 + angleStep * 0.65;
      const theta4 = theta0 + angleStep * 0.80;
      
      const x1 = rOut + rIn * Math.cos(theta1);
      const y1 = rOut + rIn * Math.sin(theta1);
      
      const x2 = rOut + rOut * Math.cos(theta2);
      const y2 = rOut + rOut * Math.sin(theta2);
      
      const x3 = rOut + rOut * Math.cos(theta3);
      const y3 = rOut + rOut * Math.sin(theta3);
      
      const x4 = rOut + rIn * Math.cos(theta4);
      const y4 = rOut + rIn * Math.sin(theta4);
      
      if (i === 0) {
        path += `M ${x1.toFixed(2)} ${y1.toFixed(2)}`;
      } else {
        path += ` L ${x1.toFixed(2)} ${y1.toFixed(2)}`;
      }
      path += ` L ${x2.toFixed(2)} ${y2.toFixed(2)}`;
      path += ` L ${x3.toFixed(2)} ${y3.toFixed(2)}`;
      path += ` L ${x4.toFixed(2)} ${y4.toFixed(2)}`;
    }
    path += ' Z';
    
    const cx = rOut;
    const cy = rOut;
    
    if (spokeType === 0) {
      const numHoles = 5;
      const holeRadius = pitchRadius * 0.18;
      const dist = pitchRadius * 0.55;
      for (let h = 0; h < numHoles; h++) {
        const a = (h * 2 * Math.PI) / numHoles;
        const hx = cx + dist * Math.cos(a);
        const hy = cy + dist * Math.sin(a);
        path += ` M ${hx.toFixed(2)} ${(hy - holeRadius).toFixed(2)}`;
        path += ` A ${holeRadius.toFixed(2)} ${holeRadius.toFixed(2)} 0 1 0 ${hx.toFixed(2)} ${(hy + holeRadius).toFixed(2)}`;
        path += ` A ${holeRadius.toFixed(2)} ${holeRadius.toFixed(2)} 0 1 0 ${hx.toFixed(2)} ${(hy - holeRadius).toFixed(2)} Z`;
      }
      const shaftR = pitchRadius * 0.15;
      path += ` M ${cx.toFixed(2)} ${(cy - shaftR).toFixed(2)}`;
      path += ` A ${shaftR.toFixed(2)} ${shaftR.toFixed(2)} 0 1 0 ${cx.toFixed(2)} ${(cy + shaftR).toFixed(2)}`;
      path += ` A ${shaftR.toFixed(2)} ${shaftR.toFixed(2)} 0 1 0 ${cx.toFixed(2)} ${(cy - shaftR).toFixed(2)} Z`;
    } else if (spokeType === 1) {
      const numSpokes = 3;
      const hubR = pitchRadius * 0.28;
      const rimR = pitchRadius * 0.78;
      const spokeWidthAngle = 0.20;
      for (let s = 0; s < numSpokes; s++) {
        const baseA = (s * 2 * Math.PI) / numSpokes;
        const a1 = baseA + spokeWidthAngle;
        const a2 = baseA + (2 * Math.PI) / numSpokes - spokeWidthAngle;
        
        const x1 = cx + hubR * Math.cos(a1);
        const y1 = cy + hubR * Math.sin(a1);
        const x2 = cx + rimR * Math.cos(a1);
        const y2 = cy + rimR * Math.sin(a1);
        const x3 = cx + rimR * Math.cos(a2);
        const y3 = cy + rimR * Math.sin(a2);
        const x4 = cx + hubR * Math.cos(a2);
        const y4 = cy + hubR * Math.sin(a2);
        
        path += ` M ${x1.toFixed(2)} ${y1.toFixed(2)}`;
        path += ` L ${x2.toFixed(2)} ${y2.toFixed(2)}`;
        path += ` A ${rimR.toFixed(2)} ${rimR.toFixed(2)} 0 0 1 ${x3.toFixed(2)} ${y3.toFixed(2)}`;
        path += ` L ${x4.toFixed(2)} ${y4.toFixed(2)}`;
        path += ` A ${hubR.toFixed(2)} ${hubR.toFixed(2)} 0 0 0 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
      }
      const shaftR = pitchRadius * 0.15;
      path += ` M ${cx.toFixed(2)} ${(cy - shaftR).toFixed(2)}`;
      path += ` A ${shaftR.toFixed(2)} ${shaftR.toFixed(2)} 0 1 0 ${cx.toFixed(2)} ${(cy + shaftR).toFixed(2)}`;
      path += ` A ${shaftR.toFixed(2)} ${shaftR.toFixed(2)} 0 1 0 ${cx.toFixed(2)} ${(cy - shaftR).toFixed(2)} Z`;
    } else if (spokeType === 2) {
      const numSpokes = 4;
      const hubR = pitchRadius * 0.28;
      const rimR = pitchRadius * 0.78;
      const spokeWidthAngle = 0.16;
      for (let s = 0; s < numSpokes; s++) {
        const baseA = (s * 2 * Math.PI) / numSpokes;
        const a1 = baseA + spokeWidthAngle;
        const a2 = baseA + (2 * Math.PI) / numSpokes - spokeWidthAngle;
        
        const x1 = cx + hubR * Math.cos(a1);
        const y1 = cy + hubR * Math.sin(a1);
        const x2 = cx + rimR * Math.cos(a1);
        const y2 = cy + rimR * Math.sin(a1);
        const x3 = cx + rimR * Math.cos(a2);
        const y3 = cy + rimR * Math.sin(a2);
        const x4 = cx + hubR * Math.cos(a2);
        const y4 = cy + hubR * Math.sin(a2);
        
        path += ` M ${x1.toFixed(2)} ${y1.toFixed(2)}`;
        path += ` L ${x2.toFixed(2)} ${y2.toFixed(2)}`;
        path += ` A ${rimR.toFixed(2)} ${rimR.toFixed(2)} 0 0 1 ${x3.toFixed(2)} ${y3.toFixed(2)}`;
        path += ` L ${x4.toFixed(2)} ${y4.toFixed(2)}`;
        path += ` A ${hubR.toFixed(2)} ${hubR.toFixed(2)} 0 0 0 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
      }
      const shaftR = pitchRadius * 0.15;
      path += ` M ${cx.toFixed(2)} ${(cy - shaftR).toFixed(2)}`;
      path += ` A ${shaftR.toFixed(2)} ${shaftR.toFixed(2)} 0 1 0 ${cx.toFixed(2)} ${(cy + shaftR).toFixed(2)}`;
      path += ` A ${shaftR.toFixed(2)} ${shaftR.toFixed(2)} 0 1 0 ${cx.toFixed(2)} ${(cy - shaftR).toFixed(2)} Z`;
    } else {
      const numSpokes = 5;
      const hubR = pitchRadius * 0.28;
      const rimR = pitchRadius * 0.78;
      const spokeWidthAngle = 0.13;
      for (let s = 0; s < numSpokes; s++) {
        const baseA = (s * 2 * Math.PI) / numSpokes;
        const a1 = baseA + spokeWidthAngle;
        const a2 = baseA + (2 * Math.PI) / numSpokes - spokeWidthAngle;
        
        const x1 = cx + hubR * Math.cos(a1);
        const y1 = cy + hubR * Math.sin(a1);
        const x2 = cx + rimR * Math.cos(a1);
        const y2 = cy + rimR * Math.sin(a1);
        const x3 = cx + rimR * Math.cos(a2);
        const y3 = cy + rimR * Math.sin(a2);
        const x4 = cx + hubR * Math.cos(a2);
        const y4 = cy + hubR * Math.sin(a2);
        
        path += ` M ${x1.toFixed(2)} ${y1.toFixed(2)}`;
        path += ` L ${x2.toFixed(2)} ${y2.toFixed(2)}`;
        path += ` A ${rimR.toFixed(2)} ${rimR.toFixed(2)} 0 0 1 ${x3.toFixed(2)} ${y3.toFixed(2)}`;
        path += ` L ${x4.toFixed(2)} ${y4.toFixed(2)}`;
        path += ` A ${hubR.toFixed(2)} ${hubR.toFixed(2)} 0 0 0 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
      }
      const shaftR = pitchRadius * 0.15;
      path += ` M ${cx.toFixed(2)} ${(cy - shaftR).toFixed(2)}`;
      path += ` A ${shaftR.toFixed(2)} ${shaftR.toFixed(2)} 0 1 0 ${cx.toFixed(2)} ${(cy + shaftR).toFixed(2)}`;
      path += ` A ${shaftR.toFixed(2)} ${shaftR.toFixed(2)} 0 1 0 ${cx.toFixed(2)} ${(cy - shaftR).toFixed(2)} Z`;
    }
    
    return path;
  }

  initGears() {
    const generatedGears: Gear[] = [];
    const module = 6;
    const rows = 5;
    let prevRowGears: { x: number; y: number; r: number; direction: 'clockwise' | 'counter' }[] = [];
    let currentY = 100;
    
    for (let r = 0; r < rows; r++) {
      const rowGears: { x: number; y: number; r: number; direction: 'clockwise' | 'counter'; teeth: number; spokeType: number }[] = [];
      const teethChoices = [12, 16, 20, 24, 28, 32];
      
      let connectionIndexPrev = -1;
      let connectionIndexCurr = -1;
      
      if (r > 0 && prevRowGears.length > 0) {
        connectionIndexPrev = Math.floor(prevRowGears.length / 2);
        const parentGear = prevRowGears[connectionIndexPrev];
        connectionIndexCurr = 4;
        
        const connTeeth = teethChoices[Math.floor(Math.random() * teethChoices.length)];
        const connR = connTeeth * module;
        const deltaX = (Math.random() - 0.5) * 50;
        const connX = parentGear.x + deltaX;
        const dist = parentGear.r + connR - 2;
        const yDiff = Math.sqrt(Math.max(0, dist * dist - deltaX * deltaX));
        currentY = parentGear.y + yDiff;
        
        const rowTeeths: number[] = [];
        for (let i = 0; i < 9; i++) {
          if (i === connectionIndexCurr) {
            rowTeeths.push(connTeeth);
          } else {
            rowTeeths.push(teethChoices[Math.floor(Math.random() * teethChoices.length)]);
          }
        }
        
        const tempGears: TempGear[] = [];
        const connDirection: 'clockwise' | 'counter' = parentGear.direction === 'clockwise' ? 'counter' : 'clockwise';
        
        tempGears[connectionIndexCurr] = {
          x: connX,
          y: currentY,
          r: connR,
          direction: connDirection,
          teeth: connTeeth,
          spokeType: Math.floor(Math.random() * 4)
        };
        
        for (let i = connectionIndexCurr - 1; i >= 0; i--) {
          const rightGear = tempGears[i + 1];
          const currTeeth = rowTeeths[i];
          const currR = currTeeth * module;
          const currX = rightGear.x - (rightGear.r + currR - 2);
          const currDir: 'clockwise' | 'counter' = rightGear.direction === 'clockwise' ? 'counter' : 'clockwise';
          tempGears[i] = {
            x: currX,
            y: currentY,
            r: currR,
            direction: currDir,
            teeth: currTeeth,
            spokeType: Math.floor(Math.random() * 4)
          };
        }
        
        for (let i = connectionIndexCurr + 1; i < 9; i++) {
          const leftGear = tempGears[i - 1];
          const currTeeth = rowTeeths[i];
          const currR = currTeeth * module;
          const currX = leftGear.x + (leftGear.r + currR - 2);
          const currDir: 'clockwise' | 'counter' = leftGear.direction === 'clockwise' ? 'counter' : 'clockwise';
          tempGears[i] = {
            x: currX,
            y: currentY,
            r: currR,
            direction: currDir,
            teeth: currTeeth,
            spokeType: Math.floor(Math.random() * 4)
          };
        }
        rowGears.push(...tempGears);
      } else {
        let lastX = -50;
        let lastDir: 'clockwise' | 'counter' = 'clockwise';
        for (let i = 0; i < 9; i++) {
          const teeth = teethChoices[Math.floor(Math.random() * teethChoices.length)];
          const rVal = teeth * module;
          const xVal = lastX + rVal - (i === 0 ? 0 : 2);
          rowGears.push({
            x: xVal,
            y: currentY,
            r: rVal,
            direction: lastDir,
            teeth: teeth,
            spokeType: Math.floor(Math.random() * 4)
          });
          lastX = xVal + rVal;
          lastDir = lastDir === 'clockwise' ? 'counter' : 'clockwise';
        }
      }
      
      prevRowGears = rowGears.map(g => ({ x: g.x, y: g.y, r: g.r, direction: g.direction }));
      
      rowGears.forEach((g, idx) => {
        const rOut = g.r + module * 0.75;
        const duration = Math.round(g.teeth * 0.8 * 10) / 10;
        const angle = Math.random() * 2 * Math.PI;
        const dist = 1200 + Math.random() * 400;
        const startX = Math.round(Math.cos(angle) * dist);
        const startY = Math.round(Math.sin(angle) * dist);
        
        generatedGears.push({
          id: r * 10 + idx,
          x: Math.round(g.x - rOut),
          y: Math.round(g.y - rOut),
          teeth: g.teeth,
          radius: Math.round(rOut),
          viewBox: `0 0 ${(rOut * 2).toFixed(1)} ${(rOut * 2).toFixed(1)}`,
          path: this.generateGearPath(g.teeth, g.spokeType),
          direction: g.direction,
          speed: duration,
          startX: startX,
          startY: startY
        });
      });
    }
    
    this.gears.set(generatedGears);
  }

  // Loading animation state
  suggestedInsight = signal('');
  private suggestionInterval: ReturnType<typeof setInterval> | null = null;
  private suggestionIndex = 0;
  private readonly CREATIVE_MODE_SUGGESTIONS = [
    'Synthesizing vector systems...',
    'Compiling audio nodes...',
    'Solving Navier-Stokes fluid grid...',
    'Plotting relational graph coordinates...',
    'Evaluating modular gear tooth angles...',
    'Optimizing high-contrast theme variables...',
    'Caching Web Audio convolution buffers...',
    'Rendering canvas particle structures...'
  ];

  // Saved Items State (reused for curriculum logs)
  sortOrder = signal<'newest' | 'oldest'>('newest');
  searchQuery = signal('');
  copiedId = signal<string | null>(null);

  private destroy$ = new Subject<void>();

  constructor() {
    if (this.swUpdate && this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.pipe(
        filter((evt: VersionEvent): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
        takeUntil(this.destroy$)
      ).subscribe(() => this.isUpdateAvailable.set(true));
    }


    this.reset();
    this.startDropAnimation();
    
    this.theme.set(this.storageService.getTheme());
    this.bgTheme.set(this.storageService.getBgTheme());

    // Initialize View based on URL Path
    const initialPath = this.location.path();
    if (initialPath.startsWith('/academy')) {
      this.currentView.set('teaching');
    } else if (initialPath.startsWith('/curriculum')) {
      this.currentView.set('saved');
    } else if (initialPath.startsWith('/help')) {
      this.currentView.set('help');
    } else if (initialPath.startsWith('/galleries')) {
      this.currentView.set('galleries');
    } else if (initialPath.startsWith('/bio')) {
      this.currentView.set('bio');
    } else if (initialPath.startsWith('/contact')) {
      this.currentView.set('contact');
    } else if (initialPath.startsWith('/portfolio')) {
      this.currentView.set('generator'); // Map portfolio back to main homepage
    } else {
      this.currentView.set('generator');
    }

    // Sync view on browser back/forward buttons
    this.location.onUrlChange((url) => {
      if (url.startsWith('/academy')) {
        this.currentView.set('teaching');
      } else if (url.startsWith('/curriculum')) {
        this.currentView.set('saved');
      } else if (url.startsWith('/help')) {
        this.currentView.set('help');
      } else if (url.startsWith('/galleries')) {
        this.currentView.set('galleries');
      } else if (url.startsWith('/bio')) {
        this.currentView.set('bio');
      } else if (url.startsWith('/contact')) {
        this.currentView.set('contact');
      } else if (url.startsWith('/portfolio')) {
        this.currentView.set('generator');
      } else {
        this.currentView.set('generator');
      }
    });

    effect(() => {
      const currentTheme = this.theme();
      const body = document.documentElement;
      body.classList.remove('light-theme', 'brand-theme');
      if (currentTheme === 'light') {
        body.classList.add('light-theme');
      } else if (currentTheme === 'brand') {
        body.classList.add('brand-theme');
      }
    });

    effect(() => {
      const id = this.expandedArtworkId();
      if (id) {
        untracked(() => {
          setTimeout(() => {
            const el = document.getElementById(`artwork-card-${id}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 150);
        });
      }
    });

    effect(() => {
      this.currentView();
      this.selectedLesson();
      untracked(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      setTimeout(() => {
        this.initWaterfallObserver();
      }, 150);
    });

    setInterval(() => {
      this.crankStep.update(s => s + 1);
      this.spawnDrops();
      this.liquidFillLevel.update(level => Math.min(100, level + 5));
    }, 6000);
  }

  setBgTheme(theme: BgTheme) {
    this.bgTheme.set(theme);
    this.storageService.saveBgTheme(theme);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopSuggestionCycle();
  }

  reloadApp(): void {
    this.swUpdate?.activateUpdate().then(() => document.location.reload());
  }

  dismissUpdate(): void {
    this.isUpdateAvailable.set(false);
  }

  toggleTheme(): void {
    this.theme.update(current => {
      let newTheme: Theme = 'dark';
      if (current === 'dark') {
        newTheme = 'light';
      } else if (current === 'light') {
        newTheme = 'brand';
      } else {
        newTheme = 'dark';
      }
      this.storageService.saveTheme(newTheme);
      return newTheme;
    });
  }
  
  // Computed Showcase Project filter logic
  filteredProjects = computed<Project[]>(() => {
    let list = PROJECTS;
    const query = this.problemInput().toLowerCase().trim();
    const discs = this.selectedDisciplines();
    const techs = this.selectedTechnologies();

    if (query) {
      const keywords = query.split(/\s+/).filter(k => k.length > 0);
      list = list.filter(p => {
        return keywords.every(kw =>
          p.title.toLowerCase().includes(kw) ||
          p.description.toLowerCase().includes(kw) ||
          p.discipline.toLowerCase().includes(kw) ||
          p.technologies.some(t => t.toLowerCase().includes(kw)) ||
          p.id.toLowerCase().includes(kw)
        );
      });
    }

    if (discs.size > 0) {
      list = list.filter(p => discs.has(p.discipline));
    }

    if (techs.size > 0) {
      list = list.filter(p => p.technologies.some(t => techs.has(t)));
    }

    return list;
  });

  // Premium Interleave grid sorting
  interleavedProjects = computed<Project[]>(() => {
    const list = this.filteredProjects();
    if (list.length <= 1) return list;

    const groups: Record<string, Project[]> = {};
    list.forEach(p => {
      if (!groups[p.discipline]) {
        groups[p.discipline] = [];
      }
      groups[p.discipline].push(p);
    });

    const keys = Object.keys(groups);
    const interleaved: Project[] = [];
    let maxLen = 0;
    keys.forEach(k => {
      maxLen = Math.max(maxLen, groups[k].length);
    });

    for (let i = 0; i < maxLen; i++) {
      keys.forEach(k => {
        if (groups[k][i]) {
          interleaved.push(groups[k][i]);
        }
      });
    }

    return interleaved;
  });



  isGenerateDisabled = computed(() => {
    return this.isLoading();
  });

  generateButtonText = computed(() => {
    return 'Compile Showcase Catalog';
  });

  generateButtonIcon = computed(() => {
    return 'sparkles';
  });

  savedCount = computed(() => {
    return this.curriculumService.savedLessonIds().length;
  });

  // Dynamic interwoven lesson recommendations in Curriculum view based on project query
  recommendedLessons = computed<Lesson[]>(() => {
    const query = this.problemInput().toLowerCase().trim();
    if (!query) return [];
    const keywords = query.split(/\s+/).filter(k => k.length > 0);
    return LESSONS.filter(l => {
      return keywords.some(kw => 
        l.title.toLowerCase().includes(kw) ||
        l.description.toLowerCase().includes(kw) ||
        l.technologies.some(t => t.toLowerCase().includes(kw))
      );
    });
  });



  // Unified Navigation View Selector
  setView(view: 'generator' | 'saved' | 'help' | 'teaching' | 'portfolio' | 'galleries' | 'bio' | 'contact') {
    this.currentView.set(view);
    if (view !== 'teaching') {
      this.selectedLesson.set(null);
    }
    if (view !== 'generator' && view !== 'saved') {
      this.selectedProjectId.set(null);
      this.activeSelectedNode.set(null);
    }
    
    const viewNames: Record<string, string> = {
      generator: 'Showcase & Academy Home',
      saved: 'Curriculum & Projects Workspace',
      help: 'Help & Pro Tips',
      teaching: 'Academy Guides',
      portfolio: 'Showcase & Academy Home',
      galleries: 'Visual Art Galleries',
      bio: 'Bio & Artist Statement',
      contact: 'Contact Form'
    };
    this.curriculumService.liveAnnouncement.set(`Navigated to ${viewNames[view]} view.`);
    
    // Update URL without reloading
    const routes: Record<string, string> = {
      teaching: '/academy',
      saved: '/curriculum',
      help: '/help',
      galleries: '/galleries',
      bio: '/bio',
      contact: '/contact',
      generator: '/',
      portfolio: '/'
    };
    this.location.go(routes[view] || '/');
  }

  toggleDiscipline(name: string) {
    this.selectedDisciplines.update(current => {
      const newSet = new Set(current);
      if (newSet.has(name)) {
        newSet.delete(name);
        this.curriculumService.liveAnnouncement.set(`Discipline filter ${name} removed.`);
      } else {
        newSet.add(name);
        this.curriculumService.liveAnnouncement.set(`Discipline filter ${name} added.`);
      }
      return newSet;
    });
  }

  toggleTech(name: string) {
    this.selectedTechnologies.update(current => {
      const newSet = new Set(current);
      if (newSet.has(name)) {
        newSet.delete(name);
        this.curriculumService.liveAnnouncement.set(`Technology filter ${name} removed.`);
      } else {
        newSet.add(name);
        this.curriculumService.liveAnnouncement.set(`Technology filter ${name} added.`);
      }
      return newSet;
    });
  }

  isDisciplineSelected = (name: string): boolean => this.selectedDisciplines().has(name);
  isTechSelected = (name: string): boolean => this.selectedTechnologies().has(name);

  // Lesson Detail view project navigation
  handleViewProject(title: string) {
    this.setView('saved'); // Navigate to Curriculum view where project compiler is housed
    this.problemInput.set(title);
    this.insights.set([]); // Expose project grid
  }

  // Handle lesson start from browser
  handleSelectLesson(lesson: Lesson) {
    this.selectedLesson.set(lesson);
  }

  // Launch a lesson directly from curriculum page (bypasses browser listing)
  launchLesson(lesson: Lesson) {
    this.selectedLesson.set(lesson);
    this.setView('teaching');
  }

  getProjectLesson(projectId: string): Lesson | null {
    return LESSONS.find(l => l.relatedProjectIds.includes(projectId)) || null;
  }

  // Handle relational graph node clicks and link to detailed content / context
  handleGraphNodeSelected(event: { id: string; type: string; rawId: string }) {
    this.activeSelectedNode.set(null);

    if (event.type === 'project') {
      const proj = PROJECTS.find(p => p.id === event.rawId);
      if (proj) {
        this.activeSelectedNode.set({ type: 'project', project: proj });
        this.selectedProjectId.set(proj.id);
        // Reset sub-toggles
        this.activeChunkProjectId.set(null);
        this.activeDocProjectId.set(null);
        this.activeSandboxProjectId.set(null);
      }
    } else if (event.type === 'lesson') {
      const lesson = LESSONS.find(l => l.id === event.rawId);
      if (lesson) {
        this.activeSelectedNode.set({ type: 'lesson', lesson: lesson });
      }
    } else if (event.type === 'technology') {
      const techMatch = TECHNOLOGIES.find(t => t.name.toLowerCase().replace(/\s+/g, '-') === event.rawId || t.name === event.rawId);
      if (techMatch) {
        this.activeSelectedNode.set({ type: 'technology', tech: techMatch });
      }
    } else if (event.type === 'discipline') {
      const discMatch = DISCIPLINES.find(d => d.name.toLowerCase().replace(/\s+/g, '-') === event.rawId || d.name === event.rawId);
      if (discMatch) {
        this.activeSelectedNode.set({ type: 'discipline', discipline: discMatch });
      }
    }
  }

  // --- Core Generation Logic ---
  async generateInsights() {
    if (!this.problemInput().trim()) return;

    this.isLoading.set(true);
    this.startSuggestionCycle();
    this.error.set(null);
    this.insights.set(null);
    this.resultsViewMode.set('graph');

    this.curriculumService.liveAnnouncement.set('Compiling showcase projects catalog...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      this.insights.set([]); // Activate Showcase Grid View
      const matchCount = this.interleavedProjects().length;
      this.curriculumService.liveAnnouncement.set(`Compilation finished. Found ${matchCount} matching projects.`);
    } catch {
      this.error.set('Failed to initialize compiler.');
    } finally {
      this.isLoading.set(false);
      this.stopSuggestionCycle();
    }
  }

  reset = () => {
    this.insights.set(null);
    this.problemInput.set('');
    this.selectedDisciplines.set(new Set());
    this.selectedTechnologies.set(new Set());
    this.selectedLesson.set(null);
    this.error.set(null);
    this.resultsViewMode.set('graph');
    this.isReframing.set(false);
    this.reframedResult.set(null);
    this.activeChunkProjectId.set(null);
    this.initGears();
    this.liquidFillLevel.set(10);

    this.curriculumService.liveAnnouncement.set('Search options and filters reset.');
  }
  
  editQuery = () => { 
    this.insights.set(null); 
    this.error.set(null); 
    this.resultsViewMode.set('graph');
    this.reframedResult.set(null);
    this.liquidFillLevel.set(10);
  }

  async reframeSearchGoal() {
    const query = this.problemInput().trim();
    if (!query) return;

    this.isReframing.set(true);
    this.error.set(null);
    this.reframedResult.set(null);

    try {
      const result = await this.geminiService.reframeGoal(query);
      this.reframedResult.set(result);
    } catch (err) {
      this.error.set('Failed to reframe query with AI. Please try again.');
      console.error(err);
    } finally {
      this.isReframing.set(false);
    }
  }

  toggleProjectChunks(projectId: string) {
    this.activeChunkProjectId.update(current => current === projectId ? null : projectId);
  }

  toggleDoc(projectId: string) {
    this.activeDocProjectId.update(current => current === projectId ? null : projectId);
  }

  private startSuggestionCycle() {
    this.suggestionIndex = 0;
    const suggestions = this.CREATIVE_MODE_SUGGESTIONS;
    
    this.suggestedInsight.set(suggestions[0]);
    this.suggestionInterval = setInterval(() => {
      this.suggestionIndex = (this.suggestionIndex + 1) % suggestions.length;
      this.suggestedInsight.set('');
      setTimeout(() => this.suggestedInsight.set(suggestions[this.suggestionIndex]), 50);
    }, 2000);
  }

  private stopSuggestionCycle() {
    if (this.suggestionInterval) clearInterval(this.suggestionInterval);
    this.suggestionInterval = null;
    this.suggestedInsight.set('');
  }

  toggleSandbox(projectId: string) {
    this.activeSandboxProjectId.update(current => {
      const next = current === projectId ? null : projectId;
      // Stop audio if closing synth
      if (current === 'ambient-synth') {
        this.synthStop();
      }
      return next;
    });
  }

  // Audio Synth Logic
  synthStart() {
    if (this.synthIsPlaying()) return;
    try {
      const WebkitAudioContext = (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new (window.AudioContext || WebkitAudioContext)();
      this.oscNode = this.audioCtx.createOscillator();
      this.gainNode = this.audioCtx.createGain();
      
      this.oscNode.type = this.synthOscType();
      this.oscNode.frequency.setValueAtTime(this.synthFrequency(), this.audioCtx.currentTime);
      this.gainNode.gain.setValueAtTime(0.15, this.audioCtx.currentTime); // low volume safe limit
      
      this.oscNode.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);
      
      this.oscNode.start();
      this.synthIsPlaying.set(true);
    } catch (e) {
      console.error('Failed to init Web Audio:', e);
    }
  }

  synthUpdateFreq(event: MouseEvent) {
    if (!this.synthIsPlaying() || !this.oscNode || !this.audioCtx) return;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    
    // Scale frequency logarithmically between 110Hz and 880Hz
    const freq = Math.round(110 * Math.pow(8, pct));
    this.synthFrequency.set(freq);
    this.oscNode.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
  }

  synthUpdateOscType(type: 'sine' | 'square' | 'sawtooth' | 'triangle') {
    this.synthOscType.set(type);
    if (this.oscNode) {
      this.oscNode.type = type;
    }
  }

  synthStop() {
    if (!this.synthIsPlaying()) return;
    try {
      if (this.oscNode) {
        this.oscNode.stop();
        this.oscNode.disconnect();
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
      }
      this.oscNode = null;
      this.gainNode = null;
      this.synthIsPlaying.set(false);
    } catch (e) {
      console.error('Failed to stop Web Audio:', e);
    }
  }

  getActiveProject(projects: Project[], id: string): Project | undefined {
    return projects.find(p => p.id === id);
  }

  getGearRotationAngle(): number {
    return this.gearIsRunning() ? this.crankStep() * this.gearSpeed() * 12 : 0;
  }

  getAllGalleryTags(artworks: ArtWork[], category: 'all' | 'genai' | 'photography'): string[] {
    const list = category === 'all' ? artworks : artworks.filter(art => art.category === category);
    const tags = new Set<string>();
    list.forEach(art => art.tags.forEach(t => tags.add(t)));
    return Array.from(tags);
  }

  // A11y Speech Synth Logic
  speakA11yText(text: string) {
    this.simulatedSpeechText.set(text);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  }

  // GenAI Mock Stream Logic
  runWeaverMockStream() {
    if (this.weaverIsStreaming()) return;
    this.weaverIsStreaming.set(true);
    this.weaverStreamingText.set('');
    
    const outputTokens = [
      '{"status": "processing", ',
      '"concept": "Transmedia Orbital Circles", ',
      '"design_rationale": "Integrating high-contrast Bauhaus structures with responsive SVG vectors to simulate physical clockwork gears.", ',
      '"accessibility_compliance": "WCAG AA (contrast ratio 4.7:1), keyboard-navigable links", ',
      '"code_chunks": [{"title": "Trig Path Scheduler", "lines": 40}, {"title": "LFO Sweeper Node", "lines": 28}], ',
      '"deployment_ready": true}'
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < outputTokens.length) {
        this.weaverStreamingText.update(current => current + outputTokens[index]);
        index++;
      } else {
        clearInterval(interval);
        this.weaverIsStreaming.set(false);
      }
    }, 600);
  }

  copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedId.set(id);
      setTimeout(() => { if (this.copiedId() === id) this.copiedId.set(null); }, 2000);
    }).catch(err => console.error('Failed to copy: ', err));
  }

  // Mock method to support compilation of unused medical-data-card component
  applyDataContext(context: string) {
    console.log('applyDataContext called with context:', context);
  }

  private waterfallObserver: IntersectionObserver | null = null;

  initWaterfallObserver() {
    if (this.waterfallObserver) {
      this.waterfallObserver.disconnect();
    }

    document.body.classList.add('waterfall-enabled');

    this.waterfallObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('waterfall-active');
        } else {
          entry.target.classList.remove('waterfall-active');
        }
      });
    }, {
      rootMargin: '-20px 0px -20px 0px',
      threshold: 0.01
    });

    const items = document.querySelectorAll('.waterfall-item');
    items.forEach(item => this.waterfallObserver?.observe(item));
  }

  // computed signal for filtered artworks in galleries
  filteredGalleryArtworks = computed<ArtWork[]>(() => {
    let list = this.artworks;
    const cat = this.selectedGalleryCategory();
    const activeTags = this.selectedGalleryTags();
    const query = this.gallerySearchQuery().toLowerCase().trim();

    if (cat !== 'all') {
      list = list.filter(art => art.category === cat);
    }

    if (activeTags.size > 0) {
      list = list.filter(art => art.tags.some(tag => activeTags.has(tag)));
    }

    if (query) {
      list = list.filter(art => 
        art.title.toLowerCase().includes(query) ||
        art.description.toLowerCase().includes(query) ||
        art.tags.some(t => t.toLowerCase().includes(query)) ||
        art.stack.some(s => s.toLowerCase().includes(query))
      );
    }

    return list;
  });

  toggleGalleryTag(tag: string) {
    this.selectedGalleryTags.update(current => {
      const newSet = new Set(current);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  }

  clearGalleryTags() {
    this.selectedGalleryTags.set(new Set());
  }

  submitContactForm() {
    if (!this.contactName() || !this.contactEmail() || !this.contactMessage()) {
      return;
    }
    this.contactLoading.set(true);
    setTimeout(() => {
      this.contactLoading.set(false);
      this.contactSuccess.set(true);
      // Reset form
      this.contactName.set('');
      this.contactEmail.set('');
      this.contactMessage.set('');
    }, 1500);
  }



}
