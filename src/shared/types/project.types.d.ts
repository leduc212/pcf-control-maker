export interface PcfProject {
    path: string;
    name: string;
    manifestPath?: string;
    packageJsonPath?: string;
    hasSolution: boolean;
    solutionPath?: string;
    lastOpened: string;
}
export interface ProjectValidation {
    isValid: boolean;
    hasManifest: boolean;
    hasPackageJson: boolean;
    hasNodeModules: boolean;
    hasSolution: boolean;
    errors: string[];
}
export interface RecentProject {
    path: string;
    name: string;
    lastOpened: string;
    isValid?: boolean;
}
