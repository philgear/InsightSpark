import { Component, inject, signal, output } from '@angular/core';
import { IconComponent } from './icon.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PROFILE, EXPERIENCES, EDUCATIONS, CERTIFICATIONS, SKILLS, ARTWORKS, Skill } from '../../models/skills-data';
import { Project, Lesson, PROJECTS, LESSONS } from '../../models/portfolio-data';
import { CurriculumService } from '../../services/curriculum.service';

@Component({
  selector: 'app-expertise',
  standalone: true,
  imports: [IconComponent, CommonModule, FormsModule,],
  template: `
    <div class="space-y-8 animate-pop">
      <!-- Header Announcer & Title -->
      <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b-2 border-[var(--border-color)] pb-4">
        <div class="flex items-center gap-3">
          <div class="h-0.5 w-6 bg-[var(--primary-color)]"></div>
          <h2 class="text-xs font-black uppercase tracking-widest text-[var(--primary-color)] flex items-center gap-2 m-0">
            <app-icon name="briefcase" [size]="14"></app-icon>
            Portfolio &amp; Expertise Showcase
          </h2>
        </div>
        <p class="text-sm text-[var(--text-color-muted)] m-0">
          Explore the intersection of Design, Computer Science, and Photography.
        </p>
      </header>

      <!-- Profile & Artworks Interleaved Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Profile Column (1/3 width) -->
        <div class="lg:col-span-1 flex flex-col">
          <div class="waterfall-item bg-[var(--card-bg)] border-2 border-[var(--border-color)] p-6 space-y-6 flex-1 flex flex-col justify-between neo-offset-box" style="border-radius:0px !important;">
            <div class="space-y-4">
              <!-- Name & Title -->
              <div>
                <h3 class="font-serif text-3xl text-[var(--text-color)] m-0">{{ profile.name }}</h3>
                <p class="text-xs font-bold uppercase tracking-widest text-[var(--secondary-color)] mt-1">{{ profile.title }}</p>
              </div>

              <!-- Bio -->
              <p class="bio-paragraph text-sm leading-relaxed text-[var(--text-color-muted)]">
                {{ profile.bio }}
              </p>
            </div>

            <!-- Social Links & Summary -->
            <div class="space-y-4 pt-4 border-t border-[var(--border-color)]/30">
              <div class="flex flex-wrap gap-3">
                @for (social of profile.socials; track social.name) {
                  <a [href]="social.url" 
                     target="_blank" 
                     [attr.aria-label]="social.name"
                     class="flex items-center justify-center w-10 h-10 border-2 border-[var(--border-color)] hover:bg-[var(--secondary-color)] hover:text-white hover:border-[var(--secondary-color)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)]"
                     style="border-radius: 0px !important; min-height: 44px; min-width: 44px;">
                    <app-icon [name]="social.icon" [size]="18"></app-icon>
                  </a>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Artworks Grid (2/3 width) -->
        <div class="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          @for (art of artworks; track art.id; let idx = $index) {
            <div class="waterfall-item bg-[var(--card-bg)] border-2 border-[var(--border-color)] hover:border-[var(--secondary-color)] transition-all duration-300 flex flex-col group relative overflow-hidden" 
                 [style.transition-delay.ms]="idx * 100"
                 style="border-radius:0px !important;">
              <!-- Artwork Image Frame -->
              <div class="aspect-video relative overflow-hidden border-b-2 border-[var(--border-color)] bg-[var(--card-bg-subtle)] flex items-center justify-center">
                <img [src]="art.image" 
                     [alt]="art.title" 
                     class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4 text-center">
                  <span class="text-xs font-black uppercase tracking-wider text-[var(--primary-color)]">View Demonstrated Skills</span>
                </div>
              </div>

              <!-- Artwork Text -->
              <div class="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div class="space-y-2">
                  <h4 class="font-serif text-lg leading-tight text-[var(--text-color)] m-0 group-hover:text-[var(--secondary-color)] transition-colors">{{ art.title }}</h4>
                  <p class="text-xs text-[var(--text-color-muted)] leading-relaxed line-clamp-3">{{ art.description }}</p>
                </div>

                <div class="space-y-3">
                  <!-- Tech stack -->
                  <div class="flex flex-wrap gap-1">
                    @for (t of art.stack; track t) {
                      <span class="px-1.5 py-0.5 text-[9px] font-bold border border-[var(--border-color)] text-[var(--text-color-subtle)]" style="border-radius:0px !important;">
                        {{ t }}
                      </span>
                    }
                  </div>

                  <!-- Linked Skills -->
                  <div class="flex flex-wrap gap-1 pt-2 border-t border-[var(--border-color)]/20">
                    @for (sId of art.skills; track sId) {
                      @if (getSkill(sId); as skill) {
                        <button (click)="selectSkillById(sId)"
                                class="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[var(--primary-color)] text-black border border-[var(--primary-color)] hover:bg-[var(--secondary-color)] hover:border-[var(--secondary-color)] hover:text-white transition-colors"
                                style="border-radius:0px !important;">
                          {{ skill.label }}
                        </button>
                      }
                    }
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Project Showcases Grid (Multiple Rows) -->
      <section class="space-y-6" aria-labelledby="projects-heading">
        <div class="flex items-center gap-3 border-t-2 border-[var(--border-color)] pt-6">
          <app-icon name="collection" [size]="20" class="text-[var(--secondary-color)]"></app-icon>
          <h3 id="projects-heading" class="font-serif text-2xl text-[var(--text-color)] m-0">
            Featured Project Showcases
          </h3>
          <div class="flex-1 h-0.5 bg-[var(--border-color)]/20"></div>
          <span class="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
            {{ projects.length }} COMPILATIONS
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (proj of projects; track proj.id; let idx = $index) {
            <div class="waterfall-item bg-[var(--card-bg)] border-2 border-[var(--border-color)] p-6 flex flex-col justify-between relative overflow-hidden group project-card"
                 [style.transition-delay.ms]="(idx % 3) * 100"
                 style="border-radius: 0px !important;">
              
              <div class="space-y-4">
                <!-- Discipline Tag & ID -->
                <div class="flex items-center justify-between border-b border-[var(--border-color)]/30 pb-3">
                  <span class="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest bg-[var(--card-bg)] text-[var(--text-accent)] border-2 border-[var(--text-accent)]" style="border-radius: 0px !important;">
                    {{ proj.discipline }}
                  </span>
                  <span class="text-[9px] text-[var(--text-color-muted)] font-black uppercase tracking-widest">#{{ proj.id }}</span>
                </div>

                <!-- Title & Description -->
                <div class="space-y-2">
                  <h4 class="font-serif text-xl text-[var(--text-color)] m-0 leading-tight group-hover:text-[var(--secondary-color)] transition-colors">
                    {{ proj.title }}
                  </h4>
                  <p class="text-xs text-[var(--text-color-muted)] leading-relaxed line-clamp-3">
                    {{ proj.description }}
                  </p>
                </div>

                <!-- Tech Badges -->
                <div class="space-y-1">
                  <div class="flex flex-wrap gap-1">
                    @for (tech of proj.technologies; track tech) {
                      <span class="px-2 py-0.5 text-[9px] font-bold bg-[var(--card-bg-subtle)] text-[var(--text-color-muted)] border border-[var(--border-color)]" style="border-radius: 0px !important;">
                        {{ tech }}
                      </span>
                    }
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center justify-between pt-4 mt-6 border-t border-[var(--border-color)]/30">
                <div class="flex items-center gap-3">
                  <a [href]="proj.demoUrl || '#'" target="_blank" class="text-[9px] font-black uppercase tracking-widest text-[var(--text-accent)] hover:text-[var(--secondary-color)] flex items-center gap-1 min-h-[44px]" style="display: inline-flex; align-items: center;">
                    Demo
                    <app-icon name="external-link" [size]="10"></app-icon>
                  </a>
                  <a [href]="proj.codeUrl || '#'" target="_blank" class="text-[9px] font-black uppercase tracking-widest text-[var(--text-accent)] hover:text-[var(--secondary-color)] flex items-center gap-1 min-h-[44px]" style="display: inline-flex; align-items: center; margin-left: 8px;">
                    Code
                    <app-icon name="copy" [size]="10"></app-icon>
                  </a>
                </div>

                <button (click)="selectProject.emit(proj.id)"
                        class="text-[9px] font-black uppercase tracking-widest text-black bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] hover:text-white px-3 py-1.5 border border-transparent transition-all focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)] neo-pressable"
                        style="border-radius: 0px !important; min-height: 44px; display: inline-flex; align-items: center; justify-content: center;">
                  Compile Workspace
                  <app-icon name="arrow-right" [size]="10" class="ml-1"></app-icon>
                </button>
              </div>

            </div>
          }
        </div>
      </section>

      <!-- Interactive Skills Deck Section -->
      <section class="space-y-6" aria-labelledby="skills-heading">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t-2 border-[var(--border-color)] pt-6">
          <h3 id="skills-heading" class="font-serif text-2xl text-[var(--text-color)] m-0 flex items-center gap-2">
            <app-icon name="zap" [size]="20" class="text-[var(--tertiary-color)]"></app-icon>
            Interactive Skills Matrix
          </h3>

          <!-- Search Box -->
          <div class="relative w-full max-w-md">
            <app-icon name="search" [size]="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-color-muted)]"></app-icon>
            <label for="search-skills" class="sr-only">Search skills matrix</label>
            <input 
              id="search-skills"
              type="text" 
              [ngModel]="searchQuery()" 
              (ngModelChange)="onSearchQueryChange($event)"
              placeholder="Search skills (e.g. Figma, Generative AI, Python)..."
              class="w-full pl-10 pr-4 py-2 bg-[var(--card-bg)] border-2 border-[var(--border-color)] focus:outline-none text-sm skills-search-input"
              style="border-radius: 0px !important;"
              autocomplete="off"
            >
            @if (searchQuery()) {
              <button (click)="onSearchQueryChange('')" class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-color-muted)] hover:text-[var(--text-color)] focus:outline-none" aria-label="Clear search">
                <app-icon name="x" [size]="16"></app-icon>
              </button>
            }
          </div>
        </div>

        <!-- Columnar Categories Matrix & Detail Panel -->
        <div class="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          <!-- Skills Columns (3/4 width if detailed skill selected, otherwise full width) -->
          <div [class]="selectedSkill() ? 'xl:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' : 'xl:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'">
            @for (cat of categories; track cat.id) {
              <div class="waterfall-item bg-[var(--card-bg)] border-2 border-[var(--border-color)] p-5 space-y-4 flex flex-col" style="border-radius:0px !important;">
                <h4 class="text-xs font-bold uppercase tracking-wider text-[var(--secondary-color)] border-b border-[var(--border-color)]/30 pb-2 m-0">{{ cat.name }}</h4>
                
                <!-- Skills list -->
                <div class="flex flex-col gap-2">
                  @for (sId of cat.skills; track sId) {
                    @let skill = getSkill(sId);
                    @if (skill && (filterMatches(skill))) {
                      <button (click)="selectSkill(skill)"
                              [class.bg-[var(--secondary-color)]]="selectedSkill()?.id === sId"
                              [class.text-white]="selectedSkill()?.id === sId"
                              [class.border-[var(--secondary-color)]]="selectedSkill()?.id === sId"
                              [class.bg-[var(--card-bg-subtle)]]="selectedSkill()?.id !== sId"
                              class="w-full text-left px-3 py-2.5 text-xs font-bold border-2 border-[var(--border-color)] hover:bg-[var(--secondary-color)] hover:text-white hover:border-[var(--secondary-color)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)] neo-pressable"
                              style="border-radius:0px !important; min-height: 44px;"
                              [attr.aria-pressed]="selectedSkill()?.id === sId">
                        <div class="flex justify-between items-center">
                          <span>{{ skill.label }}</span>
                          <span class="text-[9px] uppercase tracking-widest px-1 py-0.5 border"
                                [class.border-black]="selectedSkill()?.id === sId"
                                [class.text-black]="selectedSkill()?.id === sId"
                                [class.border-[var(--border-color)]/40]="selectedSkill()?.id !== sId"
                                [class.text-[var(--text-color-muted)]]="selectedSkill()?.id !== sId"
                                style="border-radius:0px !important;">
                            {{ skill.socCode }}
                          </span>
                        </div>
                      </button>
                    }
                  }
                </div>
              </div>
            }
          </div>

          <!-- Semantic Details Drawer Panel (1/4 width, sticky) -->
          @if (selectedSkill(); as skill) {
            <div class="xl:col-span-1 bg-[var(--card-bg)] border-2 border-[var(--secondary-color)] p-6 space-y-6 xl:sticky xl:top-8 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto animate-pop" style="border-radius:0px !important;">
              <!-- Close detail button -->
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-[9px] font-black uppercase tracking-widest text-[var(--secondary-color)] px-1.5 py-0.5 border-2 border-[var(--secondary-color)]" style="border-radius:0px !important;">
                    SOC: {{ skill.socCode }}
                  </span>
                  <!-- Eisenhower Urgent Indicator -->
                  <span [class]="getEisenhowerClass(skill.eisenhower)" class="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border-2 ml-2" style="border-radius:0px !important;">
                    {{ skill.eisenhower }}
                  </span>
                </div>
                <button (click)="selectedSkill.set(null)" class="text-[var(--text-color-muted)] hover:text-[var(--secondary-color)] focus:outline-none p-1" aria-label="Close detail panel">
                  <app-icon name="x" [size]="18"></app-icon>
                </button>
              </div>

              <!-- Skill title -->
              <div class="space-y-2">
                <h4 class="font-serif text-2xl text-[var(--text-color)] m-0 leading-tight">{{ skill.label }}</h4>
                <p class="text-xs text-[var(--text-color-muted)] leading-relaxed">
                  {{ skill.description }}
                </p>
              </div>

              <!-- Related Skills -->
              @if (skill.relatedSkillIds && skill.relatedSkillIds.length > 0) {
                <div class="space-y-2">
                  <h5 class="text-[10px] font-black uppercase tracking-widest text-[var(--primary-color)] m-0">Related Skills:</h5>
                  <div class="flex flex-wrap gap-1.5">
                    @for (rId of skill.relatedSkillIds; track rId) {
                      @let rSkill = getSkill(rId);
                      @if (rSkill) {
                        <button (click)="selectSkill(rSkill)"
                                class="px-2 py-1 text-[10px] font-bold border-2 border-[var(--border-color)] bg-[var(--card-bg-subtle)] text-[var(--text-color-muted)] hover:bg-[var(--primary-color)] hover:text-black transition-colors"
                                style="border-radius:0px !important; min-height: 36px;">
                          {{ rSkill.label }}
                        </button>
                      }
                    }
                  </div>
                </div>
              }

              <!-- Semantic Projects Links -->
              @if (getSemanticProjects(skill); as linkedProjs) {
                @if (linkedProjs.length > 0) {
                  <div class="space-y-2">
                    <h5 class="text-[10px] font-black uppercase tracking-widest text-[var(--secondary-color)] m-0">Demonstrated In Projects:</h5>
                    <div class="flex flex-col gap-2">
                      @for (p of linkedProjs; track p.id) {
                        <button (click)="selectProject.emit(p.id)"
                                class="text-left px-3 py-2 text-xs font-bold border-2 border-[var(--border-color)] hover:bg-[var(--secondary-color)] hover:text-white transition-colors flex justify-between items-center"
                                style="border-radius:0px !important; min-height: 40px;">
                          <span>{{ p.title }}</span>
                          <app-icon name="arrow-right" [size]="12"></app-icon>
                        </button>
                      }
                    </div>
                  </div>
                }
              }

              <!-- Semantic Lessons Links -->
              @if (getSemanticLessons(skill); as linkedLessons) {
                @if (linkedLessons.length > 0) {
                  <div class="space-y-2">
                    <h5 class="text-[10px] font-black uppercase tracking-widest text-[var(--tertiary-color)] m-0">Related Academy Guides:</h5>
                    <div class="flex flex-col gap-2">
                      @for (l of linkedLessons; track l.id) {
                        <button (click)="selectLesson.emit(l)"
                                class="text-left px-3 py-2 text-xs font-bold border-2 border-[var(--border-color)] hover:bg-[var(--button-bg-hover)] hover:text-white transition-colors flex justify-between items-center"
                                style="border-radius:0px !important; min-height: 40px;">
                          <span>{{ l.title }}</span>
                          <app-icon name="book-open" [size]="12"></app-icon>
                        </button>
                      }
                    </div>
                  </div>
                }
              }

              <!-- Semantic Experience Context (Milestones) -->
              @if (getSemanticMilestones(skill); as milestones) {
                @if (milestones.length > 0) {
                  <div class="space-y-2">
                    <h5 class="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-subtle)] m-0">Career Context:</h5>
                    <div class="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      @for (m of milestones; track m.id) {
                        <div class="p-2 border border-[var(--border-color)]/30 bg-[var(--card-bg-subtle)] text-[10px] flex gap-3 items-start">
                          <!-- Logo / Avatar container -->
                          <div class="flex-shrink-0 w-8 h-8">
                            @if (getNodeLogo(m); as logoUrl) {
                              <img [src]="logoUrl" 
                                   (error)="handleLogoError(m.id)" 
                                   class="w-8 h-8 object-contain border border-[var(--border-color)]/30 bg-white p-0.5" 
                                   style="border-radius: 0px;"
                                   alt="">
                            } @else {
                              <!-- Fallback single-letter avatar -->
                              <div [class]="getMilestoneAvatarClass(m.type)" 
                                   class="w-8 h-8 border border-[var(--border-color)]/30 flex items-center justify-center font-black text-xs" 
                                   style="border-radius: 0px;">
                                {{ m.label.charAt(0) }}
                              </div>
                            }
                          </div>
                          <!-- Text content -->
                          <div class="flex-1 min-w-0 space-y-1">
                            <div class="flex justify-between items-center">
                              <span class="font-black uppercase tracking-wider text-[var(--primary-color)]">{{ m.type }}</span>
                              <span class="text-[9px] text-[var(--text-color-muted)]">{{ m.dates }}</span>
                            </div>
                            <div class="font-bold text-[var(--text-color)] truncate">{{ m.label }} - {{ m.title }}</div>
                            <p class="m-0 text-[9px] text-[var(--text-color-muted)] leading-relaxed line-clamp-2">{{ m.description }}</p>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              }
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .bio-paragraph::first-letter {
      font-family: var(--font-serif, serif);
      font-size: 3.5rem;
      float: left;
      line-height: 0.85;
      padding-right: 0.5rem;
      padding-top: 0.25rem;
      color: var(--secondary-color);
      font-weight: bold;
      text-transform: uppercase;
    }
    .project-card {
      box-shadow: 4px 4px 0px var(--border-color);
      transition: transform 0.15s steps(2), box-shadow 0.15s steps(2);
    }
    .project-card:hover {
      transform: translate(-2px, -2px);
      box-shadow: 6px 6px 0px var(--border-accent);
      border-color: var(--border-accent);
    }
    .project-card:active {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0px var(--border-accent);
    }
    .skills-search-input {
      box-shadow: 4px 4px 0px var(--border-color);
      transition: all 0.15s steps(2);
    }
    .skills-search-input:focus {
      box-shadow: 4px 4px 0px var(--border-accent);
      border-color: var(--border-accent);
    }
  `],})
