import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';
import type { AppSettings } from '../../shared/types/settings.types';
import { DEFAULT_SETTINGS } from '../../shared/types/settings.types';

const SETTINGS_FILE = 'settings.json';

export class SettingsService {
  private getSettingsPath(): string {
    return path.join(app.getPath('userData'), SETTINGS_FILE);
  }

  async getSettings(): Promise<AppSettings> {
    try {
      const filePath = this.getSettingsPath();
      const content = await fs.readFile(filePath, 'utf-8');
      const saved = JSON.parse(content);
      // Merge with defaults to handle new settings added in updates
      return { ...DEFAULT_SETTINGS, ...saved };
    } catch {
      // Return defaults if file doesn't exist or is invalid
      return { ...DEFAULT_SETTINGS };
    }
  }

  async saveSettings(settings: AppSettings): Promise<boolean> {
    try {
      const filePath = this.getSettingsPath();
      await fs.writeFile(filePath, JSON.stringify(settings, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  async updateSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...partial };
    await this.saveSettings(updated);
    return updated;
  }

  async resetSettings(): Promise<AppSettings> {
    await this.saveSettings(DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS };
  }
}
