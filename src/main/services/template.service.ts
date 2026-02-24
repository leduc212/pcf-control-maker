import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { spawn } from 'child_process';
import { BUILT_IN_TEMPLATES } from '../../shared/constants/templates.constants';
import type { ControlTemplate, TemplateCreateOptions } from '../../shared/types/template.types';

export class TemplateService {
  /**
   * Get all available templates (built-in + custom)
   */
  async getTemplates(): Promise<ControlTemplate[]> {
    // For now, just return built-in templates
    // Custom templates can be added later from user's template directory
    return BUILT_IN_TEMPLATES;
  }

  /**
   * Get a single template by ID
   */
  async getTemplate(templateId: string): Promise<ControlTemplate | null> {
    const templates = await this.getTemplates();
    return templates.find(t => t.id === templateId) || null;
  }

  /**
   * Create a new PCF project from a template
   */
  async createFromTemplate(options: TemplateCreateOptions): Promise<{ success: boolean; error?: string; projectPath?: string }> {
    const { templateId, projectPath, controlName, namespace, publisherPrefix } = options;

    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        return { success: false, error: `Template not found: ${templateId}` };
      }

      // Create project root directory
      const projectRoot = path.join(projectPath, controlName);
      await fs.mkdir(projectRoot, { recursive: true });

      // Create source subdirectory (standard PCF layout: source files in ControlName/ subfolder)
      const sourceDir = path.join(projectRoot, controlName);
      await fs.mkdir(sourceDir, { recursive: true });

      // Generate ControlManifest.Input.xml (in source subdirectory)
      const manifestXml = this.generateManifestXml(template, controlName, namespace, publisherPrefix);
      await fs.writeFile(path.join(sourceDir, 'ControlManifest.Input.xml'), manifestXml, 'utf-8');

      // Generate index.ts (in source subdirectory)
      const indexTs = this.processTemplateCode(template.indexTs, controlName, namespace);
      await fs.writeFile(path.join(sourceDir, 'index.ts'), indexTs, 'utf-8');

      // Generate CSS if exists (in source subdirectory)
      if (template.indexCss) {
        const cssDir = path.join(sourceDir, 'css');
        await fs.mkdir(cssDir, { recursive: true });
        await fs.writeFile(path.join(cssDir, `${controlName}.css`), template.indexCss, 'utf-8');
      }

      // Generate config files at project root
      const packageJson = this.generatePackageJson(controlName);
      await fs.writeFile(path.join(projectRoot, 'package.json'), packageJson, 'utf-8');

      const tsConfig = this.generateTsConfig();
      await fs.writeFile(path.join(projectRoot, 'tsconfig.json'), tsConfig, 'utf-8');

      const eslintConfig = this.generateEslintConfig();
      await fs.writeFile(path.join(projectRoot, '.eslintrc.json'), eslintConfig, 'utf-8');

      const pcfConfig = this.generatePcfConfig();
      await fs.writeFile(path.join(projectRoot, 'pcfconfig.json'), pcfConfig, 'utf-8');

      // Run npm install
      const npmResult = await this.runNpmInstall(projectRoot);
      if (!npmResult.success) {
        return {
          success: true,
          projectPath: projectRoot,
          error: `Project created but npm install failed: ${npmResult.stderr}. Run npm install manually.`,
        };
      }

      return { success: true, projectPath: projectRoot };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private getEnhancedEnv(): NodeJS.ProcessEnv {
    const homeDir = os.homedir();
    const isWindows = process.platform === 'win32';
    const env: NodeJS.ProcessEnv = { ...process.env };

    if (isWindows) {
      const systemRoot = env.SystemRoot || env.SYSTEMROOT || 'C:\\Windows';
      const system32 = path.join(systemRoot, 'System32');
      env.SystemRoot = systemRoot;
      env.SYSTEMROOT = systemRoot;
      env.ComSpec = env.ComSpec || env.COMSPEC || path.join(system32, 'cmd.exe');
      env.COMSPEC = env.ComSpec;

      const dotnetToolsPath = path.join(homeDir, '.dotnet', 'tools');
      const pathParts: string[] = [dotnetToolsPath, system32, systemRoot, path.join(system32, 'Wbem')];
      const currentPath = env.PATH || env.Path || '';
      if (currentPath) {
        pathParts.push(currentPath);
      }
      env.PATH = pathParts.join(';');
      env.Path = env.PATH;
    } else {
      const dotnetToolsPath = path.join(homeDir, '.dotnet', 'tools');
      const currentPath = env.PATH || '';
      if (!currentPath.includes(dotnetToolsPath)) {
        env.PATH = `${dotnetToolsPath}:${currentPath}`;
      }
    }

    return env;
  }

