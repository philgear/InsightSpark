import { Component, inject, signal, computed, OnDestroy, effect } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SwUpdate, VersionReadyEvent, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { GeminiService } from './services/gemini.service';
import { StorageService, Theme } from './services/storage.service';
import { TranslationService, SUPPORTED_LANGUAGES_LIST } from './services/translation.service';
import { PocketgullIntegrationService } from './services/pocketgull-integration.service';
import { CreativeStrategy, InsightItem, InsightResult, SavedInsight, STRATEGIES, CarePlan, SavedCarePlan, StructuredProblem, CreativePlan, SavedCreativePlan, CareRole } from './models/creative-types';
import { AgenticResult, AgenticPhase, AGENTIC_PHASES } from './models/agent-types';
import { IconComponent } from './components/ui/icon.component';
import { HelpComponent } from './components/ui/help.component';
import { GraphViewComponent } from './components/ui/graph-view.component';
import { LojongCleansingComponent } from './components/ui/lojong-cleansing.component';
import { SpeechService } from './services/speech.service';

function getStoredApiKey(): string {
  let value = localStorage.getItem('spark_cfg_val');
  if (!value) {
    const oldKey = localStorage.getItem('user_gemini_api_key');
    if (oldKey) {
      value = oldKey === 'demo-key-active' ? oldKey : btoa(oldKey);
      localStorage.setItem('spark_cfg_val', value);
      localStorage.removeItem('user_gemini_api_key');
    }
  }
  if (!value) return '';
  try {
    if (value === 'demo-key-active') {
      return value;
    }
    return atob(value);
  } catch {
    return value;
  }
}

function setStoredApiKey(key: string): void {
  if (key === 'demo-key-active') {
    localStorage.setItem('spark_cfg_val', key);
  } else {
    localStorage.setItem('spark_cfg_val', btoa(key));
  }
}

