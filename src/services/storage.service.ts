import { Injectable, signal } from '@angular/core';
import { SavedItem, CareRole } from '../models/creative-types';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly ITEMS_STORAGE_KEY = 'spark_deck_saved';
  private readonly THEME_STORAGE_KEY = 'spark_deck_theme';
  private readonly CUSTOM_ROLES_KEY = 'spark_custom_roles';
  
  // State signals
  private _savedItems = signal<SavedItem[]>(this.loadFromStorage());
  private _customRoles = signal<CareRole[]>(this.loadCustomRoles());

  // Read-only signals
  readonly savedItems = this._savedItems.asReadonly();
  readonly customRoles = this._customRoles.asReadonly();

  private loadFromStorage(): SavedItem[] {
    try {
      const data = localStorage.getItem(this.ITEMS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading from localStorage', e);
      return [];
    }
  }

  private loadCustomRoles(): CareRole[] {
    try {
      const data = localStorage.getItem(this.CUSTOM_ROLES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading custom roles from localStorage', e);
      return [];
    }
  }

  saveItem(item: SavedItem): void {
    try {
      this._savedItems.update(current => {
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

  saveCustomRole(role: CareRole): void {
    try {
      this._customRoles.update(current => {
        const filtered = current.filter(r => r.name.toLowerCase() !== role.name.toLowerCase());
        const updated = [role, ...filtered];
        localStorage.setItem(this.CUSTOM_ROLES_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error('Error saving custom role', e);
    }
  }

  removeCustomRole(roleName: string): void {
    try {
      this._customRoles.update(current => {
        const updated = current.filter(r => r.name.toLowerCase() !== roleName.toLowerCase());
        localStorage.setItem(this.CUSTOM_ROLES_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error('Error removing custom role', e);
    }
  }

  private persist(data: SavedItem[]) {
    localStorage.setItem(this.ITEMS_STORAGE_KEY, JSON.stringify(data));
  }

  // --- Theme Management ---
  getTheme(): Theme {
    const storedTheme = localStorage.getItem(this.THEME_STORAGE_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }

    return 'dark';
  }

  saveTheme(theme: Theme): void {
    localStorage.setItem(this.THEME_STORAGE_KEY, theme);
  }
}