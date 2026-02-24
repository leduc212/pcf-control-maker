import path from 'path';
import fs from 'fs/promises';
import type {
  LocalizationEntry,
  LocalizationFile,
  LocalizationProject,
  ResxEntry,
  LocalizationExportOptions,
  LocalizationImportResult,
} from '../../shared/types/localization.types';

export class LocalizationService {
  /**
   * Load localization project from a PCF control folder
   */
  async loadProject(projectPath: string): Promise<LocalizationProject | null> {
    try {
      const stringsPath = path.join(projectPath, 'strings');
      const exists = await this.pathExists(stringsPath);

      if (!exists) {
        // Create default strings folder and resx file
        return this.createDefaultProject(projectPath);
      }

      // Find all resx files
      const files = await fs.readdir(stringsPath);
      const resxFiles = files.filter((f) => f.endsWith('.resx'));

      const languages: string[] = [];
      const locFiles: LocalizationFile[] = [];
      const entriesMap = new Map<string, LocalizationEntry>();

      for (const file of resxFiles) {
        const filePath = path.join(stringsPath, file);
        const languageCode = this.extractLanguageCode(file);
        languages.push(languageCode);

        const entries = await this.parseResxFile(filePath);
        const stat = await fs.stat(filePath);

        locFiles.push({
          path: filePath,
          languageCode,
          displayName: this.getLanguageDisplayName(languageCode),
          entries: entries.map((e) => ({
            key: e.name,
            values: { [languageCode]: e.value },
            comment: e.comment,
          })),
          lastModified: stat.mtimeMs,
        });

        // Merge into entries map
        for (const entry of entries) {
          const existing = entriesMap.get(entry.name);
          if (existing) {
            existing.values[languageCode] = entry.value;
            if (entry.comment && !existing.comment) {
              existing.comment = entry.comment;
            }
          } else {
            entriesMap.set(entry.name, {
              key: entry.name,
              values: { [languageCode]: entry.value },
              comment: entry.comment,
            });
          }
        }
      }

      return {
        basePath: stringsPath,
        defaultLanguage: languages.includes('en') ? 'en' : languages[0] || 'en',
        languages,
        files: locFiles,
        entries: Array.from(entriesMap.values()),
      };
    } catch (error) {
      console.error('Failed to load localization project:', error);
      return null;
    }
  }

  /**
   * Create a default localization project
   */
  private async createDefaultProject(projectPath: string): Promise<LocalizationProject> {
    const stringsPath = path.join(projectPath, 'strings');
    await fs.mkdir(stringsPath, { recursive: true });

    // Find control name from manifest
    const controlName = await this.getControlName(projectPath);
    const defaultFile = path.join(stringsPath, `${controlName}.1033.resx`);

    // Create default resx file
    const defaultEntries: ResxEntry[] = [
      {
        name: `${controlName}_Display_Key`,
        value: controlName,
        comment: 'Display name for the control',
      },
      {
        name: `${controlName}_Desc_Key`,
        value: `${controlName} description`,
        comment: 'Description for the control',
      },
    ];

    await this.writeResxFile(defaultFile, defaultEntries);

    return {
      basePath: stringsPath,
      defaultLanguage: 'en',
      languages: ['en'],
      files: [
        {
          path: defaultFile,
          languageCode: 'en',
          displayName: 'English',
          entries: defaultEntries.map((e) => ({
            key: e.name,
            values: { en: e.value },
            comment: e.comment,
          })),
        },
      ],
      entries: defaultEntries.map((e) => ({
        key: e.name,
        values: { en: e.value },
        comment: e.comment,
      })),
    };
  }