export class ExpertiseComponent {
  selectProject = output<string>();
  selectLesson = output<Lesson>();

  curriculumService = inject(CurriculumService);

  profile = PROFILE;
  artworks = ARTWORKS;
  skills = SKILLS;
  projects = PROJECTS;

  searchQuery = signal('');
  selectedSkill = signal<Skill | null>(null);

  // Grouped Categories Mapping
  readonly categories = [
    { id: 'ai-ds', name: 'AI & Data Science', skills: ['skill-genai', 'skill-google-gemini', 'skill-ai', 'skill-ml', 'skill-data-science', 'skill-python', 'skill-google-sheets', 'skill-decision-intelligence'] },
    { id: 'eng-dev', name: 'Engineering & Development', skills: ['skill-software-dev', 'skill-web-dev', 'skill-javascript', 'skill-npm', 'skill-cloud-computing', 'skill-security', 'skill-github', 'skill-html5', 'skill-css3', 'skill-php', 'skill-json', 'skill-angular', 'skill-ruby', 'skill-nodejs', 'skill-version-control', 'skill-wordpress', 'skill-aws', 'skill-it-support', 'skill-windows'] },
    { id: 'design-media', name: 'Creative Design & Media', skills: ['skill-graphic-design', 'skill-digital-photography', 'skill-photo-retouching', 'skill-adobe-photoshop', 'skill-adobe-lightroom', 'skill-lighting', 'skill-composition', 'skill-adobe-xd', 'skill-figma', 'skill-sketch', 'skill-visual-language', 'skill-branding', 'skill-marketing'] },
    { id: 'strat-comm', name: 'Strategy & Communication', skills: ['skill-english', 'skill-community-management', 'skill-teaching', 'skill-client-management', 'skill-communication', 'skill-written-communication', 'skill-verbal-communication', 'skill-presentation-skills', 'skill-project-management', 'skill-instruction', 'skill-customer-service', 'skill-creativity', 'skill-lifelong-learning', 'skill-negotiation', 'skill-strategic-negotiation', 'skill-supply-chain', 'skill-logistics', 'skill-inventory-management', 'skill-lean-six-sigma', 'skill-business-etiquette', 'skill-workshop-facilitation', 'skill-critical-thinking', 'skill-sustainability', 'skill-customer-experience', 'skill-problem-solving', 'skill-teamwork', 'skill-time-management', 'skill-adaptability', 'skill-leadership', 'skill-quality-assurance', 'skill-lead-generation', 'skill-organization', 'skill-resilience'] }
  ];

