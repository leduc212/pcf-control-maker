/**
 * Environment and Deployment Types
 * For managing Power Platform environments and solution deployments
 */

// Authentication types supported by PAC CLI
export type AuthenticationType =
  | 'interactive'      // Browser-based interactive login
  | 'devicecode'       // Device code flow
  | 'serviceprincipal' // Service principal (client ID/secret)
  | 'certificate';     // Certificate-based auth

// Environment profile stored locally
export interface EnvironmentProfile {
  id: string;
  name: string;                    // Friendly name (e.g., "Dev", "Production")
  url: string;                     // Environment URL (e.g., https://org.crm.dynamics.com)
  authenticationType: AuthenticationType;
  // For service principal auth
  tenantId?: string;
  clientId?: string;
  // Note: Client secret should NOT be stored - prompt when needed
  isDefault: boolean;
  createdAt: number;
  lastUsedAt?: number;
}

// Auth profile from PAC CLI (pac auth list)
export interface PacAuthProfile {
  index: number;
  active: boolean;
  kind: string;              // e.g., "DATAVERSE"
  name: string;
  url: string;
  user?: string;
  cloudInstance?: string;
  tenantId?: string;
}

// Current authentication status
export interface AuthStatus {
  isAuthenticated: boolean;
  currentProfile?: PacAuthProfile;
  profiles: PacAuthProfile[];
  lastChecked: number;
}

// Deployment status
export type DeploymentStatus =
  | 'pending'
  | 'in_progress'
  | 'success'
  | 'failed'
  | 'cancelled';

// Deployment record
export interface DeploymentRecord {
  id: string;
  solutionName: string;
  solutionPath: string;
  solutionVersion: string;
  environmentId: string;
  environmentName: string;
  environmentUrl: string;
  status: DeploymentStatus;
  startedAt: number;
  completedAt?: number;
  error?: string;
  stdout?: string;
  stderr?: string;
}

// Deployment options
export interface DeploymentOptions {
  solutionPath: string;           // Path to solution.zip
  environmentUrl: string;         // Target environment URL
  importAsHolding?: boolean;      // Import as holding solution
  publishWorkflows?: boolean;     // Activate workflows after import
  overwriteUnmanagedCustomizations?: boolean;
  skipProductUpdateDependencies?: boolean;
  convertToManaged?: boolean;
}

// Import result from PAC CLI
export interface ImportResult {
  success: boolean;
  solutionName?: string;
  version?: string;
  stdout: string;
  stderr: string;
  duration?: number;
}