function removeStoredApiKey(): void {
  localStorage.removeItem('spark_cfg_val');
  localStorage.removeItem('user_gemini_api_key');
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
  { 
    name: 'Positive Psychologist', 
    icon: 'sparkles',
    gist: 'Ground your perspective in Martin Seligman\'s UPenn Positive Psychology Center and PERMA+H framework. Focus on activating VIA character strengths (e.g. curiosity, zest, perseverance, kindness), cultivating positive emotion, discovering engagement and flow, deepening social relationships, instilling purpose and meaning, celebrating micro-masteries, and supporting physical vitality. Frame every insight as an asset-based catalyst rather than deficit remediation, using Learned Optimism (ABCDE reframing) to build enduring agency, resilience, and hope.' 
  },
  { 
    name: 'Daughter', 
    icon: 'smile', 
    gist: 'Adopt the perspective of a loving daughter who brings spontaneous joy, artistic expression, tech fluency, and gentle wonder. Suggest creative co-activities, music, playfulness, and shared laughter that brighten daily routines and strengthen emotional bonds.' 
  },
  { 
    name: 'Mother', 
    icon: 'heart', 
    gist: 'Adopt the perspective of a devoted mother who provides emotional grounding, nurturing care, and thoughtful day-to-day pacing. Focus on reducing cognitive overwhelm, creating comforting home spaces, and balancing health routines with compassion and sustainable self-care.' 
  },
  { 
    name: 'Grandmother', 
    icon: 'bookmark', 
    gist: 'Adopt the perspective of a beloved grandmother and family matriarch with deep lived wisdom. Frame insights with warmth, family traditions, heritage stories, sensory comfort, and preserving dignity and grace across the seasons of life.' 
  },
  { 
    name: 'Son', 
    icon: 'zap', 
    gist: 'Adopt the perspective of an energetic, caring son who brings active companionship, practical optimism, and hands-on help. Suggest engaging movement, playful challenges, and supportive check-ins that encourage motivation and physical vitality.' 
  },
  { 
    name: 'Father', 
    icon: 'shield-check', 
    gist: 'Adopt the perspective of a steadfast father who offers dependable support, safe physical assistance, and practical problem-solving. Focus on building confidence, steady pacing, and providing reassuring, calm guidance through life challenges.' 
  },
  { 
    name: 'Grandfather', 
    icon: 'home', 
    gist: 'Adopt the perspective of a wise grandfather and elder patriarch. Frame insights through patience, storytelling, craftsmanship or hands-on hobbies, and enduring values, offering perspective that calms anxiety and celebrates steady resilience.' 
  },
  { 
    name: 'Kinship Coordinator', 
    icon: 'users', 
    gist: 'Adopt the role of an intergenerational kinship coordinator. Harmonize the care dynamics between children, parents, and grandparents into collaborative, shared routines where every generation feels valued, supported, and connected in a unified circle of care.' 
  },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, HelpComponent, GraphViewComponent, LojongCleansingComponent],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnDestroy {
  private geminiService = inject(GeminiService);
  private location: Location = inject(Location);
  private swUpdate: SwUpdate | null = inject(SwUpdate, { optional: true });
  public storageService = inject(StorageService);
  public translationService = inject(TranslationService);
  public pocketgullService = inject(PocketgullIntegrationService);
  public speechService = inject(SpeechService);

  t(key: string): string {
    return this.translationService.t(key);
  }

  // View State
  currentView = signal<'generator' | 'saved' | 'help'>('generator');
  appMode = signal<'creative' | 'care'>('creative');
  isUpdateAvailable = signal(false);
  theme = signal<Theme>('dark');
  logoPath = computed(() => this.theme() === 'dark' ? 'assets/logo-dark.svg' : 'assets/logo-light.svg');

  // API Key State
  userApiKey = signal<string>(getStoredApiKey());
  showKeyOverlay = computed(() => !this.userApiKey());

  // On-Device AI Availability State
  chromeAiAvailable = signal<boolean>(false);
  ollamaAvailable = signal<boolean>(false);
  ollamaModels = signal<string[]>([]);
  onDeviceChecked = signal<boolean>(false);

  // ORCID Researcher Credentials
  orcidId = signal<string>(localStorage.getItem('user_orcid_id') || '');
  orcidName = signal<string>(localStorage.getItem('user_orcid_name') || '');
  orcidError = signal<string | null>(null);
  isOrcidConnecting = signal<boolean>(false);

  // Care Roles State (combines built-in CARE_ROLES + user-defined custom roles)
  careRoles = computed<CareRole[]>(() => [...CARE_ROLES, ...this.storageService.customRoles()]);
  activeCareRoles = signal<Set<string>>(new Set());

  // Custom Persona / Role Builder State
  showCustomRoleModal = signal(false);
  customRoleName = signal('');
  customRoleGist = signal('');
  customRoleIcon = signal('user-check');
  customRoleCategory = signal<'clinical' | 'support' | 'creative'>('clinical');

  // Translation State
  showTranslateModal = signal(false);
  translatingCardId = signal<string | null>(null);
  isTranslatingPlan = signal(false);
  translateTarget = signal<{
    type: 'insight' | 'care-plan' | 'creative-plan';
    item?: InsightItem;
    plan?: CarePlan | CreativePlan;
    problem?: string;
  } | null>(null);
  supportedLanguages = SUPPORTED_LANGUAGES_LIST;

  // Generator State
  problemInput = signal('');
  gistInput = signal('');
  uploadedImage = signal<{ mimeType: string; data: string; preview: string } | null>(null);
  availableStrategies = signal<CreativeStrategy[]>(STRATEGIES);
  provocationStrategies = computed(() => this.availableStrategies().filter(s => s.category !== 'anchor'));
  anchorStrategies = computed(() => this.availableStrategies().filter(s => s.category === 'anchor'));
  selectedStrategyIds = signal<Set<string>>(new Set());
  copiedId = signal<string | null>(null);

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      this.uploadedImage.set({
        mimeType: file.type,
        data: base64Data,
        preview: result
      });
    };
    reader.readAsDataURL(file);
  }

  removeUploadedImage() {
    this.uploadedImage.set(null);
  }

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

  // Creative Action Plan State
  creativePlan = signal<CreativePlan | null>(null);
  isGeneratingCreativePlan = signal(false);
  isCreativePlanCopied = signal(false);

  // Agentic Deep Analysis State
  isDeepAnalysis = signal(false);
  agenticPhase = signal<AgenticPhase | null>(null);
  agenticResult = signal<AgenticResult | null>(null);
  agenticPhases = AGENTIC_PHASES;
  isDebateCollapsed = signal(true);

  // Saved Items State
  sortOrder = signal<'newest' | 'oldest'>('newest');
  searchQuery = signal('');
  collapsedStates = signal<Map<string, boolean>>(new Map());

  // Chaos Simulation State
  chaosType = signal<'429' | '500' | 'drop' | null>(null);
  chaosBehavior = signal<'transient' | 'permanent'>('transient');

  private destroy$ = new Subject<void>();

  constructor() {
    // Check for ORCID authentication redirect callback
    const searchParams = new URLSearchParams(window.location.search);
    const orcidCode = searchParams.get('code');
    if (orcidCode) {
      this.handleOrcidCallback(orcidCode);
    }

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

    // Pocketgull Integration Subscription
    this.pocketgullService.incomingMessages$.pipe(takeUntil(this.destroy$)).subscribe(msg => {
      if (msg.type === 'SET_PROBLEM' && msg.payload) {
        if (msg.payload['problem']) this.problemInput.set(msg.payload['problem'] as string);
        if (msg.payload['mode']) this.appMode.set(msg.payload['mode'] as 'creative' | 'care');
      }
    });


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

    this.initOnDeviceDetection();
  }



  async loginWithOrcid() {
    this.orcidError.set(null);
    this.isOrcidConnecting.set(true);
    try {
      const response = await fetch('/api/config');
      const config = await response.json();
      if (!config.orcidClientId) {
        throw new Error('ORCID Client ID is not configured on the server.');
      }
      const redirectUri = window.location.origin + '/';
      const authUrl = `https://orcid.org/oauth/authorize?client_id=${config.orcidClientId}&response_type=code&scope=/authenticate&redirect_uri=${encodeURIComponent(redirectUri)}`;
      window.location.href = authUrl;
    } catch (err) {
      console.error('Failed to initiate ORCID login:', err);
      this.orcidError.set((err as Error).message || 'Failed to initialize ORCID connection.');
      this.isOrcidConnecting.set(false);
    }
  }

  logoutOrcid() {
    localStorage.removeItem('user_orcid_id');
    localStorage.removeItem('user_orcid_name');
    this.orcidId.set('');
    this.orcidName.set('');
  }

  exportDpoDataset() {
    const items = this.storageService.savedItems();
    if (!items || items.length === 0) return;
    const jsonlContent = this.geminiService.exportDpoDataset(
      items, 
      this.orcidId() || undefined, 
      this.orcidName() || undefined
    );
    const blob = new Blob([jsonlContent], { type: 'application/x-jsonlines;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pivot_pulse_dpo_preferences_${new Date().toISOString().slice(0, 10)}.jsonl`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  speakInsight(text: string, id: string) {
    const lang = this.translationService.currentLang();
    this.speechService.speak(text, id, lang === 'en' ? 'en-US' : lang);
  }

  toggleVoiceInput() {
    if (this.speechService.isListening()) {
      this.speechService.stopListening();
    } else {
      const lang = this.translationService.currentLang();
      this.speechService.startListening(
        (transcript: string) => {
          const current = this.problemInput();
          this.problemInput.set(current ? `${current} ${transcript}` : transcript);
        },
        (err: string) => {
          console.warn('Voice input notice:', err);
        },
        lang === 'en' ? 'en-US' : lang
      );
    }
  }

  printKinshipCirclePlan(plan: CarePlan | CreativePlan, problemTitle: string) {
    const isCare = this.appMode() === 'care';
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    const sectionsHtml = isCare 
      ? this.getCarePlanSections(plan as CarePlan).map(s => `
          <div style="margin-bottom: 16px; padding: 14px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff;">
            <h3 style="margin: 0 0 6px 0; color: #2d3748; font-size: 15px; font-weight: bold;">${s.title}</h3>
            <ul style="margin: 0; padding-left: 18px; color: #4a5568; font-size: 13px; line-height: 1.6;">
              ${s.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
        `).join('')
      : this.getCreativePlanSections(plan as CreativePlan).map(s => `
          <div style="margin-bottom: 16px; padding: 14px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff;">
            <h3 style="margin: 0 0 6px 0; color: #2d3748; font-size: 15px; font-weight: bold;">${s.title}</h3>
            <ul style="margin: 0; padding-left: 18px; color: #4a5568; font-size: 13px; line-height: 1.6;">
              ${s.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
        `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Family Kinship Circle Plan - ${problemTitle}</title>
          <style>
            @media print { body { padding: 0; } }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 25px; background: #fdfdfd; color: #1a202c; }
            .header { text-align: center; border-bottom: 2px dashed #cbd5e0; padding-bottom: 15px; margin-bottom: 20px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; background: #fefcbf; color: #744210; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; }
            .triad-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
            .triad-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; text-align: center; background: #f7fafc; }
            .triad-card h4 { margin: 0 0 4px 0; font-size: 13px; color: #2b6cb0; font-weight: bold; }
            .triad-card p { margin: 0; font-size: 11px; color: #718096; }
            .footer { margin-top: 25px; text-align: center; font-size: 11px; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="badge">🌹 Intergenerational Family Circle Plan</div>
            <h1 style="margin: 4px 0 6px 0; font-size: 22px;">${problemTitle}</h1>
            <p style="margin: 0; color: #718096; font-size: 12px;">Generated by Pivot & Pulse • Kinship Harmony</p>
          </div>
          
          <div class="triad-grid">
            <div class="triad-card">
              <h4>👧👦 Youth & Kids</h4>
              <p>Play, morning chart, music & discovery</p>
            </div>
            <div class="triad-card">
              <h4>👩👨 Parents</h4>
              <p>Pacing, coordination & 45m respite</p>
            </div>
            <div class="triad-card">
              <h4>👵👴 Grandparents</h4>
              <p>Heritage stories, garden rituals & dignity</p>
            </div>
          </div>

          ${sectionsHtml}

          <div class="footer">
            <p>Pin to refrigerator or family corkboard • Zero-data retained on servers • Open sharing under CC BY-SA 4.0</p>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  async handleOrcidCallback(code: string) {
    this.isOrcidConnecting.set(true);
    this.orcidError.set(null);
    const redirectUri = window.location.origin + '/';

    try {
      const response = await fetch('/api/auth/orcid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to exchange ORCID authorization code.');
      }
      if (data.orcid) {
        localStorage.setItem('user_orcid_id', data.orcid);
        localStorage.setItem('user_orcid_name', data.name || 'Anonymous Researcher');
        this.orcidId.set(data.orcid);
        this.orcidName.set(data.name || 'Anonymous Researcher');
      }
    } catch (err) {
      console.error('ORCID callback error:', err);
      this.orcidError.set((err as Error).message || 'Failed to connect ORCID.');
    } finally {
      this.isOrcidConnecting.set(false);
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }

  saveApiKey(key: string) {
    if (key.trim()) {
      setStoredApiKey(key.trim());
      this.userApiKey.set(key.trim());
    }
  }

  clearApiKey() {
    removeStoredApiKey();
    this.userApiKey.set('');
  }

  async initOnDeviceDetection() {
    try {
      const caps = await this.geminiService.checkOnDeviceCapabilities();
      this.chromeAiAvailable.set(caps.chromeAiAvailable);
      this.ollamaAvailable.set(caps.ollamaAvailable);
      this.ollamaModels.set(caps.ollamaModels);
      this.onDeviceChecked.set(true);
    } catch {
      this.onDeviceChecked.set(true);
    }
  }

  useChromeOnDeviceAi() {
    localStorage.setItem('spark_model_val', 'window.ai');
    setStoredApiKey('chrome-on-device-builtin');
    this.userApiKey.set('chrome-on-device-builtin');
    this.activateDemoPresetIfEmpty();
  }

  useLocalOllama(model = 'gemma2') {
    const chosenModel = this.ollamaModels().length > 0 ? this.ollamaModels()[0] : model;
    localStorage.setItem('spark_model_val', `ollama:${chosenModel}`);
    setStoredApiKey('local-ollama-active');
    this.userApiKey.set('local-ollama-active');
    this.activateDemoPresetIfEmpty();
  }

  private activateDemoPresetIfEmpty() {
    if (!this.problemInput()) {
      if (this.appMode() === 'creative') {
        this.problemInput.set('Designing a self-sustaining municipal park that doubles as a flood barrier and a local agricultural hub.');
        this.selectedStrategyIds.set(new Set(['butterfly', 'combinatorial', 'kinship-triad']));
      } else {
        this.problemInput.set('Improve daily movement and emotional connection for a 75-year-old grandmother recovering from a hip fracture who loves gardening.');
        this.selectedStrategyIds.set(new Set(['what-if', 'butterfly', 'kinship-triad']));
      }
    }
  }

  activateDemoMode() {
    setStoredApiKey('demo-key-active');
    this.userApiKey.set('demo-key-active');
    this.activateDemoPresetIfEmpty();
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
  charCount = computed(() => this.problemInput().length);
  maxCharLimit = 2000;

  piiWarning = computed(() => {
    const rawText = this.problemInput();
    if (!rawText) return null;
    const text = rawText.length > 2000 ? rawText.slice(0, 2000) : rawText;

    const emailRegex = /(?:\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}\b|\b[a-zA-Z0-9._%+-]+\s*(?:\[at\]|\(at\)|@)\s*[a-zA-Z0-9.-]+\s*(?:\[dot\]|\(dot\)|\.)\s*[a-zA-Z]{2,10}\b)/gi;
    const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const ssnRegex = /\b\d{3}[-\s.]\d{2}[-\s.]\d{4}\b/;
    const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
    const dobRegex = /\b(?:DOB|Date of Birth|Birthdate)\s*[:=]\s*\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}\b/i;
    const mrnRegex = /\b(?:MRN|Medical Record Number|Patient ID)\s*[:=]\s*[A-Z0-9-]+\b/i;

    const found: string[] = [];
    if (emailRegex.test(text)) found.push('email address');
    if (phoneRegex.test(text)) found.push('phone number');
    if (ssnRegex.test(text)) found.push('social security number');
    if (ipRegex.test(text)) found.push('IP address');
    if (dobRegex.test(text)) found.push('date of birth');
    if (mrnRegex.test(text)) found.push('medical record number');

    if (found.length > 0) {
      return `Potential ${found.join(', ')} detected. Under HIPAA & privacy guidelines, please de-identify your text before submitting.`;
    }
    return null;
  });

  isGenerateDisabled = computed(() => this.problemInput().trim().length < 5 || this.isLoading() || !!this.piiWarning() || this.charCount() > this.maxCharLimit);
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
      
      // Auto-populate demo presets if we are in Demo Mode
      if (this.userApiKey() === 'demo-key-active') {
        this.activateDemoMode();
      }
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
      const image = this.uploadedImage();
      const imgPayload = image ? { mimeType: image.mimeType, data: image.data } : undefined;
      
      const promises: Promise<unknown>[] = [
        this.geminiService.generateInsights(
          problem, 
          targetStrategies, 
          mode, 
          this.gistInput() || undefined, 
          this.healthSnapshot() ?? undefined,
          (partialInsights) => {
            this.insights.set(partialInsights);
          },
          imgPayload
        )
      ];

      if (mode === 'care') {
        promises.push(this.geminiService.structureHealthGoal(problem, imgPayload).then(struct => this.structuredProblem.set(struct)));
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

  // --- Deep Analysis (Agentic Pipeline) ---
  async generateDeepInsights() {
    if (!this.problemInput().trim()) return;

    this.isLoading.set(true);
    this.startSuggestionCycle();
    this.error.set(null);
    this.insights.set(null);
    this.carePlan.set(null);
    this.creativePlan.set(null);
    this.structuredProblem.set(null);
    this.agenticResult.set(null);
    this.agenticPhase.set('selecting');
    this.isDebateCollapsed.set(true);
    this.resultsViewMode.set('list');

    try {
      const problem = this.problemInput();
      const mode = this.appMode();

      // Run structure in parallel (care mode only)
      if (mode === 'care') {
        this.geminiService.structureHealthGoal(problem)
          .then(struct => this.structuredProblem.set(struct))
          .catch(() => { /* non-critical */ });
      }

      const result = await this.geminiService.runAgenticPipeline(
        problem,
        mode,
        (phase) => this.agenticPhase.set(phase),
        (partial) => {
          this.agenticResult.set(partial as AgenticResult);
          // Also update the standard insights view for compatibility
          if (partial.initialInsights) {
            this.insights.set(partial.initialInsights);
          }
        },
        this.gistInput() || undefined
      );

      this.agenticResult.set(result);
      this.insights.set(result.initialInsights);
      this.agenticPhase.set('complete');
    } catch (err) {
      const errMsg = (err as Error).message || 'Deep analysis failed. Please try again.';
      this.error.set(errMsg);
      this.agenticPhase.set(null);
      console.error(err);
    } finally {
      this.isLoading.set(false);
      this.stopSuggestionCycle();
    }
  }

  toggleDeepAnalysis() {
    this.isDeepAnalysis.update(v => !v);
  }

  getConfidenceLabel(confidence: number): string {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
  }

  getConfidenceClass(confidence: number): string {
    if (confidence >= 0.8) return 'confidence-high';
    if (confidence >= 0.5) return 'confidence-medium';
    return 'confidence-low';
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
    this.agenticResult.set(null);
    this.agenticPhase.set(null);
    this.isDeepAnalysis.set(false);
    this.isDebateCollapsed.set(true);
    this.geminiService.clearCache();
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

    const orcidCredit = this.orcidId() ? ` | Documented by Researcher: ${this.orcidName()} (ORCID: https://orcid.org/${this.orcidId()})` : '';

    return `Care Plan\n==================\n\nProblem: ${problem}\n\n` +
           formatSection("Person's Goal", plan.personGoal) +
           formatSection("Key Interventions", plan.keyInterventions) +
           formatSection("Monitoring Plan", plan.monitoringPlan) +
           formatSection("Guidance & Education", plan.guidanceAndEducation) +
           formatSection("Positive Achievements", plan.positiveAchievements) +
           formatSection("Recommendations", plan.recommendations) +
           `\n— Generated via Pivot & Pulse (designed by Phil Gear)${orcidCredit}, powered by Google Gemini, inspired by Edward de Bono's Lateral Thinking (CC BY-SA 4.0)`;
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
    const orcidCredit = this.orcidId() ? ` | Documented by Researcher: ${this.orcidName()} (ORCID: https://orcid.org/${this.orcidId()})` : '';
    const attributionText = `${text}\n\n— Generated via Pivot & Pulse (designed by Phil Gear)${orcidCredit}, powered by Google Gemini, inspired by Edward de Bono's Lateral Thinking (CC BY-SA 4.0)`;
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

    const orcidCredit = this.orcidId() ? ` | Documented by Researcher: ${this.orcidName()} (ORCID: https://orcid.org/${this.orcidId()})` : '';

    return `Creative Action Plan\n==================\n\nGoal: ${problem}\n\n` +
           formatSection("Conceptual Goal", plan.conceptualGoal) +
           formatSection("Critical Path", plan.criticalPath) +
           formatSection("Risk Assessment & Bottlenecks", plan.riskAssessment) +
           formatSection("Required Resources", plan.requiredResources) +
           formatSection("Milestones", plan.milestones) +
           formatSection("Immediate Next Steps", plan.nextSteps) +
           `\n— Generated via Pivot & Pulse (designed by Phil Gear)${orcidCredit}, powered by Google Gemini, inspired by Edward de Bono's Lateral Thinking (CC BY-SA 4.0)`;
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
  // --- Custom Persona Builder Actions ---
  openCustomRoleModal() {
    this.customRoleName.set('');
    this.customRoleGist.set('');
    this.customRoleIcon.set('user-check');
    this.customRoleCategory.set('clinical');
    this.showCustomRoleModal.set(true);
  }

  closeCustomRoleModal() {
    this.showCustomRoleModal.set(false);
  }

  saveCustomRole() {
    const name = this.customRoleName().trim();
    const gist = this.customRoleGist().trim();
    if (!name || !gist) return;

    const newRole: CareRole = {
      name,
      gist,
      icon: this.customRoleIcon() || 'user-check',
      isCustom: true,
      category: this.customRoleCategory()
    };
    this.storageService.saveCustomRole(newRole);
    this.closeCustomRoleModal();
    this.setCareRole(newRole);
  }

  deleteCustomRole(role: CareRole, event?: Event) {
    if (event) event.stopPropagation();
    this.storageService.removeCustomRole(role.name);
    const active = new Set(this.activeCareRoles());
    if (active.has(role.name)) {
      active.delete(role.name);
      this.activeCareRoles.set(active);
    }
  }

  // --- Translation Actions ---
  openTranslateModal(type: 'insight' | 'care-plan' | 'creative-plan', item?: InsightItem, plan?: CarePlan | CreativePlan, problem?: string) {
    this.translateTarget.set({ type, item, plan, problem });
    this.showTranslateModal.set(true);
  }

  closeTranslateModal() {
    this.showTranslateModal.set(false);
    this.translateTarget.set(null);
  }

  async executeTranslation(targetLang: string) {
    const target = this.translateTarget();
    if (!target) return;

    this.showTranslateModal.set(false);

    if (target.type === 'insight' && target.item) {
      this.translatingCardId.set(target.item.text);
      try {
        const res = await this.geminiService.translateContent(target.item.text, targetLang, 'insight');
        if (res.translatedText) {
          target.item.text = res.translatedText;
        }
      } catch (err) {
        console.error('Translation error:', err);
      } finally {
        this.translatingCardId.set(null);
      }
    } else if (target.type === 'care-plan' && target.plan) {
      this.isTranslatingPlan.set(true);
      try {
        const res = await this.geminiService.translateContent(target.plan as unknown as Record<string, unknown>, targetLang, 'care-plan');
        if (res.translated) {
          this.carePlan.set(res.translated as unknown as CarePlan);
        }
      } catch (err) {
        console.error('Translation error:', err);
      } finally {
        this.isTranslatingPlan.set(false);
      }
    } else if (target.type === 'creative-plan' && target.plan) {
      this.isTranslatingPlan.set(true);
      try {
        const res = await this.geminiService.translateContent(target.plan as unknown as Record<string, unknown>, targetLang, 'creative-plan');
        if (res.translated) {
          this.creativePlan.set(res.translated as unknown as CreativePlan);
        }
      } catch (err) {
        console.error('Translation error:', err);
      } finally {
        this.isTranslatingPlan.set(false);
      }
    }
  }

  // --- FHIR & Document Export ---
  downloadCarePlanFHIR(plan?: CarePlan, problem?: string) {
    const p = plan || this.carePlan();
    const prob = problem || this.problemInput();
    if (!p) return;

    const fhirBundle = {
      resourceType: 'Bundle',
      id: `careplan-bundle-${Date.now()}`,
      type: 'collection',
      timestamp: new Date().toISOString(),
      entry: [
        {
          fullUrl: 'urn:uuid:condition-1',
          resource: {
            resourceType: 'Condition',
            id: 'condition-1',
            clinicalStatus: {
              coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active', display: 'Active' }]
            },
            verificationStatus: {
              coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed', display: 'Confirmed' }]
            },
            category: [{
              coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'health-concern', display: 'Health Concern' }]
            }],
            code: {
              text: this.structuredProblem()?.condition || prob
            },
            subject: {
              display: 'Anonymous Person (De-identified)'
            }
          }
        },
        {
          fullUrl: 'urn:uuid:goal-1',
          resource: {
            resourceType: 'Goal',
            id: 'goal-1',
            lifecycleStatus: 'active',
            description: {
              text: p.personGoal || this.structuredProblem()?.goal || prob
            },
            subject: {
              display: 'Anonymous Person (De-identified)'
            }
          }
        },
        {
          fullUrl: 'urn:uuid:careplan-1',
          resource: {
            resourceType: 'CarePlan',
            id: 'careplan-1',
            status: 'active',
            intent: 'plan',
            title: this.structuredProblem()?.title || 'Person-Centered Care Plan',
            description: 'Care strategy synthesized via Pivot & Pulse lateral thinking workbench.',
            subject: {
              display: 'Anonymous Person (De-identified)'
            },
            author: this.orcidId() ? {
              display: `${this.orcidName()} (ORCID: https://orcid.org/${this.orcidId()})`
            } : undefined,
            addresses: [{ reference: 'urn:uuid:condition-1' }],
            goal: [{ reference: 'urn:uuid:goal-1' }],
            activity: p.keyInterventions.map((intervention) => ({
              detail: {
                kind: 'ServiceRequest',
                status: 'not-started',
                description: intervention,
                doNotPerform: false
              }
            })),
            note: [
              ...p.monitoringPlan.map(m => ({ text: `[Monitoring]: ${m}` })),
              ...p.guidanceAndEducation.map(g => ({ text: `[Education]: ${g}` })),
              ...p.positiveAchievements.map(a => ({ text: `[Milestone/Achievement]: ${a}` })),
              ...p.recommendations.map(r => ({ text: `[Recommendation]: ${r}` }))
            ]
          }
        }
      ]
    };

    const jsonStr = JSON.stringify(fhirBundle, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `careplan-${Date.now()}.fhir.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  downloadPlanMarkdown(type: 'care-plan' | 'creative-plan', plan: CarePlan | CreativePlan, problem?: string) {
    const prob = problem || this.problemInput();
    const content = type === 'care-plan'
      ? this.formatCarePlanForClipboard(plan as CarePlan, prob)
      : this.formatCreativePlanForClipboard(plan as CreativePlan, prob);

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportPlanToPocketgull(type: 'care-plan' | 'creative-plan', plan: CarePlan | CreativePlan) {
    this.pocketgullService.exportData(
      type === 'care-plan' ? 'EXPORT_CARE_PLAN' : 'EXPORT_CREATIVE_PLAN', 
      plan as unknown as Record<string, unknown>
    );
  }
}
