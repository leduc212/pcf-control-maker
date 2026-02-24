/**
 * PCF Manifest Builder Types
 * These types represent the structure of ControlManifest.Input.xml
 */

// All PCF property types
export type PCFPropertyType =
  // String types
  | 'SingleLine.Text'
  | 'SingleLine.Email'
  | 'SingleLine.Phone'
  | 'SingleLine.URL'
  | 'SingleLine.TextArea'
  | 'SingleLine.Ticker'
  | 'Multiple'
  // Number types
  | 'Whole.None'
  | 'Decimal'
  | 'Currency'
  | 'FP'
  // Date types
  | 'DateAndTime.DateOnly'
  | 'DateAndTime.DateAndTime'
  // Choice types
  | 'TwoOptions'
  | 'OptionSet'
  | 'MultiSelectOptionSet'
  // Other types
  | 'Lookup.Simple'
  | 'Enum';

// Property usage types
export type PCFPropertyUsage = 'input' | 'output' | 'bound';

// Resource types
export type PCFResourceType = 'code' | 'css' | 'img' | 'resx' | 'html';

// Platform library types
export type PCFPlatformLibraryName = 'React' | 'Fluent';

export interface PCFPlatformLibrary {
  name: PCFPlatformLibraryName;
  version: string;
  enabled: boolean;
}

// Control property definition
export interface ManifestProperty {
  id: string;
  name: string;
  displayName: string;
  description: string;
  ofType: PCFPropertyType;
  usage: PCFPropertyUsage;
  required: boolean;
  defaultValue?: string;
  // For Enum type
  enumValues?: EnumValue[];
  // For property-of-type binding (links to another property)
  ofTypeGroup?: string;
}

export interface EnumValue {
  name: string;
  displayName: string;
  value: string;
}

// Resource file definition
export interface ManifestResource {
  id: string;
  type: PCFResourceType;
  path: string;
  order?: number;
}

// Type group for property-of-type binding
export interface ManifestTypeGroup {
  id: string;
  name: string;
  types: PCFPropertyType[];
}

// Feature usage flags
export interface ManifestFeatureUsage {
  usesSidePaging?: boolean;
  usesMediaQuery?: boolean;
  usesWebAPI?: boolean;
  usesDevice?: boolean;
  usesUtility?: boolean;
}

// Main manifest structure
export interface PCFManifest {
  // Control info
  control: {
    namespace: string;
    constructor: string;
    displayNameKey: string;
    descriptionKey: string;
    controlType: 'standard' | 'virtual' | 'react';
    version: string;
  };
  // Properties
  properties: ManifestProperty[];
  // Type groups
  typeGroups: ManifestTypeGroup[];
  // Resources
  resources: ManifestResource[];
  // Platform libraries
  platformLibraries: PCFPlatformLibrary[];
  // Feature usage
  featureUsage: ManifestFeatureUsage;
}

// Manifest history entry for undo/redo
export interface ManifestHistoryEntry {
  timestamp: number;
  action: string;
  manifest: PCFManifest;
}

// Property type metadata for UI
export interface PropertyTypeInfo {
  type: PCFPropertyType;
  displayName: string;
  description: string;
  category: 'string' | 'number' | 'date' | 'choice' | 'other';
  supportsDefaultValue: boolean;
  defaultValueType: 'string' | 'number' | 'boolean' | 'none';
}
