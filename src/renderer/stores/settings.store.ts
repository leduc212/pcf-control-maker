import { create } from 'zustand';
import type { AppSettings } from '../../shared/types/settings.types';
import { DEFAULT_SETTINGS } from '../../shared/types/settings.types';

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  isSaving: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<boolean>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: true,
  isSaving: false,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await window.electronAPI.settings.get();
      set({ settings, isLoading: false });
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ settings: DEFAULT_SETTINGS, isLoading: false });
    }
  },

  saveSettings: async (settings: AppSettings) => {
    set({ isSaving: true });
    try {
      const success = await window.electronAPI.settings.save(settings);
      if (success) {
        set({ settings, isSaving: false });
      }
      return success;
    } catch (error) {
      console.error('Failed to save settings:', error);
      set({ isSaving: false });
      return false;
    }
  },

  updateSettings: async (partial: Partial<AppSettings>) => {
    set({ isSaving: true });
    try {
      const updated = await window.electronAPI.settings.update(partial);
      set({ settings: updated, isSaving: false });
    } catch (error) {
      console.error('Failed to update settings:', error);
      set({ isSaving: false });
    }
  },

  resetSettings: async () => {
    set({ isSaving: true });
    try {
      const settings = await window.electronAPI.settings.reset();
      set({ settings, isSaving: false });
    } catch (error) {
      console.error('Failed to reset settings:', error);
      set({ isSaving: false });
    }
  },
}));
