import { Component, inject, signal, computed, OnDestroy, effect } from '@angular/core';
import { CommonModule, Location } from '@angular/common';


import { FormsModule } from '@angular/forms';
import { SwUpdate, VersionReadyEvent, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { GeminiService } from './services/gemini.service';
import { StorageService, Theme } from './services/storage.service';
import { CreativeStrategy, InsightItem, InsightResult, SavedInsight, STRATEGIES, CarePlan, SavedCarePlan, StructuredProblem, CreativePlan, SavedCreativePlan } from './models/creative-types';
import { IconComponent } from './components/ui/icon.component';
import { HelpComponent } from './components/ui/help.component';
import { GraphViewComponent } from './components/ui/graph-view.component';
import { VitalsService } from './services/vitals.service';
import { LojongCleansingComponent } from './components/ui/lojong-cleansing.component';
import { VitalsTrendGraphComponent } from './components/ui/vitals-trend-graph.component';

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
  { 
    name: 'Family Member', 
    icon: 'home',
    gist: 'Step into the shoes of a devoted, caring family member who knows this person deeply. Frame insights with warmth, personal history, and unconditional love. Think about what this person truly values, their daily rhythms, their fears and joys, and how to make support feel like connection rather than obligation.' 
  },
  { 
    name: 'Best Friend', 
    icon: 'users',
    gist: 'Speak as a trusted best friend who knows when to be honest and when to just listen. Frame insights without clinical distance — use plain, real language. Think about what this person actually needs to hear, not just what\'s medically correct. Lead with empathy, meet them where they are, and make every suggestion feel like it comes from genuine care.' 
  },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, HelpComponent, GraphViewComponent, LojongCleansingComponent, VitalsTrendGraphComponent],
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
  logoPath = computed(() => this.theme() === 'dark' ? 'assets/logo-dark.svg' : 'assets/logo-light.svg');

  // API Key State
  userApiKey = signal<string>(localStorage.getItem('user_gemini_api_key') || '');
  showKeyOverlay = computed(() => !this.userApiKey());



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

  // Health snapshot (optional — set by MedicalDataCard "Use as Context" button)
  healthSnapshot = signal<string | null>(null);

  // Loading animation state
  suggestedInsight = signal('');
  private suggestionInterval: ReturnType<typeof setInterval> | null = null;
  private suggestionIndex = 0;
  private readonly CREATIVE_MODE_SUGGESTIONS = [
    'Interrogating the obvious...',
    'Turning the question inside out...',
    'Asking what the problem is hiding...',
    'Following the strange thread...',
    'Dissolving the frame...',
    'Listening to what isn\'t there...',
    'Applying pressure to the edges...',
    'Welcoming the contradiction...',
  ];
  private readonly CARE_MODE_SUGGESTIONS = [
    'Seeing the person, not the condition...',
    'Finding what matters most to them...',
    'Listening between the lines...',
    'Tracing the path of least friction...',
    'Holding the full picture...',
    'Asking what comfort looks like today...',
    'Building the bridge one step at a time...',
    'Centering what gives them strength...',
  ];

  // Care Plan State
  carePlan = signal<CarePlan | null>(null);
  isGeneratingCarePlan = signal(false);
  isCarePlanCopied = signal(false);
  careRoles = signal<CareRole[]>(CARE_ROLES);
  activeCareRoles = signal<Set<string>>(new Set());

  // Creative Action Plan State
  creativePlan = signal<CreativePlan | null>(null);
  isGeneratingCreativePlan = signal(false);
  isCreativePlanCopied = signal(false);

  // Saved Items State
  sortOrder = signal<'newest' | 'oldest'>('newest');
  searchQuery = signal('');
  collapsedStates = signal<Map<string, boolean>>(new Map());

  // Chaos Simulation State
  chaosType = signal<'429' | '500' | 'drop' | null>(null);
  chaosBehavior = signal<'transient' | 'permanent'>('transient');

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

    // Effect to sync chaos simulation state with the service
    effect(() => {
      this.geminiService.simulatedFailureType = this.chaosType();
      this.geminiService.simulatedFailureBehavior = this.chaosBehavior();
    });


  }



  saveApiKey(key: string) {
    if (key.trim()) {
      localStorage.setItem('user_gemini_api_key', key.trim());
      this.userApiKey.set(key.trim());
    }
  }

  clearApiKey() {
    localStorage.removeItem('user_gemini_api_key');
    this.userApiKey.set('');
  }

  activateDemoMode() {
    localStorage.setItem('user_gemini_api_key', 'demo-key-active');
    this.userApiKey.set('demo-key-active');
    
    // Set presets based on current mode
    if (this.appMode() === 'creative') {
      this.problemInput.set('Designing a self-sustaining municipal park that doubles as a flood barrier and a local agricultural hub.');
      this.selectedStrategyIds.set(new Set(['butterfly', 'combinatorial', 'first-principles']));
    } else {
      this.problemInput.set('Improve daily movement and emotional connection for a 75-year-old grandmother recovering from a hip fracture who loves gardening.');
      this.selectedStrategyIds.set(new Set(['what-if', 'butterfly', 'first-principles']));
    }
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
  piiWarning = computed(() => {
    const text = this.problemInput();
    if (!text) return null;

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/;
    const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;

    const found: string[] = [];
    if (emailRegex.test(text)) found.push('email address');
    if (phoneRegex.test(text)) found.push('phone number');
    if (ssnRegex.test(text)) found.push('social security number');
    if (ipRegex.test(text)) found.push('IP address');

    if (found.length > 0) {
      return `Potential ${found.join(' and ')} detected. Under HIPAA guidelines, please de-identify your query before generating insights.`;
    }
    return null;
  });

  isGenerateDisabled = computed(() => this.problemInput().trim().length < 5 || this.isLoading() || !!this.piiWarning());
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

  filteredSavedItems = computed(() => {
    const items = this.sortedSavedItems();
    const query = this.searchQuery().toLowerCase().trim();
    
    if (!query) return items;
    
    return items.filter(item => {
      if (item.type === 'insight') {
        return item.text.toLowerCase().includes(query) || 
               item.problem.toLowerCase().includes(query) || 
               item.strategyName.toLowerCase().includes(query);
      } else if (item.type === 'care-plan') {
        return item.problem.toLowerCase().includes(query) || 
               item.plan.personGoal.toLowerCase().includes(query) ||
               item.plan.keyInterventions.some(i => i.toLowerCase().includes(query)) ||
               item.plan.monitoringPlan.some(i => i.toLowerCase().includes(query)) ||
               item.plan.guidanceAndEducation.some(i => i.toLowerCase().includes(query)) ||
               item.plan.positiveAchievements.some(i => i.toLowerCase().includes(query)) ||
               item.plan.recommendations.some(i => i.toLowerCase().includes(query));
      } else if (item.type === 'creative-plan') {
        return item.problem.toLowerCase().includes(query) || 
               item.plan.conceptualGoal.toLowerCase().includes(query) ||
               item.plan.criticalPath.some(i => i.toLowerCase().includes(query)) ||
               item.plan.riskAssessment.some(i => i.toLowerCase().includes(query)) ||
               item.plan.requiredResources.some(i => i.toLowerCase().includes(query)) ||
               item.plan.milestones.some(i => i.toLowerCase().includes(query)) ||
               item.plan.nextSteps.some(i => i.toLowerCase().includes(query));
      }
      return false;
    });
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

  isCreativePlanSaved = computed(() => {
    const currentPlan = this.creativePlan();
    if (!currentPlan) return false;
    const savedPlans = this.storageService.savedItems().filter((i): i is SavedCreativePlan => i.type === 'creative-plan');
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

  getCreativePlanSections(plan: CreativePlan | null) {
    if (!plan) return [];
    
    const sections = [
      { title: "Conceptual Goal", items: [plan.conceptualGoal], icon: 'sparkles' },
      { title: 'Critical Path', items: plan.criticalPath, icon: 'git-branch' },
      { title: 'Risk Assessment & Bottlenecks', items: plan.riskAssessment, icon: 'shield' },
      { title: 'Required Resources', items: plan.requiredResources, icon: 'collection' },
      { title: 'Milestones', items: plan.milestones, icon: 'check' },
      { title: 'Immediate Next Steps', items: plan.nextSteps, icon: 'arrow-up' },
    ];

    return sections
      .filter(section => section.items && section.items.length > 0 && !(section.items.length === 1 && !section.items[0]))
      .map(section => ({ ...section, id: 'creative-plan-section-' + section.title.toLowerCase().replace(/\s+/g, '-') }));
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
    const current = new Set(this.activeCareRoles());
    if (current.has(role.name)) {
      current.delete(role.name);
    } else {
      current.add(role.name);
    }
    this.activeCareRoles.set(current);

    // Rebuild gistInput from all selected roles
    const selected = this.careRoles().filter(r => current.has(r.name));
    this.gistInput.set(
      selected.length === 0
        ? ''
        : selected.length === 1
          ? selected[0].gist
          : `Blend the following perspectives into a single, cohesive voice:\n` +
            selected.map((r, i) => `${i + 1}. **${r.name}**: ${r.gist}`).join('\n')
    );
  }
  clearActiveRole = () => { this.activeCareRoles.set(new Set()); this.gistInput.set(''); };

  // Called by MedicalDataCardComponent when user clicks "Use as Context"
  applyDataContext = (context: string) => this.healthSnapshot.set(context);
  clearHealthSnapshot = () => this.healthSnapshot.set(null);

  // --- Core Generation Logic ---
  async generateInsights() {
    if (!this.problemInput().trim()) return;

    this.isLoading.set(true);
    this.startSuggestionCycle();
    this.error.set(null);
    this.insights.set(null);
    this.carePlan.set(null);
    this.creativePlan.set(null);
    this.structuredProblem.set(null);
    this.resultsViewMode.set('list');

    const targetStrategies = this.selectedStrategyIds().size === 0
      ? [...this.availableStrategies()].sort(() => 0.5 - Math.random()).slice(0, 3)
      //? this.availableStrategies()
      : this.availableStrategies().filter(s => this.selectedStrategyIds().has(s.id));

    try {
      const mode = this.appMode();
      const problem = this.problemInput();
      
      const promises: Promise<unknown>[] = [
        this.geminiService.generateInsights(
          problem, 
          targetStrategies, 
          mode, 
          this.gistInput() || undefined, 
          this.healthSnapshot() ?? undefined,
          (partialInsights) => {
            this.insights.set(partialInsights);
          }
        )
      ];

      if (mode === 'care') {
        promises.push(this.geminiService.structureHealthGoal(problem).then(struct => this.structuredProblem.set(struct)));
      }

      const results = await promises[0] as InsightResult[]; // Wait primarily for insights
      this.insights.set(results);
      
      // Ensure other promises complete (optional, could just let them settle)
      await Promise.allSettled(promises.slice(1));
      
    } catch (err) {
      const errMsg = (err as Error).message || 'Failed to generate insights. Please try again later.';
      this.error.set(errMsg);
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
    this.creativePlan.set(null);
    this.error.set(null);
    this.activeCareRoles.set(new Set());
    this.healthSnapshot.set(null);
    this.structuredProblem.set(null);
    this.resultsViewMode.set('list');
    this.geminiService.clearCache();
    this.vitalsService.clearHistory();
  }
  
  editQuery = () => { 
    this.insights.set(null); 
    this.error.set(null); 
    this.carePlan.set(null); 
    this.creativePlan.set(null);
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
           formatSection("Recommendations", plan.recommendations) +
           `\n— Generated via Pivot & Pulse (designed by Phil Gear), powered by Google Gemini, inspired by Edward de Bono's Lateral Thinking (CC BY-SA 4.0)`;
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
    const attributionText = `${text}\n\n— Generated via Pivot & Pulse (designed by Phil Gear), powered by Google Gemini, inspired by Edward de Bono's Lateral Thinking (CC BY-SA 4.0)`;
    navigator.clipboard.writeText(attributionText).then(() => {
      this.copiedId.set(id);
      setTimeout(() => { if (this.copiedId() === id) this.copiedId.set(null); }, 2000);
    }).catch(err => console.error('Failed to copy text: ', err));
  }


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

  // --- Creative Action Plan Logic ---
  async generateCreativePlan() {
    const insights = this.savedInsightsForCurrentProblem();
    if (insights.length === 0) return;

    this.isGeneratingCreativePlan.set(true);
    this.creativePlan.set(null);
    this.error.set(null);

    try {
        const plan = await this.geminiService.generateCreativePlan(this.problemInput(), insights);
        this.creativePlan.set(plan);
    } catch (err) {
        this.error.set('Failed to generate action plan.');
        console.error(err);
    } finally {
        this.isGeneratingCreativePlan.set(false);
    }
  }

  private formatCreativePlanForClipboard(plan: CreativePlan, problem: string): string {
    const formatSection = (title: string, content: string | string[]) => 
      `## ${title}\n${Array.isArray(content) && content.length ? content.map(item => `- ${item}`).join('\n') : content || 'N/A'}\n`;

    return `Creative Action Plan\n==================\n\nGoal: ${problem}\n\n` +
           formatSection("Conceptual Goal", plan.conceptualGoal) +
           formatSection("Critical Path", plan.criticalPath) +
           formatSection("Risk Assessment & Bottlenecks", plan.riskAssessment) +
           formatSection("Required Resources", plan.requiredResources) +
           formatSection("Milestones", plan.milestones) +
           formatSection("Immediate Next Steps", plan.nextSteps) +
           `\n— Generated via Pivot & Pulse (designed by Phil Gear), powered by Google Gemini, inspired by Edward de Bono's Lateral Thinking (CC BY-SA 4.0)`;
  }

  copyCreativePlan(plan?: CreativePlan, problem?: string) {
    const p = plan || this.creativePlan();
    const id = (plan && problem) ? `saved-creative-plan-${problem}` : 'current-creative-plan';
    if (!p) return;
    const text = this.formatCreativePlanForClipboard(p, problem || this.problemInput());
    navigator.clipboard.writeText(text.trim()).then(() => {
        this.isCreativePlanCopied.set(true);
        this.copiedId.set(id);
        setTimeout(() => {
            this.isCreativePlanCopied.set(false);
            if (this.copiedId() === id) this.copiedId.set(null);
        }, 2000);
    }).catch(err => console.error('Failed to copy creative plan: ', err));
  }

  saveCreativePlan() {
    const plan = this.creativePlan();
    if (!plan || this.isCreativePlanSaved()) return;
    const newPlan: SavedCreativePlan = {
      type: 'creative-plan', 
      id: crypto.randomUUID(), 
      plan: plan,
      problem: this.problemInput(),
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