  private runNpmInstall(cwd: string): Promise<{ success: boolean; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      const env = this.getEnhancedEnv();

      const proc = spawn('npm', ['install'], {
        cwd,
        env,
        shell: true,
        windowsHide: true,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('error', (error) => {
        resolve({ success: false, stdout, stderr: stderr || error.message });
      });

      proc.on('close', (code) => {
        resolve({ success: code === 0, stdout, stderr });
      });
    });
  }

  private generateManifestXml(
    template: ControlTemplate,
    controlName: string,
    namespace: string,
    publisherPrefix?: string
  ): string {
    // PCF namespace only allows alphanumeric and dots, not underscores
    // Format: PublisherPrefix.Namespace (e.g., Contoso.Controls)
    const prefix = publisherPrefix || 'SamplePublisher';
    const fullNamespace = `${prefix}.${namespace}`;

    const properties = template.properties
      .map(prop => {
        const attrs = [
          `name="${prop.name}"`,
          `display-name-key="${prop.displayName}"`,
          `description-key="${prop.description}"`,
          `of-type="${prop.ofType}"`,
          `usage="${prop.usage}"`,
          `required="${prop.required}"`,
        ];
        if (prop.defaultValue) {
          attrs.push(`default-value="${prop.defaultValue}"`);
        }
        return `    <property ${attrs.join(' ')} />`;
      })
      .join('\n');

    const resources = template.resources
      .map(res => {
        if (res.type === 'code') {
          return `      <code path="${res.path}" order="${res.order || 1}" />`;
        } else if (res.type === 'css') {
          // Replace template path with control-specific path
          const cssPath = res.path.replace(/\/[^/]+\.css$/, `/${controlName}.css`);
          return `      <css path="${cssPath}" order="${res.order || 1}" />`;
        } else if (res.type === 'resx') {
          return `      <resx path="${res.path}" version="1.0.0" />`;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');

    const featureUsage = Object.entries(template.featureUsage)
      .filter(([_, enabled]) => enabled)
      .map(([feature]) => `      <uses-feature name="${feature}" required="true" />`)
      .join('\n');

    const platformLibs = template.platformLibraries
      .map(lib => `      <platform-library name="${lib.name}" version="${lib.version}" />`)
      .join('\n');

    return `<?xml version="1.0" encoding="utf-8" ?>
<manifest>
  <control namespace="${fullNamespace}" constructor="${controlName}" version="0.0.1" display-name-key="${controlName}" description-key="${controlName} description" control-type="${template.controlType}">
${properties}
    <resources>
${resources}
${featureUsage}
${platformLibs}
    </resources>
  </control>
</manifest>
`;
  }

  private processTemplateCode(code: string, controlName: string, namespace: string): string {
    // Replace template class name with actual control name
    return code
      .replace(/export class \w+ implements/g, `export class ${controlName} implements`);
  }

  private generatePackageJson(controlName: string): string {
    return JSON.stringify({
      name: controlName.toLowerCase(),
      version: '0.0.1',
      description: `${controlName} PCF Control`,
      scripts: {
        build: 'pcf-scripts build',
        start: 'pcf-scripts start watch',
        clean: 'pcf-scripts clean',
      },
      dependencies: {},
      devDependencies: {
        '@types/node': '^18.0.0',
        '@types/powerapps-component-framework': '^1.3.4',
        '@typescript-eslint/eslint-plugin': '^5.0.0',
        '@typescript-eslint/parser': '^5.0.0',
        eslint: '^8.0.0',
        'pcf-scripts': '^1',
        'pcf-start': '^1',
        typescript: '^4.9.0',
      },
    }, null, 2);
  }

  private generateTsConfig(): string {
    // Minimal PCF-compatible tsconfig - let pcf-scripts handle most settings
    return JSON.stringify({
      extends: './node_modules/pcf-scripts/tsconfig_base.json',
      compilerOptions: {
        typeRoots: ['node_modules/@types'],
      },
    }, null, 2);
  }

  private generatePcfConfig(): string {
    return JSON.stringify({
      outDir: './out/controls',
    }, null, 2);
  }

  private generateEslintConfig(): string {
    return JSON.stringify({
      parser: '@typescript-eslint/parser',
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
      ],
      plugins: ['@typescript-eslint'],
      env: {
        browser: true,
        es6: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      },
    }, null, 2);
  }
}
