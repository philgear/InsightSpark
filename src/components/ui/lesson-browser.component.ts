import { Component, inject, signal, computed, output, effect, untracked } from '@angular/core';
import { IconComponent } from './icon.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Lesson, LESSONS, DISCIPLINES, TECHNOLOGIES } from '../../models/portfolio-data';
import { CurriculumService } from '../../services/curriculum.service';

@Component({
  selector: 'app-lesson-browser',
  standalone: true,
  imports: [IconComponent, CommonModule, FormsModule,],
  template: `
    <div class="space-y-6 animate-pop">
      <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div class="flex-1 flex items-center gap-3">
          <div class="h-0.5 w-6 bg-[var(--primary-color)]"></div>
          <h2 class="text-xs font-black uppercase tracking-widest text-[var(--primary-color)] flex items-center gap-2 m-0">
            <app-icon name="book-open" [size]="14"></app-icon>
            GearArts Learning Academy
          </h2>
          <div class="flex-1 h-0.5 bg-[var(--border-color)]"></div>
        </div>
        
        <!-- Filter Controls -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl justify-end">
          <!-- Search Bar -->
          <div class="relative flex-1 max-w-md">
            <app-icon name="search" [size]="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-color-muted)]"></app-icon>
            <label for="search-lessons" class="sr-only">Search lessons or topics</label>
            <input 
              id="search-lessons"
              name="search-lessons"
              type="text" 
              [ngModel]="searchQuery()" 
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Search lessons or topics..."
              class="w-full pl-10 pr-4 py-2 bg-[var(--card-bg)] border-2 border-[var(--border-color)] rounded-full focus:ring-2 focus:ring-[var(--ring-color)] focus:outline-none transition-all text-sm"
              aria-label="Search lessons"
              autocomplete="off"
            >
            @if (searchQuery()) {
              <button (click)="searchQuery.set('')" class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-color-muted)] hover:text-[var(--text-color)] focus:outline-none" aria-label="Clear search">
                <app-icon name="x" [size]="16"></app-icon>
              </button>
            }
          </div>

          <!-- Curriculum Quick Stats -->
          <div class="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg-subtle)] border-2 border-[var(--border-color)] rounded-full text-xs font-semibold text-[var(--text-color-muted)]">
            <app-icon name="bookmark" [size]="14" class="text-[var(--text-accent)]"></app-icon>
            <span>Curriculum: {{ curriculumService.savedLessonIds().length }} Saved</span>
          </div>
        </div>
      </header>

      <!-- Grid Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Sidebar Filters -->
        <div class="lg:col-span-1 space-y-6">
          <div class="waterfall-item bg-[var(--card-bg)] border-2 border-[var(--border-color)] rounded-2xl p-5 space-y-5">
            <!-- Disciplines filter -->
            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-[var(--text-color-muted)] mb-3">Disciplines</h3>
              <div class="flex flex-col gap-2">
                <button (click)="selectedDiscipline.set(null)"
                        [class.bg-[var(--button-bg-hover)]]="selectedDiscipline() === null"
                        [class.text-[var(--text-color)]]="selectedDiscipline() === null"
                        class="text-left px-3 py-2 text-sm rounded-lg hover:bg-[var(--button-bg-hover)] transition-colors text-[var(--text-color-muted)] font-medium"
                        [attr.aria-pressed]="selectedDiscipline() === null">
                  All Disciplines
                </button>
                @for (d of disciplines; track d.id) {
                  <button (click)="selectedDiscipline.set(d.name)"
                          [class.bg-[var(--text-accent)]]="selectedDiscipline() === d.name"
                          [class.text-white]="selectedDiscipline() === d.name"
                          class="text-left px-3 py-2 text-sm rounded-lg hover:bg-[var(--button-bg-hover)] transition-colors text-[var(--text-color-muted)] font-medium flex items-center gap-2"
                          [attr.aria-pressed]="selectedDiscipline() === d.name">
                    <app-icon [name]="d.icon" [size]="16"></app-icon>
                    <span>{{ d.name }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- Technologies filter -->
            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-[var(--text-color-muted)] mb-3">Technologies</h3>
              <div class="flex flex-wrap lg:flex-col gap-2">
                <button (click)="selectedTech.set(null)"
                        [class.bg-[var(--button-bg-hover)]]="selectedTech() === null"
                        [class.text-[var(--text-color)]]="selectedTech() === null"
                        class="text-left px-3 py-2 text-sm rounded-lg hover:bg-[var(--button-bg-hover)] transition-colors text-[var(--text-color-muted)] font-medium"
                        [attr.aria-pressed]="selectedTech() === null">
                  All Technologies
                </button>
                @for (t of technologies; track t.id) {
                  <button (click)="selectedTech.set(t.name)"
                          [class.bg-[var(--text-accent)]]="selectedTech() === t.name"
                          [class.text-white]="selectedTech() === t.name"
                          class="text-left px-3 py-2 text-sm rounded-lg hover:bg-[var(--button-bg-hover)] transition-colors text-[var(--text-color-muted)] font-medium flex items-center gap-2"
                          [attr.aria-pressed]="selectedTech() === t.name">
                    <app-icon [name]="t.icon" [size]="16"></app-icon>
                    <span>{{ t.name }}</span>
                  </button>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Lessons List -->
        <div class="lg:col-span-3">
          @if (filteredLessons().length === 0) {
            <div class="text-center py-20 bg-[var(--card-bg-subtle)] border-2 border-[var(--border-color)] rounded-3xl">
              <app-icon name="search" [size]="48" class="text-[var(--text-color-muted)] mx-auto mb-4"></app-icon>
              <h3 class="font-serif">No lessons match your filters</h3>
              <p class="text-[var(--text-color-muted)] mt-2">Try clearing your search query or selecting a different filter.</p>
              <button (click)="clearFilters()" class="mt-4 text-[var(--text-accent)] hover:underline focus:outline-none font-semibold">Clear All Filters</button>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              @for (lesson of filteredLessons(); track lesson.id; let i = $index) {
                <div class="waterfall-item bg-[var(--card-bg)] border-2 border-[var(--border-color)] hover:border-[var(--text-accent)] rounded-3xl p-6 transition-all duration-500 flex flex-col justify-between group  hover: hover:-translate-y-2 relative overflow-hidden" 
                     [style.transition-delay.ms]="(i % 3) * 100"
                     [class.md:col-span-2]="i % 5 === 0" 
                     [class.xl:col-span-2]="i % 4 === 0">
                  <!-- Decorative Background Glow -->
                  
                  
                  <div class="space-y-4 relative z-10">
                    <header class="flex items-start justify-between">
                      <div class="flex items-center gap-2">
                        <span class="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full bg-[var(--card-bg)] text-[var(--text-accent)] border-2 border-[var(--text-accent)]  ">
                          {{ lesson.discipline }}
                        </span>
                      </div>
                      <button (click)="toggleCurriculum($event, lesson.id)"
                              class="text-[var(--text-color-muted)] hover:text-[var(--text-accent)] transition-all duration-300 p-2 rounded-full focus:outline-none hover:bg-[var(--text-accent)] hover:text-white hover:scale-110"
                              [attr.aria-label]="curriculumService.isSaved(lesson.id) ? 'Remove from curriculum' : 'Add to curriculum'">
                        <app-icon name="bookmark" [size]="22" [class]="curriculumService.isSaved(lesson.id) ? 'fill-[var(--text-accent)] text-[var(--text-accent)] drop-' : ''"></app-icon>
                      </button>
                    </header>

                    <div class="space-y-3 pt-2">
                      <h3 class="font-serif text-2xl group-hover:text-[var(--text-accent)] transition-colors leading-tight">{{ lesson.title }}</h3>
                      <p class="text-sm text-[var(--text-color-muted)] leading-relaxed line-clamp-3">
                        {{ lesson.description }}
                      </p>
                    </div>

                    <!-- Tech Badges -->
                    <div class="flex flex-wrap gap-2 pt-3">
                      @for (tech of lesson.technologies; track tech) {
                        <span class="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[var(--card-bg-subtle)] text-[var(--text-color-muted)] border-2 border-[var(--border-color)] ">
                          {{ tech }}
                        </span>
                      }
                    </div>
                  </div>

                  <div class="pt-6 mt-6 border-t border-[var(--border-color)]/50 flex items-center justify-between relative z-10">
                    <span class="text-xs text-[var(--text-color-subtle)] font-bold flex items-center gap-2">
                      <span class="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--card-bg)] text-[var(--text-accent)] border-2 border-[var(--text-accent)]">
                        <app-icon name="video" [size]="12"></app-icon>
                      </span>
                      Video Guide
                    </span>
                    <button (click)="selectLesson.emit(lesson)"
                            class="text-sm font-bold text-[var(--primary-cta-text)] bg-[var(--primary-cta-bg)] px-4 py-2 rounded-xl  hover: transition-all flex items-center gap-2 group/btn hover:scale-105">
                      Start Lesson
                      <app-icon name="arrow-right" [size]="16" class="transition-transform group-hover/btn:translate-x-1"></app-icon>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [],})
export class LessonBrowserComponent {
  selectLesson = output<Lesson>();

  curriculumService = inject(CurriculumService);

  disciplines = DISCIPLINES;
  technologies = TECHNOLOGIES;

  searchQuery = signal('');
  selectedDiscipline = signal<string | null>(null);
  selectedTech = signal<string | null>(null);

  constructor() {
    effect(() => {
      const disc = this.selectedDiscipline();
      untracked(() => {
        if (disc) {
          this.curriculumService.liveAnnouncement.set(`Discipline filter set to ${disc}.`);
        } else {
          this.curriculumService.liveAnnouncement.set('Discipline filter cleared.');
        }
      });
    });

    effect(() => {
      const tech = this.selectedTech();
      untracked(() => {
        if (tech) {
          this.curriculumService.liveAnnouncement.set(`Technology filter set to ${tech}.`);
        } else {
          this.curriculumService.liveAnnouncement.set('Technology filter cleared.');
        }
      });
    });
  }

  filteredLessons = computed(() => {
    let list = LESSONS;
    const query = this.searchQuery().toLowerCase().trim();
    const discipline = this.selectedDiscipline();
    const tech = this.selectedTech();

    if (query) {
      list = list.filter(l =>
        l.title.toLowerCase().includes(query) ||
        l.description.toLowerCase().includes(query) ||
        l.contentMarkdown.toLowerCase().includes(query)
      );
    }

    if (discipline) {
      list = list.filter(l => l.discipline === discipline);
    }

    if (tech) {
      list = list.filter(l => l.technologies.includes(tech));
    }

    return list;
  });

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedDiscipline.set(null);
    this.selectedTech.set(null);
    this.curriculumService.liveAnnouncement.set('All filters cleared.');
  }

  toggleCurriculum(event: Event, id: string): void {
    event.stopPropagation();
    if (this.curriculumService.isSaved(id)) {
      this.curriculumService.removeLesson(id);
    } else {
      this.curriculumService.saveLesson(id);
    }
  }
}
