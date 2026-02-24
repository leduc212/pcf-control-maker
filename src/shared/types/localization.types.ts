export interface LocalizationEntry {
  key: string;
  values: Record<string, string>; // languageCode -> value
  comment?: string;
}

export interface LocalizationFile {
  path: string;
  languageCode: string;
  displayName: string;
  entries: LocalizationEntry[];
  lastModified?: number;
}

export interface LocalizationProject {
  basePath: string;
  defaultLanguage: string;
  languages: string[];
  files: LocalizationFile[];
  entries: LocalizationEntry[];
}

export interface ResxEntry {
  name: string;
  value: string;
  comment?: string;
}

export interface ResxFile {
  path: string;
  entries: ResxEntry[];
}

export interface LocalizationExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  includeComments: boolean;
  languages?: string[];
}

export interface LocalizationImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export const SUPPORTED_LANGUAGES: { code: string; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'ar', name: 'Arabic' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'vi', name: 'Vietnamese' },
];
