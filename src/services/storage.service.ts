import { Injectable, signal } from '@angular/core';
import { SavedItem } from '../models/creative-types';

export type Theme = 'light' | 'dark' | 'brand';
export type BgTheme = 'none' | 'breathe' | 'flow' | 'move';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly ITEMS_STORAGE_KEY = 'spark_deck_saved';
  private readonly THEME_STORAGE_KEY = 'spark_deck_theme';
  private readonly BG_THEME_STORAGE_KEY = 'spark_deck_bg_theme';
  
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
    const storedTheme = localStorage.getItem(this.THEME_STORAGE_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'brand') {
      return storedTheme;
    }

    // If no theme is stored, respect the user's system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    // Default to light theme if nothing is set or value is invalid
    return 'light';
  }

  saveTheme(theme: Theme): void {
    localStorage.setItem(this.THEME_STORAGE_KEY, theme);
  }

  // --- BgTheme Management ---
  getBgTheme(): BgTheme {
    const stored = localStorage.getItem(this.BG_THEME_STORAGE_KEY);
    if (stored === 'none' || stored === 'breathe' || stored === 'flow' || stored === 'move') {
      return stored;
    }
    return 'none';
  }

  saveBgTheme(bgTheme: BgTheme): void {
    localStorage.setItem(this.BG_THEME_STORAGE_KEY, bgTheme);
  }
}