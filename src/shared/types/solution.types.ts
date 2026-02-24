export interface Solution {
  id: string;
  name: string;
  path: string;
  publisherName: string;
  publisherPrefix: string;
  components: SolutionComponent[];
  createdAt: string;
  lastBuilt?: string;
}

export interface SolutionComponent {
  name: string;
  path: string;
  addedAt: string;
}

export interface CreateSolutionInput {
  name: string;
  path: string;
  publisherName: string;
  publisherPrefix: string;
}

export interface SolutionBuildResult {
  success: boolean;
  outputPath?: string;
  stdout: string;
  stderr: string;
}

export interface SolutionZipInfo {
  zipPath: string;
  solutionXmlPath: string;
  version: string;
  uniqueName: string;
  publisherName: string;
  hasGeneratedBy: boolean;
  rawXml: string;
}

export interface UpdateSolutionZipInput {
  zipPath: string;
  newVersion?: string;
  removeGeneratedBy?: boolean;
}
