import type { PropertyType, FluentComponentType } from '../../../../shared/types/designer.types';

/**
 * Maps PCF property types to their recommended and compatible Fluent UI components.
 * Used to suggest components when binding and filter binding options.
 */
export const propertyTypeMap: Record<PropertyType, {
  recommended: FluentComponentType;
  compatible: FluentComponentType[];
  description: string;
  tsType: string;
  defaultMockValue: unknown;
}> = {
  'SingleLine.Text': {
    recommended: 'Input',
    compatible: ['Input', 'Textarea', 'Text', 'Label'],
    description: 'Single line of text',
    tsType: 'string',
    defaultMockValue: 'Sample text',
  },
  'SingleLine.Email': {
    recommended: 'Input',
    compatible: ['Input', 'Text', 'Link'],
    description: 'Email address',
    tsType: 'string',
    defaultMockValue: 'user@example.com',
  },
  'SingleLine.Phone': {
    recommended: 'Input',
    compatible: ['Input', 'Text', 'Link'],
    description: 'Phone number',
    tsType: 'string',
    defaultMockValue: '+1 (555) 123-4567',
  },
  'SingleLine.URL': {
    recommended: 'Input',
    compatible: ['Input', 'Text', 'Link', 'Image'],
    description: 'Web URL',
    tsType: 'string',
    defaultMockValue: 'https://example.com',
  },
  'Multiple': {
    recommended: 'Textarea',
    compatible: ['Textarea', 'Text'],
    description: 'Multi-line text',
    tsType: 'string',
    defaultMockValue: 'This is a longer text\nthat spans multiple lines.',
  },
  'Whole.None': {
    recommended: 'SpinButton',
    compatible: ['Input', 'SpinButton', 'Slider', 'Text', 'ProgressBar'],
    description: 'Whole number (integer)',
    tsType: 'number',
    defaultMockValue: 42,
  },
  'Decimal': {
    recommended: 'Input',
    compatible: ['Input', 'SpinButton', 'Slider', 'Text', 'ProgressBar'],
    description: 'Decimal number',
    tsType: 'number',
    defaultMockValue: 123.45,
  },
  'Currency': {
    recommended: 'Input',
    compatible: ['Input', 'Text'],
    description: 'Currency value',
    tsType: 'number',
    defaultMockValue: 1234.56,
  },
  'FP': {
    recommended: 'Input',
    compatible: ['Input', 'SpinButton', 'Slider', 'Text', 'ProgressBar'],
    description: 'Floating point number',
    tsType: 'number',
    defaultMockValue: 3.14159,
  },
  'TwoOptions': {
    recommended: 'Switch',
    compatible: ['Switch', 'Checkbox', 'Text', 'Badge'],
    description: 'Yes/No or True/False',
    tsType: 'boolean',
    defaultMockValue: true,
  },
  'DateAndTime.DateOnly': {
    recommended: 'Input',
    compatible: ['Input', 'Text'],
    description: 'Date only (no time)',
    tsType: 'Date',
    defaultMockValue: new Date().toISOString().split('T')[0],
  },
  'DateAndTime.DateAndTime': {
    recommended: 'Input',
    compatible: ['Input', 'Text'],
    description: 'Date and time',
    tsType: 'Date',
    defaultMockValue: new Date().toISOString(),
  },
  'OptionSet': {
    recommended: 'Dropdown',
    compatible: ['Dropdown', 'Combobox', 'Text', 'Badge'],
    description: 'Choice/Picklist value',
    tsType: 'number',
    defaultMockValue: 1,
  },
  'Enum': {
    recommended: 'Dropdown',
    compatible: ['Dropdown', 'Combobox', 'Text'],
    description: 'Enumeration value',
    tsType: 'number',
    defaultMockValue: 0,
  },
  'Lookup.Simple': {
    recommended: 'Combobox',
    compatible: ['Combobox', 'Text'],
    description: 'Related record reference',
    tsType: 'ComponentFramework.LookupValue',
    defaultMockValue: { id: '00000000-0000-0000-0000-000000000001', name: 'Sample Record', entityType: 'account' },
  },
};

/**
 * Get the recommended component for a PCF property type
 */
export function getRecommendedComponent(propertyType: PropertyType): FluentComponentType {
  return propertyTypeMap[propertyType]?.recommended ?? 'Input';
}

/**
 * Get all compatible components for a PCF property type
 */
export function getCompatibleComponents(propertyType: PropertyType): FluentComponentType[] {
  return propertyTypeMap[propertyType]?.compatible ?? ['Input', 'Text'];
}

/**
 * Check if a component is compatible with a property type
 */
export function isComponentCompatible(
  componentType: FluentComponentType,
  propertyType: PropertyType
): boolean {
  const compatible = propertyTypeMap[propertyType]?.compatible ?? [];
  return compatible.includes(componentType);
}

/**
 * Get TypeScript type for a PCF property type
 */
export function getTsType(propertyType: PropertyType): string {
  return propertyTypeMap[propertyType]?.tsType ?? 'unknown';
}

/**
 * Generate mock data for a property type
 */
export function generateMockValue(propertyType: PropertyType): unknown {
  return propertyTypeMap[propertyType]?.defaultMockValue ?? null;
}

/**
 * Get property types compatible with a component's bindable props
 */
export function getCompatiblePropertyTypes(componentType: FluentComponentType): PropertyType[] {
  return (Object.entries(propertyTypeMap) as [PropertyType, typeof propertyTypeMap[PropertyType]][])
    .filter(([_, mapping]) => mapping.compatible.includes(componentType))
    .map(([type]) => type);
}

/**
 * Human-readable property type labels
 */
export const propertyTypeLabels: Record<PropertyType, string> = {
  'SingleLine.Text': 'Single Line Text',
  'SingleLine.Email': 'Email',
  'SingleLine.Phone': 'Phone',
  'SingleLine.URL': 'URL',
  'Multiple': 'Multiple Lines',
  'Whole.None': 'Whole Number',
  'Decimal': 'Decimal',
  'Currency': 'Currency',
  'FP': 'Floating Point',
  'TwoOptions': 'Two Options (Yes/No)',
  'DateAndTime.DateOnly': 'Date Only',
  'DateAndTime.DateAndTime': 'Date and Time',
  'OptionSet': 'Option Set',
  'Enum': 'Enum',
  'Lookup.Simple': 'Lookup',
};

/**
 * Property type categories for grouping in UI
 */
export const propertyTypeCategories = {
  text: ['SingleLine.Text', 'SingleLine.Email', 'SingleLine.Phone', 'SingleLine.URL', 'Multiple'] as PropertyType[],
  number: ['Whole.None', 'Decimal', 'Currency', 'FP'] as PropertyType[],
  boolean: ['TwoOptions'] as PropertyType[],
  datetime: ['DateAndTime.DateOnly', 'DateAndTime.DateAndTime'] as PropertyType[],
  choice: ['OptionSet', 'Enum'] as PropertyType[],
  reference: ['Lookup.Simple'] as PropertyType[],
};
