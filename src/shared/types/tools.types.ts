/**
 * Tools Types
 * Types for Documentation Generator, Bundle Analyzer, Solution Diff, and Dependency Management
 */

// ==================== Documentation Generator ====================

export interface DocGeneratorInput {
  projectPath: string;
  manifestPath: string;
  includeChangelog: boolean;
  includeUsageExamples: boolean;
}

export interface GeneratedDoc {
  readme: string;
  propertyTable: string;
  changelogSection: string;
  usageExamples: string;
}

// ==================== Bundle Analyzer ====================

export interface BundleAnalysis {
  bundlePath: string;
  bundleSizeBytes: number;
  bundleSizeFormatted: string;
  dependencyCount: number;
  dependencies: DependencyInfo[];
  recommendations: string[];
}

export interface DependencyInfo {
  name: string;
  version: string;
  isDev: boolean;
}

export interface BundleSizeHistory {
  projectPath: string;
  entries: BundleSizeEntry[];
}

export interface BundleSizeEntry {
  sizeBytes: number;
  dependencyCount: number;
  timestamp: number;
  label?: string;
}

// ==================== Solution Diff ====================

export interface SolutionDiffInput {
  zipPathA: string;
  zipPathB: string;
}

export interface SolutionDiffResult {
  labelA: string;
  labelB: string;
  versionA: string;
  versionB: string;
  publisherA: string;
  publisherB: string;
  uniqueNameA: string;
  uniqueNameB: string;
  componentDiffs: ComponentDiff[];
  xmlDiffLines: DiffLine[];
  summary: string;
}

export interface ComponentDiff {
  name: string;
  type: string;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
}

export interface DiffLine {
  lineNumber: number;
  type: 'added' | 'removed' | 'context';
  content: string;
}

// ==================== Dependency Management ====================

export interface NpmAuditResult {
  vulnerabilities: NpmVulnerability[];
  totalVulnerabilities: number;
  severityCounts: Record<string, number>;
}

export interface NpmVulnerability {
  name: string;
  severity: string;
  title: string;
  url: string;
  range: string;
  fixAvailable: boolean;
}

export interface NpmOutdatedPackage {
  name: string;
  current: string;
  wanted: string;
  latest: string;
  dependent: string;
  type: string;
}

export interface NpmOutdatedResult {
  packages: NpmOutdatedPackage[];
  totalOutdated: number;
}
