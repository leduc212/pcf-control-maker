import path from 'path';
import { ZipService } from './zip.service';
import type { SolutionDiffInput, SolutionDiffResult, ComponentDiff, DiffLine } from '../../shared/types/tools.types';

const zipService = new ZipService();

export class DiffService {
  async compareSolutions(input: SolutionDiffInput): Promise<SolutionDiffResult> {
    const infoA = await zipService.readSolutionXmlFromZip(input.zipPathA);
    const infoB = await zipService.readSolutionXmlFromZip(input.zipPathB);

    if (!infoA || !infoB) {
      const missing = !infoA ? input.zipPathA : input.zipPathB;
      throw new Error(`Could not read solution.xml from: ${path.basename(missing)}`);
    }

    const labelA = path.basename(input.zipPathA);
    const labelB = path.basename(input.zipPathB);

    // Parse RootComponent elements from each XML
    const componentsA = this.parseComponents(infoA.rawXml);
    const componentsB = this.parseComponents(infoB.rawXml);

    // Compare components
    const componentDiffs = this.diffComponents(componentsA, componentsB);

    // Line-by-line diff of XML content
    const xmlDiffLines = this.diffXml(infoA.rawXml, infoB.rawXml);

    // Build summary
    const added = componentDiffs.filter(c => c.status === 'added').length;
    const removed = componentDiffs.filter(c => c.status === 'removed').length;
    const modified = componentDiffs.filter(c => c.status === 'modified').length;
    const unchanged = componentDiffs.filter(c => c.status === 'unchanged').length;

    const summaryParts: string[] = [];
    if (infoA.version !== infoB.version) {
      summaryParts.push(`Version changed: ${infoA.version} → ${infoB.version}`);
    }
    if (infoA.publisherName !== infoB.publisherName) {
      summaryParts.push(`Publisher changed: ${infoA.publisherName} → ${infoB.publisherName}`);
    }
    summaryParts.push(`Components: ${added} added, ${removed} removed, ${modified} modified, ${unchanged} unchanged`);

    return {
      labelA,
      labelB,
      versionA: infoA.version,
      versionB: infoB.version,
      publisherA: infoA.publisherName,
      publisherB: infoB.publisherName,
      uniqueNameA: infoA.uniqueName,
      uniqueNameB: infoB.uniqueName,
      componentDiffs,
      xmlDiffLines,
      summary: summaryParts.join('\n'),
    };
  }

  private parseComponents(xml: string): Array<{ name: string; type: string }> {
    const components: Array<{ name: string; type: string }> = [];
    const regex = /<RootComponent\s+([^>]*?)\/>/g;

    let match: RegExpExecArray | null;
    while ((match = regex.exec(xml)) !== null) {
      const attrs = match[1];
      const schemaName = attrs.match(/schemaName="([^"]+)"/)?.[1] ||
                         attrs.match(/id="\{?([^}"]+)\}?"/)?.[1] || '';
      const type = attrs.match(/type="([^"]+)"/)?.[1] || 'unknown';
      if (schemaName) {
        components.push({ name: schemaName, type });
      }
    }

    return components;
  }

  private diffComponents(
    componentsA: Array<{ name: string; type: string }>,
    componentsB: Array<{ name: string; type: string }>
  ): ComponentDiff[] {
    const diffs: ComponentDiff[] = [];
    const namesA = new Set(componentsA.map(c => c.name));
    const namesB = new Set(componentsB.map(c => c.name));

    // Components in both
    for (const comp of componentsA) {
      if (namesB.has(comp.name)) {
        const compB = componentsB.find(c => c.name === comp.name);
        diffs.push({
          name: comp.name,
          type: comp.type,
          status: comp.type !== compB?.type ? 'modified' : 'unchanged',
        });
      } else {
        diffs.push({ name: comp.name, type: comp.type, status: 'removed' });
      }
    }

    // Components only in B
    for (const comp of componentsB) {
      if (!namesA.has(comp.name)) {
        diffs.push({ name: comp.name, type: comp.type, status: 'added' });
      }
    }

    return diffs;
  }

  private diffXml(xmlA: string, xmlB: string): DiffLine[] {
    const linesA = xmlA.split('\n');
    const linesB = xmlB.split('\n');
    const diffLines: DiffLine[] = [];

    // Simple LCS-based diff
    const lcs = this.computeLCS(linesA, linesB);
    let idxA = 0;
    let idxB = 0;
    let lineNum = 1;

    for (const common of lcs) {
      // Lines removed from A
      while (idxA < linesA.length && linesA[idxA] !== common) {
        diffLines.push({ lineNumber: lineNum++, type: 'removed', content: linesA[idxA] });
        idxA++;
      }
      // Lines added in B
      while (idxB < linesB.length && linesB[idxB] !== common) {
        diffLines.push({ lineNumber: lineNum++, type: 'added', content: linesB[idxB] });
        idxB++;
      }
      // Common line
      diffLines.push({ lineNumber: lineNum++, type: 'context', content: common });
      idxA++;
      idxB++;
    }

    // Remaining lines
    while (idxA < linesA.length) {
      diffLines.push({ lineNumber: lineNum++, type: 'removed', content: linesA[idxA] });
      idxA++;
    }
    while (idxB < linesB.length) {
      diffLines.push({ lineNumber: lineNum++, type: 'added', content: linesB[idxB] });
      idxB++;
    }

    return diffLines;
  }

  private computeLCS(a: string[], b: string[]): string[] {
    const m = a.length;
    const n = b.length;

    // For very large files, limit to avoid memory issues
    if (m > 5000 || n > 5000) {
      // Fallback: simple line comparison
      return a.filter(line => b.includes(line));
    }

    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack to find the LCS
    const result: string[] = [];
    let i = m;
    let j = n;
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        result.unshift(a[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return result;
  }

  generateDiffReport(result: SolutionDiffResult): string {
    const lines: string[] = [];
    lines.push(`# Solution Diff Report\n`);
    lines.push(`**File A:** ${result.labelA}`);
    lines.push(`**File B:** ${result.labelB}\n`);

    lines.push(`## Metadata\n`);
    lines.push(`| Property | File A | File B |`);
    lines.push(`|----------|--------|--------|`);
    lines.push(`| Unique Name | ${result.uniqueNameA} | ${result.uniqueNameB} |`);
    lines.push(`| Version | ${result.versionA} | ${result.versionB} |`);
    lines.push(`| Publisher | ${result.publisherA} | ${result.publisherB} |\n`);

    if (result.componentDiffs.length > 0) {
      lines.push(`## Component Differences\n`);
      lines.push(`| Component | Type | Status |`);
      lines.push(`|-----------|------|--------|`);
      for (const comp of result.componentDiffs) {
        lines.push(`| ${comp.name} | ${comp.type} | ${comp.status} |`);
      }
      lines.push('');
    }

    lines.push(`## Summary\n`);
    lines.push(result.summary);

    return lines.join('\n');
  }
}
