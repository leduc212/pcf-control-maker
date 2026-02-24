import type { ComponentDefinition, ComponentCategory } from '../types/designer.types';

export const COMPONENT_CATEGORIES: { id: ComponentCategory; label: string; icon: string }[] = [
  { id: 'inputs', label: 'Inputs', icon: 'TextField' },
  { id: 'buttons', label: 'Buttons', icon: 'ToggleButton' },
  { id: 'display', label: 'Display', icon: 'TextBulletListLtr' },
  { id: 'layout', label: 'Layout', icon: 'Grid' },
  { id: 'data', label: 'Data', icon: 'Table' },
  { id: 'feedback', label: 'Feedback', icon: 'Info' },
  { id: 'navigation', label: 'Navigation', icon: 'Navigation' },
];

/**
 * @deprecated Use componentDefinitions from renderer/components/designer/shared instead.
 * This file is kept for backwards compatibility.
 */
export const FLUENT_COMPONENTS: ComponentDefinition[] = [
  // Input components
  {
    type: 'Input',
    displayName: 'Input',
    description: 'Text input field',
    category: 'inputs',
    icon: 'TextField',
    defaultProps: { placeholder: 'Enter text...' },
    editableProps: [
      { name: 'placeholder', displayName: 'Placeholder', type: 'string' },
      { name: 'disabled', displayName: 'Disabled', type: 'boolean' },
      { name: 'type', displayName: 'Type', type: 'enum', options: ['text', 'password', 'email', 'number'] },
    ],
    bindableProps: ['value'],
    compatibleTypes: ['SingleLine.Text', 'SingleLine.Email', 'SingleLine.Phone', 'SingleLine.URL', 'Whole.None', 'Decimal', 'Currency', 'FP'],
    supportsChildren: false,
  },
  {
    type: 'Textarea',
    displayName: 'Textarea',
    description: 'Multi-line text input',
    category: 'inputs',
    icon: 'TextAlignLeft',
    defaultProps: { placeholder: 'Enter text...', rows: 3 },
    editableProps: [
      { name: 'placeholder', displayName: 'Placeholder', type: 'string' },
      { name: 'rows', displayName: 'Rows', type: 'number' },
      { name: 'disabled', displayName: 'Disabled', type: 'boolean' },
    ],
    bindableProps: ['value'],
    compatibleTypes: ['Multiple', 'SingleLine.Text'],
    supportsChildren: false,
  },
  {
    type: 'Checkbox',
    displayName: 'Checkbox',
    description: 'Checkbox input',
    category: 'inputs',
    icon: 'CheckboxChecked',
    defaultProps: { label: 'Checkbox' },
    editableProps: [
      { name: 'label', displayName: 'Label', type: 'string' },
      { name: 'disabled', displayName: 'Disabled', type: 'boolean' },
    ],
    bindableProps: ['checked'],
    compatibleTypes: ['TwoOptions'],
    supportsChildren: false,
  },
  {
    type: 'Switch',
    displayName: 'Switch',
    description: 'Toggle switch',
    category: 'inputs',
    icon: 'ToggleLeft',
    defaultProps: { label: 'Toggle' },
    editableProps: [
      { name: 'label', displayName: 'Label', type: 'string' },
      { name: 'disabled', displayName: 'Disabled', type: 'boolean' },
    ],
    bindableProps: ['checked'],
    compatibleTypes: ['TwoOptions'],
    supportsChildren: false,
  },
  {
    type: 'Dropdown',
    displayName: 'Dropdown',
    description: 'Dropdown select',
    category: 'inputs',
    icon: 'ChevronDown',
    defaultProps: { placeholder: 'Select an option' },
    editableProps: [
      { name: 'placeholder', displayName: 'Placeholder', type: 'string' },
      { name: 'disabled', displayName: 'Disabled', type: 'boolean' },
    ],
    bindableProps: ['selectedOptions', 'value'],
    compatibleTypes: ['OptionSet', 'Enum'],
    supportsChildren: false,
  },
  {
    type: 'Slider',
    displayName: 'Slider',
    description: 'Range slider',
    category: 'inputs',
    icon: 'Slider',
    defaultProps: { min: 0, max: 100, defaultValue: 50 },
    editableProps: [
      { name: 'min', displayName: 'Min', type: 'number' },
      { name: 'max', displayName: 'Max', type: 'number' },
      { name: 'step', displayName: 'Step', type: 'number' },
      { name: 'disabled', displayName: 'Disabled', type: 'boolean' },
    ],
    bindableProps: ['value'],
    compatibleTypes: ['Whole.None', 'Decimal', 'FP'],
    supportsChildren: false,
  },

  // Button components
  {
    type: 'Button',
    displayName: 'Button',
    description: 'Clickable button',
    category: 'buttons',
    icon: 'ToggleButton',
    defaultProps: { appearance: 'primary' },
    editableProps: [
      { name: 'appearance', displayName: 'Appearance', type: 'enum', options: ['primary', 'secondary', 'outline', 'subtle', 'transparent'] },
      { name: 'size', displayName: 'Size', type: 'enum', options: ['small', 'medium', 'large'] },
      { name: 'disabled', displayName: 'Disabled', type: 'boolean' },
    ],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: true,
  },

  // Display components
  {
    type: 'Text',
    displayName: 'Text',
    description: 'Text display',
    category: 'display',
    icon: 'TextT',
    defaultProps: {},
    editableProps: [
      { name: 'size', displayName: 'Size', type: 'enum', options: ['100', '200', '300', '400', '500', '600', '700', '800', '900', '1000'] },
      { name: 'weight', displayName: 'Weight', type: 'enum', options: ['regular', 'medium', 'semibold', 'bold'] },
    ],
    bindableProps: ['children'],
    compatibleTypes: ['SingleLine.Text', 'SingleLine.Email', 'SingleLine.Phone', 'SingleLine.URL', 'Multiple', 'Whole.None', 'Decimal', 'Currency', 'FP', 'TwoOptions', 'DateAndTime.DateOnly', 'DateAndTime.DateAndTime', 'OptionSet', 'Enum'],
    supportsChildren: true,
  },
  {
    type: 'Label',
    displayName: 'Label',
    description: 'Form label',
    category: 'display',
    icon: 'Tag',
    defaultProps: {},
    editableProps: [
      { name: 'required', displayName: 'Required', type: 'boolean' },
      { name: 'size', displayName: 'Size', type: 'enum', options: ['small', 'medium', 'large'] },
    ],
    bindableProps: ['children'],
    compatibleTypes: ['SingleLine.Text'],
    supportsChildren: true,
  },
  {
    type: 'Badge',
    displayName: 'Badge',
    description: 'Status badge',
    category: 'display',
    icon: 'Badge',
    defaultProps: { appearance: 'filled' },
    editableProps: [
      { name: 'appearance', displayName: 'Appearance', type: 'enum', options: ['filled', 'ghost', 'outline', 'tint'] },
      { name: 'color', displayName: 'Color', type: 'enum', options: ['brand', 'danger', 'important', 'informative', 'severe', 'subtle', 'success', 'warning'] },
      { name: 'size', displayName: 'Size', type: 'enum', options: ['tiny', 'extra-small', 'small', 'medium', 'large', 'extra-large'] },
    ],
    bindableProps: ['children'],
    compatibleTypes: ['SingleLine.Text', 'OptionSet', 'TwoOptions'],
    supportsChildren: true,
  },
  {
    type: 'Image',
    displayName: 'Image',
    description: 'Image display',
    category: 'display',
    icon: 'Image',
    defaultProps: { fit: 'contain' },
    editableProps: [
      { name: 'src', displayName: 'Source URL', type: 'string' },
      { name: 'alt', displayName: 'Alt Text', type: 'string' },
      { name: 'fit', displayName: 'Fit', type: 'enum', options: ['none', 'center', 'contain', 'cover', 'default'] },
    ],
    bindableProps: ['src'],
    compatibleTypes: ['SingleLine.URL'],
    supportsChildren: false,
  },
  {
    type: 'Divider',
    displayName: 'Divider',
    description: 'Visual separator',
    category: 'display',
    icon: 'LineHorizontal1',
    defaultProps: {},
    editableProps: [
      { name: 'vertical', displayName: 'Vertical', type: 'boolean' },
      { name: 'appearance', displayName: 'Appearance', type: 'enum', options: ['default', 'subtle', 'brand', 'strong'] },
    ],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: false,
  },

  // Layout components
  {
    type: 'Stack',
    displayName: 'Stack',
    description: 'Vertical or horizontal stack',
    category: 'layout',
    icon: 'Stack',
    defaultProps: { direction: 'column', gap: '8px' },
    editableProps: [
      { name: 'direction', displayName: 'Direction', type: 'enum', options: ['row', 'column'] },
      { name: 'gap', displayName: 'Gap', type: 'string' },
      { name: 'wrap', displayName: 'Wrap', type: 'boolean' },
    ],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: true,
  },
  {
    type: 'Card',
    displayName: 'Card',
    description: 'Card container',
    category: 'layout',
    icon: 'Card',
    defaultProps: {},
    editableProps: [
      { name: 'appearance', displayName: 'Appearance', type: 'enum', options: ['filled', 'filled-alternative', 'outline', 'subtle'] },
      { name: 'orientation', displayName: 'Orientation', type: 'enum', options: ['horizontal', 'vertical'] },
    ],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: true,
  },

  // Data components
  {
    type: 'Table',
    displayName: 'Table',
    description: 'Data table',
    category: 'data',
    icon: 'Table',
    defaultProps: {},
    editableProps: [
      { name: 'size', displayName: 'Size', type: 'enum', options: ['extra-small', 'small', 'medium'] },
      { name: 'sortable', displayName: 'Sortable', type: 'boolean' },
    ],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: true,
  },

  // Feedback components
  {
    type: 'Spinner',
    displayName: 'Spinner',
    description: 'Loading spinner',
    category: 'feedback',
    icon: 'ArrowSync',
    defaultProps: { size: 'medium' },
    editableProps: [
      { name: 'size', displayName: 'Size', type: 'enum', options: ['tiny', 'extra-small', 'small', 'medium', 'large', 'extra-large', 'huge'] },
      { name: 'label', displayName: 'Label', type: 'string' },
    ],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: false,
  },
  {
    type: 'ProgressBar',
    displayName: 'Progress Bar',
    description: 'Progress indicator',
    category: 'feedback',
    icon: 'ArrowRight',
    defaultProps: { value: 0.5 },
    editableProps: [
      { name: 'value', displayName: 'Value (0-1)', type: 'number' },
      { name: 'thickness', displayName: 'Thickness', type: 'enum', options: ['medium', 'large'] },
    ],
    bindableProps: ['value'],
    compatibleTypes: ['Decimal', 'FP', 'Whole.None'],
    supportsChildren: false,
  },
  {
    type: 'MessageBar',
    displayName: 'Message Bar',
    description: 'Status message',
    category: 'feedback',
    icon: 'Info',
    defaultProps: { intent: 'info' },
    editableProps: [
      { name: 'intent', displayName: 'Intent', type: 'enum', options: ['info', 'success', 'warning', 'error'] },
    ],
    bindableProps: ['children'],
    compatibleTypes: ['SingleLine.Text'],
    supportsChildren: true,
  },

  // Navigation components
  {
    type: 'Link',
    displayName: 'Link',
    description: 'Hyperlink',
    category: 'navigation',
    icon: 'Link',
    defaultProps: { href: '#' },
    editableProps: [
      { name: 'href', displayName: 'URL', type: 'string' },
      { name: 'appearance', displayName: 'Appearance', type: 'enum', options: ['default', 'subtle'] },
    ],
    bindableProps: ['href', 'children'],
    compatibleTypes: ['SingleLine.URL', 'SingleLine.Email', 'SingleLine.Phone'],
    supportsChildren: true,
  },
  {
    type: 'Tabs',
    displayName: 'Tabs',
    description: 'Tab navigation',
    category: 'navigation',
    icon: 'TabDesktop',
    defaultProps: {},
    editableProps: [
      { name: 'appearance', displayName: 'Appearance', type: 'enum', options: ['transparent', 'subtle'] },
      { name: 'size', displayName: 'Size', type: 'enum', options: ['small', 'medium', 'large'] },
    ],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: true,
  },
];

export const getComponentsByCategory = (category: ComponentCategory): ComponentDefinition[] => {
  return FLUENT_COMPONENTS.filter(c => c.category === category);
};

export const getComponentDefinition = (type: string): ComponentDefinition | undefined => {
  return FLUENT_COMPONENTS.find(c => c.type === type);
};