  getSkill(id: string): Skill | undefined {
    return this.skills.find(s => s.id === id);
  }

  selectSkill(skill: Skill): void {
    this.selectedSkill.set(skill);
    this.curriculumService.liveAnnouncement.set(`Selected skill ${skill.label}. Detail panel opened.`);
  }

  selectSkillById(id: string): void {
    const s = this.getSkill(id);
    if (s) {
      this.selectSkill(s);
      // Announce and scroll to matrix
      this.curriculumService.liveAnnouncement.set(`Focused skill ${s.label} from artwork list.`);
      const el = document.getElementById('search-skills');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  onSearchQueryChange(query: string): void {
    this.searchQuery.set(query);
    if (query.trim()) {
      this.curriculumService.liveAnnouncement.set(`Skills filtered by: ${query}`);
    } else {
      this.curriculumService.liveAnnouncement.set('Skills search query cleared.');
    }
  }

  filterMatches(skill: Skill): boolean {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return true;
    return skill.label.toLowerCase().includes(q) ||
           skill.description.toLowerCase().includes(q) ||
           skill.socCode.toLowerCase().includes(q);
  }

  getEisenhowerClass(quadrant: string): string {
    switch (quadrant) {
      case 'QI': return 'border-red-500 text-red-500';
      case 'QII': return 'border-[var(--primary-color)] text-[var(--primary-color)]';
      case 'QIII': return 'border-[var(--tertiary-color)] text-[var(--tertiary-color)]';
      default: return 'border-gray-500 text-gray-500';
    }
  }

  // --- Dynamic Rules-based Semantic Connections Matchers ---

  getSemanticProjects(skill: Skill): Project[] {
    const sName = skill.label.toLowerCase();
    return PROJECTS.filter(p => {
      // 1. Match tech labels directly
      const techMatch = p.technologies.some(tech => {
        const t = tech.toLowerCase();
        return t.includes(sName) || sName.includes(t) ||
               (sName === 'generative ai' && t === 'generative ai') ||
               (sName === 'machine learning' && t === 'machine learning & automation') ||
               (sName === 'ux design' && t === 'wai-aria') ||
               (sName === 'figma' && t === '3d rendering & visualization') ||
               (sName === 'adobe photoshop' && t === 'media & metadata management') ||
               (sName === 'adobe lightroom' && t === 'media & metadata management') ||
               (sName === 'digital photography' && t === 'media & metadata management') ||
               (sName === 'angular' && t === 'angular & typescript') ||
               (sName === 'javascript' && t === 'angular & typescript');
      });

      // 2. Match discipline keywords
      const disc = p.discipline.toLowerCase();
      const discMatch = (sName === 'generative ai' || sName === 'machine learning' || sName === 'python') && disc.includes('computer science') ||
                        (sName === 'ux design' || sName === 'accessibility') && disc.includes('systems & strategy') ||
                        (sName === 'graphic design' || sName === 'branding') && disc.includes('graphic design') ||
                        (sName === 'digital photography' || sName === 'composition') && disc.includes('photography');

      return techMatch || discMatch;
    });
  }

  getSemanticLessons(skill: Skill): Lesson[] {
    const sName = skill.label.toLowerCase();
    return LESSONS.filter(l => {
      // 1. Match tech labels directly
      const techMatch = l.technologies.some(tech => {
        const t = tech.toLowerCase();
        return t.includes(sName) || sName.includes(t) ||
               (sName === 'generative ai' && t === 'generative ai') ||
               (sName === 'machine learning' && t === 'machine learning & automation') ||
               (sName === 'ux design' && t === 'wai-aria') ||
               (sName === 'figma' && t === '3d rendering & visualization') ||
               (sName === 'adobe photoshop' && t === 'media & metadata management') ||
               (sName === 'adobe lightroom' && t === 'media & metadata management') ||
               (sName === 'digital photography' && t === 'media & metadata management') ||
               (sName === 'angular' && t === 'angular & typescript') ||
               (sName === 'javascript' && t === 'angular & typescript');
      });

      // 2. Match discipline keywords
      const disc = l.discipline.toLowerCase();
      const discMatch = (sName === 'generative ai' || sName === 'machine learning' || sName === 'python') && disc.includes('computer science') ||
                        (sName === 'ux design' || sName === 'accessibility') && disc.includes('systems & strategy') ||
                        (sName === 'graphic design' || sName === 'branding') && disc.includes('graphic design') ||
                        (sName === 'digital photography' || sName === 'composition') && disc.includes('photography');

      return techMatch || discMatch;
    });
  }

  logoFailedNodes = new Set<string>();

  getNodeLogo(node: { id: string; url?: string | null }): string | null {
    if (!node.url || node.url.startsWith('#') || node.url.startsWith('mailto:') || this.logoFailedNodes.has(node.id)) {
      return null;
    }
    try {
      const url = new URL(node.url);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
      const host = url.hostname.replace('www.', '');
      return `https://logo.clearbit.com/${host}?size=64`;
    } catch {
      return null;
    }
  }

  handleLogoError(nodeId: string): void {
    this.logoFailedNodes.add(nodeId);
  }

  getMilestoneAvatarClass(type: string): string {
    switch (type) {
      case 'Experience':
        return 'bg-[var(--primary-color)] text-black';
      case 'Education':
        return 'bg-[var(--secondary-color)] text-black';
      case 'Certification':
        return 'bg-[var(--tertiary-color)] text-black';
      default:
        return 'bg-[var(--card-bg-subtle)] text-[var(--text-color)]';
    }
  }

  getSemanticMilestones(skill: Skill): { id: string; type: string; label: string; title: string; dates: string; description: string; url: string | null }[] {
    const sName = skill.label.toLowerCase();
    const results: { id: string; type: string; label: string; title: string; dates: string; description: string; url: string | null }[] = [];

    // Search experiences
    EXPERIENCES.forEach(e => {
      const match = e.title.toLowerCase().includes(sName) || 
                    e.description.toLowerCase().includes(sName) ||
                    e.label.toLowerCase().includes(sName) ||
                    (sName === 'photography' && e.label.toLowerCase().includes('photo')) ||
                    (sName === 'supply chain' && e.title.toLowerCase().includes('supply')) ||
                    (sName === 'logistics' && e.description.toLowerCase().includes('logistics')) ||
                    (sName === 'generative ai' && e.description.toLowerCase().includes('generative ai')) ||
                    (sName === 'it support' && e.title.toLowerCase().includes('it support'));
      if (match) {
        results.push({ id: e.id, type: 'Experience', label: e.label, title: e.title, dates: e.dates, description: e.description, url: e.url });
      }
    });

    // Search educations
    EDUCATIONS.forEach(ed => {
      const match = ed.degree.toLowerCase().includes(sName) ||
                    ed.label.toLowerCase().includes(sName) ||
                    (sName === 'graphic design' && ed.degree.toLowerCase().includes('graphic design')) ||
                    (sName === 'software dev' && ed.degree.toLowerCase().includes('programming')) ||
                    (sName === 'marketing' && ed.degree.toLowerCase().includes('marketing')) ||
                    (sName === 'it support' && ed.degree.toLowerCase().includes('information technology'));
      if (match) {
        results.push({ id: ed.id, type: 'Education', label: ed.label, title: ed.degree, dates: ed.dates, description: 'Academic degree node', url: ed.url });
      }
    });

    // Search certifications
    CERTIFICATIONS.forEach(c => {
      const match = c.label.toLowerCase().includes(sName) ||
                    c.issuer.toLowerCase().includes(sName) ||
                    (sName === 'generative ai' && c.label.toLowerCase().includes('genai')) ||
                    (sName === 'google gemini' && c.label.toLowerCase().includes('gemini')) ||
                    (sName === 'ux design' && c.label.toLowerCase().includes('ux')) ||
                    (sName === 'negotiation' && c.label.toLowerCase().includes('negotiat')) ||
                    (sName === 'supply chain' && c.label.toLowerCase().includes('supply chain')) ||
                    (sName === 'logistics' && c.label.toLowerCase().includes('logistics'));
      if (match) {
        results.push({ id: c.id, type: 'Certification', label: c.issuer, title: c.label, dates: c.issue_date, description: `Professional certificate credential: ${c.credential_id || 'Active'}`, url: c.url });
      }
    });

    return results;
  }
}
