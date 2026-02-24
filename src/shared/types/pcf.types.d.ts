export type PcfTemplate = 'field' | 'dataset';
export type PcfFramework = 'none' | 'react';
export interface CreatePcfOptions {
    name: string;
    namespace: string;
    template: PcfTemplate;
    framework?: PcfFramework;
    outputDirectory?: string;
    runNpmInstall?: boolean;
}
export interface CreateSolutionOptions {
    name: string;
    publisherName: string;
    publisherPrefix: string;
    outputDirectory: string;
}
export interface BuildOptions {
    projectPath: string;
    production?: boolean;
}
export interface CommandResult {
    success: boolean;
    stdout: string;
    stderr: string;
    code: number;
}
export interface PcfManifestProperty {
    name: string;
    displayName: string;
    description?: string;
    ofType: string;
    usage: 'input' | 'output' | 'bound';
    required?: boolean;
}
export interface PcfManifest {
    namespace: string;
    constructor: string;
    version: string;
    displayName: string;
    description?: string;
    controlType: 'standard' | 'virtual' | 'react';
    properties: PcfManifestProperty[];
    resources: {
        code: string;
        css?: string;
        resx?: string;
    };
}
export interface SolutionInfo {
    path: string;
    name: string;
    publisherName: string;
    publisherPrefix: string;
    version: string;
}
