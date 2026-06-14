import { Injectable, signal, computed } from '@angular/core';
import { Lesson, LESSONS } from '../models/portfolio-data';

@Injectable({
  providedIn: 'root'
})
export class CurriculumService {
  private readonly STORAGE_KEY = 'geararts_curriculum';

  private _savedLessonIds = signal<string[]>(this.loadFromStorage());
  readonly savedLessonIds = this._savedLessonIds.asReadonly();
  liveAnnouncement = signal<string>('');

  /** Full Lesson objects for all saved IDs */
  readonly savedLessons = computed<Lesson[]>(() =>
    this._savedLessonIds()
      .map(id => LESSONS.find(l => l.id === id))
      .filter((l): l is Lesson => !!l)
  );

  /** Distinct disciplines across saved lessons */
  readonly savedDisciplines = computed<string[]>(() =>
    [...new Set(this.savedLessons().map(l => l.discipline))]
  );

  /** Distinct technologies across saved lessons */
  readonly savedTechnologies = computed<string[]>(() =>
    [...new Set(this.savedLessons().flatMap(l => l.technologies))]
  );

  /** Lessons grouped by discipline */
  readonly lessonsByDiscipline = computed<{ discipline: string; lessons: Lesson[] }[]>(() => {
    const groups: Record<string, Lesson[]> = {};
    for (const lesson of this.savedLessons()) {
      if (!groups[lesson.discipline]) groups[lesson.discipline] = [];
      groups[lesson.discipline].push(lesson);
    }
    return Object.entries(groups).map(([discipline, lessons]) => ({ discipline, lessons }));
  });

  private loadFromStorage(): string[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading curriculum from localStorage', e);
      return [];
    }
  }

  saveLesson(lessonId: string): void {
    this._savedLessonIds.update(current => {
      if (current.includes(lessonId)) return current;
      const updated = [...current, lessonId];
      this.persist(updated);
      const lesson = LESSONS.find(l => l.id === lessonId);
      if (lesson) {
        this.liveAnnouncement.set(`Saved lesson "${lesson.title}" to curriculum.`);
      }
      return updated;
    });
  }

  removeLesson(lessonId: string): void {
    this._savedLessonIds.update(current => {
      const updated = current.filter(id => id !== lessonId);
      this.persist(updated);
      const lesson = LESSONS.find(l => l.id === lessonId);
      if (lesson) {
        this.liveAnnouncement.set(`Removed lesson "${lesson.title}" from curriculum.`);
      }
      return updated;
    });
  }

  clearAll(): void {
    this._savedLessonIds.set([]);
    this.persist([]);
    this.liveAnnouncement.set('Cleared all lessons from curriculum.');
  }

  isSaved(lessonId: string): boolean {
    return this._savedLessonIds().includes(lessonId);
  }

  private persist(data: string[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving curriculum to localStorage', e);
    }
  }
}
