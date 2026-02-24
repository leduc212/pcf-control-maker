import type { PCFPropertyType, PCFPropertyUsage } from './manifest.types';

export interface TemplateProperty {
  name: string;
  displayName: string;
  description: string;
  ofType: PCFPropertyType;
  usage: PCFPropertyUsage;
  required: boolean;
  defaultValue?: string;
}

export interface TemplateResource {
  type: 'code' | 'css' | 'resx' | 'img';
  path: string;
  order?: number;
}

export interface TemplateFeatureUsage {
  webAPI?: boolean;
  device?: boolean;
  utility?: boolean;
}

export interface TemplatePlatformLibrary {
  name: string;
  version: string;
  order: number;
}

export interface ControlTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  icon: string;
  previewImage?: string;

  // Manifest configuration
  controlType: 'standard' | 'virtual' | 'react';
  namespace: string;
  properties: TemplateProperty[];
  resources: TemplateResource[];
  featureUsage: TemplateFeatureUsage;
  platformLibraries: TemplatePlatformLibrary[];

  // Starter code
  indexTs: string;
  indexCss?: string;

  // Metadata
  author?: string;
  version: string;
  createdAt: number;
  isBuiltIn: boolean;
}

export type TemplateCategory =
  | 'input'
  | 'display'
  | 'media'
  | 'data'
  | 'layout'
  | 'utility'
  | 'custom';

export interface TemplateCreateOptions {
  templateId: string;
  projectPath: string;
  controlName: string;
  namespace: string;
  publisherPrefix?: string;
}

export interface CustomTemplate extends Omit<ControlTemplate, 'isBuiltIn'> {
  isBuiltIn: false;
  sourceProjectPath?: string;
}
