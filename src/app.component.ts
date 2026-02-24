import { Component, inject, signal, computed, OnDestroy, effect } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SwUpdate, VersionReadyEvent, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { GeminiService } from './services/gemini.service';
import { StorageService, Theme } from './services/storage.service';
import { CreativeStrategy, InsightItem, InsightResult, SavedInsight, STRATEGIES, CarePlan, SavedCarePlan, StructuredProblem } from './models/creative-types';
import { IconComponent } from './components/ui/icon.component';
import { MedicalDataCardComponent } from './components/ui/medical-data-card.component';
import { HelpComponent } from './components/ui/help.component';
import { GraphViewComponent } from './components/ui/graph-view.component';
import { VitalsService } from './services/vitals.service';

interface CareRole {
  name: string;
  gist: string;
  icon: string;
}

const CARE_ROLES: CareRole[] = [
  { 
    name: 'Bedside Nurse', 
    icon: 'user-check',
    gist: 'Focus on immediate, practical actions. Frame insights as clear, compassionate steps a nurse can take at the bedside to improve the person\'s comfort, safety, and understanding within the next 8 hours. Think about physical comfort, clear communication, and anticipating immediate needs.' 
  },
  { 
    name: 'Case Manager', 
    icon: 'clipboard-list',
    gist: 'Adopt a long-term, holistic view of the person\'s care journey. Frame insights as ways to improve transitions of care, connect with community resources for ongoing support, and streamline communication between different providers to ensure a seamless, supportive experience.' 
  },
  { 
    name: 'Systems Theorist', 
    icon: 'activity',
    gist: 'Think about the big picture and interconnectedness. Frame insights by identifying feedback loops (e.g., how pain affects sleep, which affects mood) and leverage points where a small change can create a large positive ripple effect throughout the person\'s whole well-being.' 
  },
  { 
    name: 'Dietitian', 
    icon: 'utensils-crossed',
    gist: 'Focus on the healing and empowering role of nutrition. Frame insights as simple, culturally-aware dietary adjustments, positive educational points about food, and creative ways to make nutritious eating more accessible, enjoyable, and sustainable for the person.' 
  },
  { 
    name: 'Physical Therapist', 
    icon: 'move',
    gist: 'Prioritize movement, function, and building confidence. Frame insights as safe, progressive exercises, motivational techniques that celebrate small victories, and adaptive strategies to help the person confidently regain independence and engage in meaningful daily activities.' 
  },
  { 
    name: 'Activity Director', 
    icon: 'smile',
    gist: 'Focus on enriching the person\'s daily life through social and cognitive engagement. Frame insights as joyful and purposeful activities (group or individual) that can improve mood, foster social connections, and gently stimulate memory and cognitive function.' 
  },
  { 
    name: 'Social Worker', 
    icon: 'heart',
    gist: 'Focus on the person\'s entire support system and emotional well-being. Frame insights as ways to strengthen their social safety net, connect them with support systems, address emotional needs, and empower them and their family to navigate complex resources.' 
  },
  { 
    name: 'Patient Advocate', 
    icon: 'shield-check',
    gist: 'Champion the person and their family\'s perspective. Frame insights as clear questions they can ask their care team, strategies to ensure their voice is heard and respected, and ways to make sure their personal goals are always at the absolute center of the care plan.' 
  },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, MedicalDataCardComponent, HelpComponent, GraphViewComponent],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnDestroy {
  private geminiService = inject(GeminiService);
  // FIX: Explicitly type `location` to avoid type inference issues with the global `Location` type.
  private location: Location = inject(Location);
  // FIX: Explicitly type `swUpdate` as `SwUpdate | null` because it's injected optionally.
  private swUpdate: SwUpdate | null = inject(SwUpdate, { optional: true });
  public storageService = inject(StorageService);
  private vitalsService = inject(VitalsService);

  // View State
  currentView = signal<'generator' | 'saved' | 'help'>('generator');
  appMode = signal<'creative' | 'care'>('creative');
  isUpdateAvailable = signal(false);
  theme = signal<Theme>('dark');

  // Generator State
  problemInput = signal('');
  gistInput = signal('');
  availableStrategies = signal<CreativeStrategy[]>(STRATEGIES);
  selectedStrategyIds = signal<Set<string>>(new Set());
  copiedId = signal<string | null>(null);

  // Results
  insights = signal<InsightResult[] | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  structuredProblem = signal<StructuredProblem | null>(null);
  resultsViewMode = signal<'list' | 'graph'>('list');

  // Loading animation state
  suggestedInsight = signal('');
  private suggestionInterval: ReturnType<typeof setInterval> | null = null;
  private suggestionIndex = 0;
  private readonly CREATIVE_MODE_SUGGESTIONS = [
    'Consulting the muses...',
    'Gathering cosmic dust...',
    'Shaking the possibilities...',
    'Peering into the future...',
    'Distilling pure inspiration...',
    'Aligning the creative stars...',
    'Tuning into the right frequency...',
    'Brewing a potent idea...',
  ];
  private readonly CARE_MODE_SUGGESTIONS = [
    'Reviewing care pathways...',
    'Synthesizing health data...',
    'Consulting evidence-based practices...',
    'Formulating holistic approaches...',
    'Cross-referencing care models...',
    'Prioritizing personal safety...',
    'Developing a collaborative plan...',
    'Focusing on person-centered goals...',
  ];

  // Care Plan State
  carePlan = signal<CarePlan | null>(null);
  isGeneratingCarePlan = signal(false);
  isCarePlanCopied = signal(false);
  careRoles = signal<CareRole[]>(CARE_ROLES);
  activeCareRole = signal<string | null>(null);

  // Saved Items State
  sortOrder = signal<'newest' | 'oldest'>('newest');
  collapsedStates = signal<Map<string, boolean>>(new Map());

  private destroy$ = new Subject<void>();

  constructor() {
    // Service worker updates
    // FIX: Use `this.swUpdate && this.swUpdate.isEnabled` for a more robust type guard.
    if (this.swUpdate && this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.pipe(
        // FIX: Explicitly type `evt` as `VersionEvent` to fix a type inference issue where it was being inferred as `unknown`.
        filter((evt: VersionEvent): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
        takeUntil(this.destroy$)
      ).subscribe(() => this.isUpdateAvailable.set(true));
    }

    // App Mode routing
    const path = this.location.path();
    const initialMode = path.includes('care') ? 'care' : 'creative';
    this.appMode.set(initialMode);
    this.reset();

    this.location.onUrlChange(url => {
      const newMode = url.includes('care') ? 'care' : 'creative';
      if (this.appMode() !== newMode) {
        this.appMode.set(newMode);
        this.reset();
      }
    });
    
    // Theme initialization
    this.theme.set(this.storageService.getTheme());

    // Effect to apply theme class to document
    effect(() => {
      const currentTheme = this.theme();
      const body = document.documentElement;
      if (currentTheme === 'light') {
        body.classList.add('light-theme');
      } else {
        body.classList.remove('light-theme');
      }
      // Also update meta theme-color for browser UI consistency
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', currentTheme === 'light' ? '#FDF5E6' : '#24211c');
    });
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
      const newTheme = current === 'light' ? 'dark' : 'light';
      this.storageService.saveTheme(newTheme);
      return newTheme;
    });
  }
  
  // Computed Signals
  isGenerateDisabled = computed(() => this.problemInput().trim().length < 5 || this.isLoading());
  selectedStrategiesCount = computed(() => this.selectedStrategyIds().size);
  
  problemInputAriaLabel = computed(() => {
    return this.appMode() === 'creative' 
      ? 'Describe your challenge, idea, or question' 
      : 'Describe a de-identified health goal or support challenge';
  });
  
  generateButtonText = computed(() => {
    const count = this.selectedStrategiesCount();
    if (count > 0) {
      return `Generate with ${count} ${count === 1 ? 'Strategy' : 'Strategies'}`;
    }
    return 'Generate with a Random Trio';
  });

  generateButtonIcon = computed(() => {
    return this.selectedStrategiesCount() > 0 ? 'sparkles' : 'dice';
  });
  
  savedCount = computed(() => this.storageService.savedItems().length);
  
  sortedSavedItems = computed(() => {
    const items = [...this.storageService.savedItems()];
    return items.sort((a, b) => this.sortOrder() === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);
  });

  savedInsightsForCurrentProblem = computed(() => {
    const allSaved = this.storageService.savedItems();
    const currentInsights = this.insights();
    if (!currentInsights || !this.problemInput()) return [];

    const onScreenTexts = new Set(currentInsights.flatMap(r => (r.insights || []).map(item => item.text)));
    const allInsightItems = allSaved.filter((i): i is SavedInsight => i.type === 'insight');
    
    // Find saved insights that match the current problem and are currently displayed on screen.
    return allInsightItems.filter(s => s.problem === this.problemInput() && onScreenTexts.has(s.text));
  });

  isCarePlanSaved = computed(() => {
    const currentPlan = this.carePlan();
    if (!currentPlan) return false;
    const savedPlans = this.storageService.savedItems().filter((i): i is SavedCarePlan => i.type === 'care-plan');
    const currentPlanString = JSON.stringify(currentPlan);
    return savedPlans.some(saved => JSON.stringify(saved.plan) === currentPlanString);
  });

  getCarePlanSections(plan: CarePlan | null) {
    if (!plan) return [];
    
    const sections = [
      { title: "Person's Goal", items: [plan.personGoal], icon: 'heart-pulse' },
      { title: 'Key Interventions', items: plan.keyInterventions, icon: 'check' },
      { title: 'Monitoring Plan', items: plan.monitoringPlan, icon: 'eye' },
      { title: 'Guidance & Education', items: plan.guidanceAndEducation, icon: 'brain' },
      { title: 'Positive Achievements', items: plan.positiveAchievements, icon: 'sparkles' },
      { title: 'Recommendations', items: plan.recommendations, icon: 'arrow-up' },
    ];

    return sections
      .filter(section => section.items && section.items.length > 0 && !(section.items.length === 1 && !section.items[0]))
      .map(section => ({ ...section, id: 'care-plan-section-' + section.title.toLowerCase().replace(/\s+/g, '-') }));
  }

  // --- UI Methods ---
  setView(view: 'generator' | 'saved' | 'help') { this.currentView.set(view); }
  navigateTo(mode: 'creative' | 'care') {
    if (this.appMode() !== mode) {
      this.location.go(`/${mode}`);
      this.appMode.set(mode);
      this.reset();
    }
  }

  toggleStrategy(id: string) {
    this.selectedStrategyIds.update(current => {
      const newSet = new Set(current);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }
  isStrategySelected = (id: string): boolean => this.selectedStrategyIds().has(id);
  selectAllStrategies = () => this.selectedStrategyIds.set(new Set(this.availableStrategies().map(s => s.id)));
  clearSelection = () => this.selectedStrategyIds.set(new Set());

  setCareRole(role: CareRole): void {
    if (this.activeCareRole() === role.name) {
      this.activeCareRole.set(null);
      this.gistInput.set('');
    } else {
      this.activeCareRole.set(role.name);
      this.problemInput.set(this.problemInput() + '\n\n' + role.gist);
    }
  }
  clearActiveRole = () => this.activeCareRole.set(null);

  // --- Core Generation Logic ---
  async generateInsights() {
    if (!this.problemInput().trim()) return;

    this.isLoading.set(true);
    this.startSuggestionCycle();
    this.error.set(null);
    this.insights.set(null);
    this.carePlan.set(null);
    this.structuredProblem.set(null);
    this.resultsViewMode.set('list');

    const targetStrategies = this.selectedStrategyIds().size === 0
      ? [...this.availableStrategies()].sort(() => 0.5 - Math.random()).slice(0, 3)
      //? this.availableStrategies()
      : this.availableStrategies().filter(s => this.selectedStrategyIds().has(s.id));

    try {
      const mode = this.appMode();
      const problem = this.problemInput();
      
      const promises: Promise<any>[] = [
        this.geminiService.generateInsights(problem, targetStrategies, mode, this.gistInput())
      ];

      if (mode === 'care') {
        promises.push(this.geminiService.structureHealthGoal(problem).then(struct => this.structuredProblem.set(struct)));
      }

      const results = await promises[0] as InsightResult[]; // Wait primarily for insights
      this.insights.set(results);
      
      // Ensure other promises complete (optional, could just let them settle)
      await Promise.allSettled(promises.slice(1));
      
    } catch (err) {
      this.error.set('Failed to generate insights. Please try again later.');
      console.error(err);
    } finally {
      this.isLoading.set(false);
      this.stopSuggestionCycle();
    }
  }

  reset = () => {
    this.insights.set(null);
    this.problemInput.set('');
    this.gistInput.set('');
    this.clearSelection();
    this.carePlan.set(null);
    this.error.set(null);
    this.activeCareRole.set(null);
    this.structuredProblem.set(null);
    this.resultsViewMode.set('list');
    this.geminiService.clearCache();
    this.vitalsService.clearHistory();
  }
  
  editQuery = () => { 
    this.insights.set(null); 
    this.error.set(null); 
    this.carePlan.set(null); 
    this.structuredProblem.set(null);
    this.resultsViewMode.set('list');
  }

  private startSuggestionCycle() {
    this.suggestionIndex = 0;
    const suggestions = this.appMode() === 'care' ? this.CARE_MODE_SUGGESTIONS : this.CREATIVE_MODE_SUGGESTIONS;
    
    this.suggestedInsight.set(suggestions[0]);
    this.suggestionInterval = setInterval(() => {
      this.suggestionIndex = (this.suggestionIndex + 1) % suggestions.length;
      this.suggestedInsight.set('');
      setTimeout(() => this.suggestedInsight.set(suggestions[this.suggestionIndex]), 50);
    }, 2500);
  }
  private stopSuggestionCycle() {
    if (this.suggestionInterval) clearInterval(this.suggestionInterval);
    this.suggestionInterval = null;
    this.suggestedInsight.set('');
  }

  // --- Care Plan Logic ---
  async generateCarePlan() {
    const insights = this.savedInsightsForCurrentProblem();
    if (insights.length === 0) return;

    this.isGeneratingCarePlan.set(true);
    this.carePlan.set(null);
    this.error.set(null);

    try {
        const plan = await this.geminiService.generateCarePlan(this.problemInput(), insights);
        this.carePlan.set(plan);
    } catch (err) {
        this.error.set('Failed to generate care plan.');
        console.error(err);
    } finally {
        this.isGeneratingCarePlan.set(false);
    }
  }

  private formatCarePlanForClipboard(plan: CarePlan, problem: string): string {
    const formatSection = (title: string, content: string | string[]) => 
      `## ${title}\n${Array.isArray(content) && content.length ? content.map(item => `- ${item}`).join('\n') : content || 'N/A'}\n`;

    return `Care Plan\n==================\n\nProblem: ${problem}\n\n` +
           formatSection("Person's Goal", plan.personGoal) +
           formatSection("Key Interventions", plan.keyInterventions) +
           formatSection("Monitoring Plan", plan.monitoringPlan) +
           formatSection("Guidance & Education", plan.guidanceAndEducation) +
           formatSection("Positive Achievements", plan.positiveAchievements) +
           formatSection("Recommendations", plan.recommendations);
  }

  copyCarePlan(plan?: CarePlan, problem?: string) {
    const p = plan || this.carePlan();
    const id = (plan && problem) ? `saved-care-plan-${problem}` : 'current-care-plan';
    if (!p) return;
    const text = this.formatCarePlanForClipboard(p, problem || this.problemInput());
    navigator.clipboard.writeText(text.trim()).then(() => {
        this.isCarePlanCopied.set(true);
        this.copiedId.set(id);
        setTimeout(() => {
            this.isCarePlanCopied.set(false);
            if (this.copiedId() === id) this.copiedId.set(null);
        }, 2000);
    }).catch(err => console.error('Failed to copy care plan: ', err));
  }
  printPlan = () => window.print();

  // --- Generic Actions ---
  copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedId.set(id);
      setTimeout(() => { if (this.copiedId() === id) this.copiedId.set(null); }, 2000);
    }).catch(err => console.error('Failed to copy text: ', err));
  }
  applyDataContext = (context: string) => this.problemInput.update(c => `${context}${c.trim() ? '\n\n' : ''}${c}`);
  
  // --- Save/Delete Logic ---
  toggleInsightSave(item: InsightItem, strategyName: string) {
    const existing = this.findSavedInsight(item.text);
    if (existing) {
      this.storageService.removeItem(existing.id);
    } else {
      const newInsight: SavedInsight = {
        type: 'insight', 
        id: crypto.randomUUID(), 
        text: item.text,
        strategyName: this.findStrategy(strategyName)?.name || strategyName,
        problem: this.problemInput(),
        ...(this.appMode() === 'care' && { structuredProblem: this.structuredProblem() ?? undefined }),
        timestamp: Date.now()
      };
      this.storageService.saveItem(newInsight);
    }
  }

  saveCarePlan() {
    const plan = this.carePlan();
    if (!plan || this.isCarePlanSaved()) return;
    const newPlan: SavedCarePlan = {
      type: 'care-plan', 
      id: crypto.randomUUID(), 
      plan: plan,
      problem: this.problemInput(),
      ...(this.appMode() === 'care' && { structuredProblem: this.structuredProblem() ?? undefined }),
      timestamp: Date.now()
    };
    this.storageService.saveItem(newPlan);
  }

  deleteItem = (id: string) => this.storageService.removeItem(id);
  toggleSort = () => this.sortOrder.update(o => o === 'newest' ? 'oldest' : 'newest');
  isInsightSaved = (text: string): boolean => !!this.findSavedInsight(text);
  private findSavedInsight = (text: string): SavedInsight | undefined => 
    this.storageService.savedItems().find((i): i is SavedInsight => i.type === 'insight' && i.text === text);

  toggleCollapse = (id: string) => this.collapsedStates.update(m => new Map(m).set(id, !m.get(id)));
  isCollapsed = (id: string): boolean => !this.collapsedStates().get(id);

  // --- Helpers ---
  getStrategyId(name: string): string {
    // Replaces spaces and apostrophes to create a CSS-friendly ID
    return name.toLowerCase().replace('’', '').replace(/\s+/g, '-');
  }

  private findStrategy = (name: string): CreativeStrategy | undefined => 
    this.availableStrategies().find(s => s.name === name || s.careModeName === name);

  getStrategyIcon = (name: string): string => this.findStrategy(name)?.icon || 'sparkles';
  formatDate = (ts: number): string => new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });

  /**
   * Creates a descriptive and truncated ARIA label for an interactive element.
   * @param prefix A short, actionable prefix (e.g., "Copy insight").
   * @param content The dynamic content to include in the label.
   * @param maxLength The maximum length of the content part.
   * @returns A formatted string for use in an aria-label attribute.
   */
  formatAriaLabel(prefix: string, content: string, maxLength = 50): string {
    const truncatedContent = content.length > maxLength 
      ? content.substring(0, maxLength - 3) + '...' 
      : content;
    return `${prefix}: "${truncatedContent}"`;
  }
}
