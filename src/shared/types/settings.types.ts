export interface AppSettings {
  // PCF Defaults
  defaultNamespace: string;
  defaultPublisherName: string;
  defaultPublisherPrefix: string;
  defaultTemplate: 'field' | 'dataset';
  defaultFramework: 'none' | 'react';

  // UI Preferences
  theme: 'light' | 'dark' | 'system';
  showCommandPreview: boolean;

  // Editor Preferences
  defaultEditor: string; // e.g., 'code' for VS Code
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultNamespace: 'PCFControls',
  defaultPublisherName: 'DefaultPublisher',
  defaultPublisherPrefix: 'dev',
  defaultTemplate: 'field',
  defaultFramework: 'react',
  theme: 'light',
  showCommandPreview: true,
  defaultEditor: 'code',
};
