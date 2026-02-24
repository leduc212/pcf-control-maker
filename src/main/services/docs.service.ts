import fs from 'fs/promises';
import type { DocGeneratorInput, GeneratedDoc } from '../../shared/types/tools.types';
import { GitService } from './git.service';

const gitService = new GitService();

export class DocsService {
  async generateReadme(input: DocGeneratorInput): Promise<GeneratedDoc> {
    const manifestContent = await fs.readFile(input.manifestPath, 'utf-8');

    // Extract control tag attributes
    const controlTag = manifestContent.match(/<control\s+[^>]+>/)?.[0] || '';
    const namespace = controlTag.match(/namespace="([^"]+)"/)?.[1] || '';
    const constructor = controlTag.match(/constructor="([^"]+)"/)?.[1] || '';
    const displayName = controlTag.match(/display-name-key="([^"]+)"/)?.[1] || constructor;
    const description = controlTag.match(/description-key="([^"]+)"/)?.[1] || '';
    const version = controlTag.match(/version="([^"]+)"/)?.[1] || '1.0.0';

    // Determine control type (field vs dataset)
    const isDataset = /<data-set\s/.test(manifestContent);
    const controlType = isDataset ? 'dataset' : 'field';

    // Extract properties
    const propertyRegex = /<property\s+([^/]*?)\/>/g;
    const properties: Array<{
      name: string;
      displayName: string;
      ofType: string;
      required: boolean;
      defaultValue: string;
    }> = [];

    let match: RegExpExecArray | null;
    while ((match = propertyRegex.exec(manifestContent)) !== null) {
      const attrs = match[1];
      properties.push({
        name: attrs.match(/name="([^"]+)"/)?.[1] || '',
        displayName: attrs.match(/display-name-key="([^"]+)"/)?.[1] || '',
        ofType: attrs.match(/of-type="([^"]+)"/)?.[1] || '',
        required: attrs.match(/required="([^"]+)"/)?.[1] === 'true',
        defaultValue: attrs.match(/default-value="([^"]+)"/)?.[1] || '',
      });
    }

    // Build property table
    let propertyTable = '';
    if (properties.length > 0) {
      propertyTable = '| Name | Display Name | Type | Required | Default |\n';
      propertyTable += '|------|-------------|------|----------|--------|\n';
      for (const prop of properties) {
        propertyTable += `| ${prop.name} | ${prop.displayName} | ${prop.ofType} | ${prop.required ? 'Yes' : 'No'} | ${prop.defaultValue || '-'} |\n`;
      }
    }

    // Build usage examples
    let usageExamples = '';
    if (input.includeUsageExamples) {
      if (controlType === 'dataset') {
        usageExamples = `## Usage\n\n`;
        usageExamples += `This is a **dataset** control. Bind it to a view or subgrid in your model-driven app.\n\n`;
        usageExamples += `1. Add the control to a subgrid or view in the form editor\n`;
        usageExamples += `2. Configure the dataset columns as needed\n`;
        usageExamples += `3. Save and publish your customizations\n`;
      } else {
        usageExamples = `## Usage\n\n`;
        usageExamples += `This is a **field** control. Bind it to a field on your form.\n\n`;
        usageExamples += `1. Open the form editor for your entity\n`;
        usageExamples += `2. Select the target field and switch to this custom control\n`;
        if (properties.length > 0) {
          usageExamples += `3. Configure the following properties:\n`;
          for (const prop of properties) {
            usageExamples += `   - **${prop.displayName}** (${prop.ofType})${prop.required ? ' - Required' : ''}\n`;
          }
        }
        usageExamples += `4. Save and publish your customizations\n`;
      }
    }

    // Build changelog
    let changelogSection = '';
    if (input.includeChangelog) {
      try {
        const commits = await gitService.getCommits(input.projectPath, 20);
        if (commits.length > 0) {
          changelogSection = `## Changelog\n\n`;
          for (const commit of commits) {
            changelogSection += `- **${commit.shortHash}** ${commit.message} (${commit.date})\n`;
          }
        }
      } catch {
        changelogSection = `## Changelog\n\n_Git history not available._\n`;
      }
    }

    // Build full README
    const sections: string[] = [];
    sections.push(`# ${displayName}\n`);
    if (description) {
      sections.push(`${description}\n`);
    }
    sections.push(`- **Namespace:** \`${namespace}\``);
    sections.push(`- **Version:** \`${version}\``);
    sections.push(`- **Type:** ${controlType}\n`);

    if (propertyTable) {
      sections.push(`## Properties\n\n${propertyTable}`);
    }

    if (usageExamples) {
      sections.push(usageExamples);
    }

    sections.push(`## Development\n`);
    sections.push('```bash');
    sections.push('npm install');
    sections.push('npm start');
    sections.push('```\n');

    sections.push(`## Building\n`);
    sections.push('```bash');
    sections.push('npm run build');
    sections.push('```\n');

    if (changelogSection) {
      sections.push(changelogSection);
    }

    const readme = sections.join('\n');

    return {
      readme,
      propertyTable,
      changelogSection,
      usageExamples,
    };
  }
}