  /**
   * Add a new entry
   */
  async addEntry(
    basePath: string,
    entry: LocalizationEntry
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const files = await fs.readdir(basePath);
      const resxFiles = files.filter((f) => f.endsWith('.resx'));

      for (const file of resxFiles) {
        const filePath = path.join(basePath, file);
        const languageCode = this.extractLanguageCode(file);
        const entries = await this.parseResxFile(filePath);

        // Check if entry already exists
        if (entries.some((e) => e.name === entry.key)) {
          continue;
        }

        // Add entry
        entries.push({
          name: entry.key,
          value: entry.values[languageCode] || '',
          comment: entry.comment,
        });

        await this.writeResxFile(filePath, entries);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Update an existing entry
   */
  async updateEntry(
    basePath: string,
    key: string,
    values: Record<string, string>,
    comment?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const files = await fs.readdir(basePath);
      const resxFiles = files.filter((f) => f.endsWith('.resx'));

      for (const file of resxFiles) {
        const filePath = path.join(basePath, file);
        const languageCode = this.extractLanguageCode(file);
        const entries = await this.parseResxFile(filePath);

        const entryIndex = entries.findIndex((e) => e.name === key);
        if (entryIndex >= 0) {
          entries[entryIndex].value = values[languageCode] || entries[entryIndex].value;
          if (comment !== undefined) {
            entries[entryIndex].comment = comment;
          }
        } else {
          // Add new entry if it doesn't exist
          entries.push({
            name: key,
            value: values[languageCode] || '',
            comment,
          });
        }

        await this.writeResxFile(filePath, entries);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Delete an entry
   */
  async deleteEntry(
    basePath: string,
    key: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const files = await fs.readdir(basePath);
      const resxFiles = files.filter((f) => f.endsWith('.resx'));

      for (const file of resxFiles) {
        const filePath = path.join(basePath, file);
        const entries = await this.parseResxFile(filePath);
        const filteredEntries = entries.filter((e) => e.name !== key);
        await this.writeResxFile(filePath, filteredEntries);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Add a new language
   */
  async addLanguage(
    basePath: string,
    languageCode: string,
    copyFromLanguage?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const files = await fs.readdir(basePath);
      const resxFiles = files.filter((f) => f.endsWith('.resx'));

      if (resxFiles.length === 0) {
        return { success: false, error: 'No existing resx files found' };
      }

      // Get the base name (without language code)
      const sourceFile = resxFiles[0];
      const baseName = this.getResxBaseName(sourceFile);
      const lcid = this.getLcidForLanguage(languageCode);
      const newFileName = `${baseName}.${lcid}.resx`;
      const newFilePath = path.join(basePath, newFileName);

      // Check if language already exists
      if (resxFiles.some((f) => this.extractLanguageCode(f) === languageCode)) {
        return { success: false, error: 'Language already exists' };
      }

      // Copy entries from source language or create empty
      let entries: ResxEntry[] = [];
      if (copyFromLanguage) {
        const sourceResx = resxFiles.find(
          (f) => this.extractLanguageCode(f) === copyFromLanguage
        );
        if (sourceResx) {
          entries = await this.parseResxFile(path.join(basePath, sourceResx));
        }
      } else {
        // Get keys from first file, set values to empty
        const firstFileEntries = await this.parseResxFile(path.join(basePath, resxFiles[0]));
        entries = firstFileEntries.map((e) => ({
          name: e.name,
          value: '',
          comment: e.comment,
        }));
      }

      await this.writeResxFile(newFilePath, entries);

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Export to CSV
   */
  async exportToCsv(
    basePath: string,
    outputPath: string,
    options: LocalizationExportOptions
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const project = await this.loadProject(path.dirname(basePath));
      if (!project) {
        return { success: false, error: 'Failed to load project' };
      }

      const languages = options.languages || project.languages;
      const headers = ['Key', ...languages];
      if (options.includeComments) {
        headers.push('Comment');
      }

      const rows = [headers.join(',')];
      for (const entry of project.entries) {
        const row = [
          this.escapeCsvField(entry.key),
          ...languages.map((lang) => this.escapeCsvField(entry.values[lang] || '')),
        ];
        if (options.includeComments) {
          row.push(this.escapeCsvField(entry.comment || ''));
        }
        rows.push(row.join(','));
      }

      await fs.writeFile(outputPath, rows.join('\n'), 'utf-8');

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Import from CSV
   */
  async importFromCsv(
    basePath: string,
    csvPath: string
  ): Promise<LocalizationImportResult> {
    try {
      const content = await fs.readFile(csvPath, 'utf-8');
      const lines = content.split('\n').filter((l) => l.trim());

      if (lines.length < 2) {
        return { success: false, imported: 0, skipped: 0, errors: ['Invalid CSV format'] };
      }

      const headers = this.parseCsvLine(lines[0]);
      const keyIndex = headers.findIndex((h) => h.toLowerCase() === 'key');
      if (keyIndex < 0) {
        return { success: false, imported: 0, skipped: 0, errors: ['Missing "Key" column'] };
      }

      const languageIndices = new Map<string, number>();
      for (let i = 0; i < headers.length; i++) {
        if (i !== keyIndex && headers[i].toLowerCase() !== 'comment') {
          languageIndices.set(headers[i].toLowerCase(), i);
        }
      }

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCsvLine(lines[i]);
        const key = values[keyIndex];

        if (!key) {
          skipped++;
          continue;
        }

        const entryValues: Record<string, string> = {};
        for (const [lang, index] of languageIndices) {
          entryValues[lang] = values[index] || '';
        }

        const result = await this.updateEntry(basePath, key, entryValues);
        if (result.success) {
          imported++;
        } else {
          errors.push(`Row ${i + 1}: ${result.error}`);
        }
      }

      return { success: true, imported, skipped, errors };
    } catch (error) {
      return { success: false, imported: 0, skipped: 0, errors: [(error as Error).message] };
    }
  }

  /**
   * Get missing translations
   */
  async getMissingTranslations(
    basePath: string
  ): Promise<{ key: string; missingLanguages: string[] }[]> {
    try {
      const project = await this.loadProject(path.dirname(basePath));
      if (!project) return [];

      const missing: { key: string; missingLanguages: string[] }[] = [];

      for (const entry of project.entries) {
        const missingLangs = project.languages.filter(
          (lang) => !entry.values[lang] || entry.values[lang].trim() === ''
        );
        if (missingLangs.length > 0) {
          missing.push({ key: entry.key, missingLanguages: missingLangs });
        }
      }

      return missing;
    } catch (error) {
      console.error('Failed to get missing translations:', error);
      return [];
    }
  }

  // Helper methods

  private async pathExists(p: string): Promise<boolean> {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }

  private async getControlName(projectPath: string): Promise<string> {
    try {
      const manifestPath = path.join(projectPath, 'ControlManifest.Input.xml');
      const content = await fs.readFile(manifestPath, 'utf-8');
      const match = content.match(/constructor="([^"]+)"/);
      return match ? match[1] : 'Control';
    } catch {
      return 'Control';
    }
  }

  private extractLanguageCode(filename: string): string {
    // Extract LCID from filename like "Control.1033.resx"
    const match = filename.match(/\.(\d{4})\.resx$/);
    if (match) {
      return this.getLanguageFromLcid(match[1]);
    }
    return 'en';
  }

  private getResxBaseName(filename: string): string {
    return filename.replace(/\.\d{4}\.resx$/, '');
  }

  private getLanguageFromLcid(lcid: string): string {
    const lcidMap: Record<string, string> = {
      '1033': 'en',
      '1031': 'de',
      '1034': 'es',
      '1036': 'fr',
      '1040': 'it',
      '1041': 'ja',
      '1042': 'ko',
      '1043': 'nl',
      '1045': 'pl',
      '1046': 'pt-BR',
      '2070': 'pt-PT',
      '1049': 'ru',
      '2052': 'zh-CN',
      '1028': 'zh-TW',
      '1025': 'ar',
      '1037': 'he',
      '1081': 'hi',
      '1054': 'th',
      '1055': 'tr',
      '1066': 'vi',
    };
    return lcidMap[lcid] || 'en';
  }

  private getLcidForLanguage(languageCode: string): string {
    const languageMap: Record<string, string> = {
      en: '1033',
      de: '1031',
      es: '1034',
      fr: '1036',
      it: '1040',
      ja: '1041',
      ko: '1042',
      nl: '1043',
      pl: '1045',
      'pt-BR': '1046',
      'pt-PT': '2070',
      ru: '1049',
      'zh-CN': '2052',
      'zh-TW': '1028',
      ar: '1025',
      he: '1037',
      hi: '1081',
      th: '1054',
      tr: '1055',
      vi: '1066',
    };
    return languageMap[languageCode] || '1033';
  }

  private getLanguageDisplayName(code: string): string {
    const names: Record<string, string> = {
      en: 'English',
      de: 'German',
      es: 'Spanish',
      fr: 'French',
      it: 'Italian',
      ja: 'Japanese',
      ko: 'Korean',
      nl: 'Dutch',
      pl: 'Polish',
      'pt-BR': 'Portuguese (Brazil)',
      'pt-PT': 'Portuguese (Portugal)',
      ru: 'Russian',
      'zh-CN': 'Chinese (Simplified)',
      'zh-TW': 'Chinese (Traditional)',
      ar: 'Arabic',
      he: 'Hebrew',
      hi: 'Hindi',
      th: 'Thai',
      tr: 'Turkish',
      vi: 'Vietnamese',
    };
    return names[code] || code;
  }

  private async parseResxFile(filePath: string): Promise<ResxEntry[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const entries: ResxEntry[] = [];

    // Simple regex-based parsing
    const dataRegex = /<data name="([^"]+)"[^>]*>\s*<value>([^<]*)<\/value>(?:\s*<comment>([^<]*)<\/comment>)?/g;
    let match;

    while ((match = dataRegex.exec(content)) !== null) {
      entries.push({
        name: match[1],
        value: this.decodeXmlEntities(match[2]),
        comment: match[3] ? this.decodeXmlEntities(match[3]) : undefined,
      });
    }

    return entries;
  }

  private async writeResxFile(filePath: string, entries: ResxEntry[]): Promise<void> {
    const header = `<?xml version="1.0" encoding="utf-8"?>
<root>
  <xsd:schema id="root" xmlns="" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:msdata="urn:schemas-microsoft-com:xml-msdata">
    <xsd:import namespace="http://www.w3.org/XML/1998/namespace" />
    <xsd:element name="root" msdata:IsDataSet="true">
      <xsd:complexType>
        <xsd:choice maxOccurs="unbounded">
          <xsd:element name="metadata">
            <xsd:complexType>
              <xsd:sequence>
                <xsd:element name="value" type="xsd:string" minOccurs="0" />
              </xsd:sequence>
              <xsd:attribute name="name" use="required" type="xsd:string" />
              <xsd:attribute name="type" type="xsd:string" />
              <xsd:attribute name="mimetype" type="xsd:string" />
              <xsd:attribute ref="xml:space" />
            </xsd:complexType>
          </xsd:element>
          <xsd:element name="assembly">
            <xsd:complexType>
              <xsd:attribute name="alias" type="xsd:string" />
              <xsd:attribute name="name" type="xsd:string" />
            </xsd:complexType>
          </xsd:element>
          <xsd:element name="data">
            <xsd:complexType>
              <xsd:sequence>
                <xsd:element name="value" type="xsd:string" minOccurs="0" msdata:Ordinal="1" />
                <xsd:element name="comment" type="xsd:string" minOccurs="0" msdata:Ordinal="2" />
              </xsd:sequence>
              <xsd:attribute name="name" type="xsd:string" use="required" msdata:Ordinal="1" />
              <xsd:attribute name="type" type="xsd:string" msdata:Ordinal="3" />
              <xsd:attribute name="mimetype" type="xsd:string" msdata:Ordinal="4" />
              <xsd:attribute ref="xml:space" />
            </xsd:complexType>
          </xsd:element>
          <xsd:element name="resheader">
            <xsd:complexType>
              <xsd:sequence>
                <xsd:element name="value" type="xsd:string" minOccurs="0" msdata:Ordinal="1" />
              </xsd:sequence>
              <xsd:attribute name="name" type="xsd:string" use="required" />
            </xsd:complexType>
          </xsd:element>
        </xsd:choice>
      </xsd:complexType>
    </xsd:element>
  </xsd:schema>
  <resheader name="resmimetype">
    <value>text/microsoft-resx</value>
  </resheader>
  <resheader name="version">
    <value>2.0</value>
  </resheader>
  <resheader name="reader">
    <value>System.Resources.ResXResourceReader, System.Windows.Forms, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089</value>
  </resheader>
  <resheader name="writer">
    <value>System.Resources.ResXResourceWriter, System.Windows.Forms, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089</value>
  </resheader>
`;

    const dataElements = entries
      .map((entry) => {
        const comment = entry.comment
          ? `\n    <comment>${this.encodeXmlEntities(entry.comment)}</comment>`
          : '';
        return `  <data name="${entry.name}" xml:space="preserve">
    <value>${this.encodeXmlEntities(entry.value)}</value>${comment}
  </data>`;
      })
      .join('\n');

    const content = `${header}${dataElements}\n</root>`;
    await fs.writeFile(filePath, content, 'utf-8');
  }

  private encodeXmlEntities(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private decodeXmlEntities(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }

  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);

    return result;
  }
}
