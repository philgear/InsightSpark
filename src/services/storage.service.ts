import { Injectable, signal } from '@angular/core';
import { SavedItem } from '../models/creative-types';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly ITEMS_STORAGE_KEY = 'spark_deck_saved';
  private readonly THEME_STORAGE_KEY = 'spark_deck_theme';
  
  // The service holds the state in a private writable signal
  private _savedItems = signal<SavedItem[]>(this.loadFromStorage());

  // Expose a read-only signal to the rest of the app
  readonly savedItems = this._savedItems.asReadonly();

  private loadFromStorage(): SavedItem[] {
    try {
      const data = localStorage.getItem(this.ITEMS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading from localStorage', e);
      return [];
    }
  }

  saveItem(item: SavedItem): void {
    try {
      this._savedItems.update(current => {
        // Avoid duplicates check inside the update
        if (current.some(i => i.id === item.id)) return current;
        
        const updated = [item, ...current];
        this.persist(updated);
        return updated;
      });
    } catch (e) {
      console.error('Error updating state', e);
    }
  }

  removeItem(id: string): void {
    try {
      this._savedItems.update(current => {
        const updated = current.filter(i => i.id !== id);
        this.persist(updated);
        return updated;
      });
    } catch (e) {
      console.error('Error updating state', e);
    }
  }

  private persist(data: SavedItem[]) {
    localStorage.setItem(this.ITEMS_STORAGE_KEY, JSON.stringify(data));
  }

  // --- Theme Management ---
  getTheme(): Theme {
    const theme = localStorage.getItem(this.THEME_STORAGE_KEY);
    if (theme === 'light' || theme === 'dark') {
      return theme;
    }
    // Default to dark theme if nothing is set or value is invalid
    return 'dark';
  }

  saveTheme(theme: Theme): void {
    localStorage.setItem(this.THEME_STORAGE_KEY, theme);
  }
}