import type { PropertyType } from '../types/designer.types';

export const PCF_PROPERTY_TYPES: { value: PropertyType; label: string; category: string }[] = [
  // Text types
  { value: 'SingleLine.Text', label: 'Single Line Text', category: 'Text' },
  { value: 'SingleLine.Email', label: 'Email', category: 'Text' },
  { value: 'SingleLine.Phone', label: 'Phone', category: 'Text' },
  { value: 'SingleLine.URL', label: 'URL', category: 'Text' },
  { value: 'Multiple', label: 'Multiple Lines of Text', category: 'Text' },

  // Number types
  { value: 'Whole.None', label: 'Whole Number', category: 'Number' },
  { value: 'Decimal', label: 'Decimal', category: 'Number' },
  { value: 'Currency', label: 'Currency', category: 'Number' },
  { value: 'FP', label: 'Floating Point', category: 'Number' },

  // Choice types
  { value: 'TwoOptions', label: 'Yes/No (Boolean)', category: 'Choice' },
  { value: 'OptionSet', label: 'Option Set', category: 'Choice' },
  { value: 'Enum', label: 'Enum', category: 'Choice' },

  // Date types
  { value: 'DateAndTime.DateOnly', label: 'Date Only', category: 'Date' },
  { value: 'DateAndTime.DateAndTime', label: 'Date and Time', category: 'Date' },

  // Lookup types
  { value: 'Lookup.Simple', label: 'Lookup', category: 'Lookup' },
];

export const PCF_TEMPLATES = [
  { value: 'field', label: 'Field', description: 'Create a component for a single field' },
  { value: 'dataset', label: 'Dataset', description: 'Create a component for a dataset/grid' },
];

export const PCF_FRAMEWORKS = [
  { value: 'none', label: 'None (Vanilla JS/TS)', description: 'No framework, pure TypeScript' },
  { value: 'react', label: 'React', description: 'Use React with virtual DOM' },
];

export const DEFAULT_NAMESPACE = 'PCFControls';
export const DEFAULT_PUBLISHER_PREFIX = 'pcf';
export const DEFAULT_PUBLISHER_NAME = 'PCFPublisher';
