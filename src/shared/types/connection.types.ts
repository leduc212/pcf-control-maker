/**
 * Connection Browser Types
 * Types for deployed solution browsing and version comparison
 */

export interface DeployedSolution {
  uniqueName: string;
  friendlyName: string;
  version: string;
  isManaged: boolean;
  publisher: string;
  installedOn: string;
}

export interface EnvironmentSolutionList {
  environmentUrl: string;
  solutions: DeployedSolution[];
  fetchedAt: number;
}

export interface SolutionVersionComparison {
  solutionName: string;
  localVersion: string;
  deployedVersion: string;
  isOutdated: boolean;
}
