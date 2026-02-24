import type { PCFPropertyType, PropertyTypeInfo, PCFPlatformLibrary, PCFPlatformLibraryName } from '../types/manifest.types';

/**
 * All PCF property types with metadata
 */
export const MANIFEST_PROPERTY_TYPES: PropertyTypeInfo[] = [
  // String types
  {
    type: 'SingleLine.Text',
    displayName: 'Single Line Text',
    description: 'A single line of text',
    category: 'string',
    supportsDefaultValue: true,
    defaultValueType: 'string',
  },
  {
    type: 'SingleLine.Email',
    displayName: 'Email',
    description: 'Email address with validation',
    category: 'string',
    supportsDefaultValue: true,
    defaultValueType: 'string',
  },
  {
    type: 'SingleLine.Phone',
    displayName: 'Phone',
    description: 'Phone number',
    category: 'string',
    supportsDefaultValue: true,
    defaultValueType: 'string',
  },
  {
    type: 'SingleLine.URL',
    displayName: 'URL',
    description: 'Web address (URL)',
    category: 'string',
    supportsDefaultValue: true,
    defaultValueType: 'string',
  },
  {
    type: 'SingleLine.TextArea',
    displayName: 'Text Area',
    description: 'Multi-line text input',
    category: 'string',
    supportsDefaultValue: true,
    defaultValueType: 'string',
  },
  {
    type: 'SingleLine.Ticker',
    displayName: 'Ticker Symbol',
    description: 'Stock ticker symbol',
    category: 'string',
    supportsDefaultValue: true,
    defaultValueType: 'string',
  },
  {
    type: 'Multiple',
    displayName: 'Multiple Lines',
    description: 'Rich text or multiple lines of text',
    category: 'string',
    supportsDefaultValue: false,
    defaultValueType: 'none',
  },
  // Number types
  {
    type: 'Whole.None',
    displayName: 'Whole Number',
    description: 'Integer number without formatting',
    category: 'number',
    supportsDefaultValue: true,
    defaultValueType: 'number',
  },
  {
    type: 'Decimal',
    displayName: 'Decimal',
    description: 'Decimal number with precision',
    category: 'number',
    supportsDefaultValue: true,
    defaultValueType: 'number',
  },
  {
    type: 'Currency',
    displayName: 'Currency',
    description: 'Monetary value with currency formatting',
    category: 'number',
    supportsDefaultValue: true,
    defaultValueType: 'number',
  },
  {
    type: 'FP',
    displayName: 'Floating Point',
    description: 'Floating point number',
    category: 'number',
    supportsDefaultValue: true,
    defaultValueType: 'number',
  },
  // Date types
  {
    type: 'DateAndTime.DateOnly',
    displayName: 'Date Only',
    description: 'Date without time component',
    category: 'date',
    supportsDefaultValue: false,
    defaultValueType: 'none',
  },
  {
    type: 'DateAndTime.DateAndTime',
    displayName: 'Date and Time',
    description: 'Full date and time',
    category: 'date',
    supportsDefaultValue: false,
    defaultValueType: 'none',
  },
  // Choice types
  {
    type: 'TwoOptions',
    displayName: 'Yes/No (Boolean)',
    description: 'Boolean choice (Yes/No, True/False)',
    category: 'choice',
    supportsDefaultValue: true,
    defaultValueType: 'boolean',
  },
  {
    type: 'OptionSet',
    displayName: 'Option Set',
    description: 'Single choice from a list of options',
    category: 'choice',
    supportsDefaultValue: false,
    defaultValueType: 'none',
  },
  {
    type: 'MultiSelectOptionSet',
    displayName: 'Multi-Select Option Set',
    description: 'Multiple choices from a list of options',
    category: 'choice',
    supportsDefaultValue: false,
    defaultValueType: 'none',
  },
  // Other types
  {
    type: 'Lookup.Simple',
    displayName: 'Lookup',
    description: 'Reference to another record',
    category: 'other',
    supportsDefaultValue: false,
    defaultValueType: 'none',
  },
  {
    type: 'Enum',
    displayName: 'Enum',
    description: 'Custom enumeration of values',
    category: 'other',
    supportsDefaultValue: true,
    defaultValueType: 'string',
  },
];

/**
 * Property type lookup by type string
 */
export const PROPERTY_TYPE_MAP: Record<PCFPropertyType, PropertyTypeInfo> =
  MANIFEST_PROPERTY_TYPES.reduce((acc, info) => {
    acc[info.type] = info;
    return acc;
  }, {} as Record<PCFPropertyType, PropertyTypeInfo>);

/**
 * Property types grouped by category
 */
export const PROPERTY_TYPES_BY_CATEGORY = {
  string: MANIFEST_PROPERTY_TYPES.filter(t => t.category === 'string'),
  number: MANIFEST_PROPERTY_TYPES.filter(t => t.category === 'number'),
  date: MANIFEST_PROPERTY_TYPES.filter(t => t.category === 'date'),
  choice: MANIFEST_PROPERTY_TYPES.filter(t => t.category === 'choice'),
  other: MANIFEST_PROPERTY_TYPES.filter(t => t.category === 'other'),
};

/**
 * Default platform library versions
 */
export const DEFAULT_REACT_VERSION = '16.14.0';
export const DEFAULT_FLUENT_VERSION = '9.68.0';

/**
 * Platform library options with default versions
 */
export const PLATFORM_LIBRARIES: { name: PCFPlatformLibraryName; label: string; description: string; defaultVersion: string }[] = [
  {
    name: 'React',
    label: 'React',
    description: 'Include React library for React-based controls',
    defaultVersion: DEFAULT_REACT_VERSION,
  },
  {
    name: 'Fluent',
    label: 'Fluent UI',
    description: 'Include Fluent UI component library',
    defaultVersion: DEFAULT_FLUENT_VERSION,
  },
];

/**
 * Get default platform libraries config
 */
export const getDefaultPlatformLibraries = (): PCFPlatformLibrary[] => [
  { name: 'React', version: DEFAULT_REACT_VERSION, enabled: false },
  { name: 'Fluent', version: DEFAULT_FLUENT_VERSION, enabled: false },
];

/**
 * Default manifest for new projects
 */
export const DEFAULT_MANIFEST = {
  control: {
    namespace: 'PCFControls',
    constructor: 'MyControl',
    displayNameKey: 'MyControl',
    descriptionKey: 'A PCF control',
    controlType: 'standard' as const,
    version: '1.0.0',
  },
  properties: [],
  typeGroups: [],
  resources: [
    { id: 'code-1', type: 'code' as const, path: 'index.ts', order: 1 },
  ],
  platformLibraries: getDefaultPlatformLibraries(),
  featureUsage: {},
};

/**
 * Usage type options
 */
export const PROPERTY_USAGE_OPTIONS = [
  { value: 'bound', label: 'Bound', description: 'Bound to a data source field' },
  { value: 'input', label: 'Input', description: 'Input property (configuration)' },
  { value: 'output', label: 'Output', description: 'Output property (read-only)' },
];

/**
 * Control type options
 */
export const CONTROL_TYPE_OPTIONS = [
  { value: 'standard', label: 'Standard', description: 'Standard PCF control' },
  { value: 'virtual', label: 'Virtual', description: 'Virtual control (React 18+)' },
  { value: 'react', label: 'React', description: 'React control with Fluent UI' },
];
