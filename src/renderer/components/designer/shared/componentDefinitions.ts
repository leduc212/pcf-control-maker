import type {
  FluentComponentType,
  ComponentDefinition,
  PropertyType,
} from '../../../../shared/types/designer.types';

/**
 * Metadata definitions for all supported Fluent UI components in the designer.
 * This drives the palette, property inspector, and code generation.
 */
export const componentDefinitions: Record<FluentComponentType, ComponentDefinition> = {
  // ============ INPUTS ============
  Input: {
    type: 'Input',
    displayName: 'Input',
    description: 'Single-line text input field',
    category: 'inputs',
    icon: 'TextBox',
    defaultProps: {
      placeholder: 'Enter text...',
      appearance: 'outline',
    },
    editableProps: [
      { name: 'placeholder', displayName: 'Placeholder', type: 'string', defaultValue: '' },
      { name: 'appearance', displayName: 'Appearance', type: 'enum', options: ['outline', 'underline', 'filled-darker', 'filled-lighter'], defaultValue: 'outline' },
      { name: 'size', displayName: 'Size', type: 'enum', options: ['small', 'medium', 'large'], defaultValue: 'medium' },
      { name: 'disabled', displayName: 'Disabled', type: 'boolean', defaultValue: false },
      { name: 'type', displayName: 'Type', type: 'enum', options: ['text', 'password', 'email', 'number', 'tel', 'url'], defaultValue: 'text' },
    ],
    bindableProps: ['value'],
    compatibleTypes: ['SingleLine.Text', 'SingleLine.Email', 'SingleLine.Phone', 'SingleLine.URL', 'Whole.None', 'Decimal', 'Currency', 'FP'],
    supportsChildren: false,
  },

  Textarea: {
    type: 'Textarea',
    displayName: 'Textarea',
    description: 'Multi-line text input',
    category: 'inputs',
    icon: 'TextBox',
    defaultProps: {
      placeholder: 'Enter text...',
      resize: 'vertical',
    },
    editableProps: [
      { name: 'placeholder', displayName: 'Placeholder', type: 'string', defaultValue: '' },
      { name: 'resize', displayName: 'Resize', type: 'enum', options: ['none', 'horizontal', 'vertical', 'both'], defaultValue: 'vertical' },
      { name: 'size', displayName: 'Size', type: 'enum', options: ['small', 'medium', 'large'], defaultValue: 'medium' },
      { name: 'disabled', displayName: 'Disabled', type: 'boolean', defaultValue: false },
    ],
    bindableProps: ['value'],
    compatibleTypes: ['Multiple', 'SingleLine.Text'],
    supportsChildren: false,
  },

  Checkbox: {
    type: 'Checkbox',
    displayName: 'Checkbox',
    description: 'Checkbox for boolean values',
    category: 'inputs',
    icon: 'Checkbox',
    defaultProps: {
      label: 'Checkbox label',
    },
    editableProps: [
      { name: 'label', displayName: 'Label', type: 'string', defaultValue: 'Checkbox' },
      { name: 'size', displayName: 'Size', type: 'enum', options: ['medium', 'large'], defaultValue: 'medium' },
      { name: 'disabled', displayName: 'Disabled', type: 'boolean', defaultValue: false },
    ],
    bindableProps: ['checked'],
    compatibleTypes: ['TwoOptions'],
    supportsChildren: false,
  },

  Switch: {
    type: 'Switch',
    displayName: 'Switch',
    description: 'Toggle switch for on/off values',
    category: 'inputs',
    icon: 'ToggleSwitch',
    defaultProps: {
      label: 'Toggle',
    },
    editableProps: [
      { name: 'label', displayName: 'Label', type: 'string', defaultValue: 'Toggle' },
      { name: 'labelPosition', displayName: 'Label Position', type: 'enum', options: ['above', 'after', 'before'], defaultValue: 'after' },
      { name: 'disabled', displayName: 'Disabled', type: 'boolean', defaultValue: false },
    ],
    bindableProps: ['checked'],
    compatibleTypes: ['TwoOptions'],
    supportsChildren: false,
  },

  Dropdown: {
    type: 'Dropdown',
    displayName: 'Dropdown',
    description: 'Dropdown selection list',
    category: 'inputs',
    icon: 'DropdownList',
    defaultProps: {
      placeholder: 'Select an option',
    },
    editableProps: [
      { name: 'placeholder', displayName: 'Placeholder', type: 'string', defaultValue: 'Select...' },
      { name: 'appearance', displayName: 'Appearance', type: 'enum', options: ['outline', 'underline', 'filled-darker', 'filled-lighter'], defaultValue: 'outline' },
      { name: 'disabled', displayName: 'Disabled', type: 'boolean', defaultValue: false },
      { name: 'multiselect', displayName: 'Multi-select', type: 'boolean', defaultValue: false },
    ],
    bindableProps: ['selectedOptions', 'value'],
    compatibleTypes: ['OptionSet', 'Enum'],
    supportsChildren: false,
  },

  Combobox: {
    type: 'Combobox',
    displayName: 'Combobox',
    description: 'Searchable dropdown with autocomplete',
    category: 'inputs',
    icon: 'Search',
    defaultProps: {
      placeholder: 'Search...',
    },
    editableProps: [
      { name: 'placeholder', displayName: 'Placeholder', type: 'string', defaultValue: 'Search...' },
      { name: 'appearance', displayName: 'Appearance', type: 'enum', options: ['outline', 'underline', 'filled-darker', 'filled-lighter'], defaultValue: 'outline' },
      { name: 'disabled', displayName: 'Disabled', type: 'boolean', defaultValue: false },
      { name: 'freeform', displayName: 'Allow Freeform', type: 'boolean', defaultValue: false },
    ],
    bindableProps: ['selectedOptions', 'value'],
    compatibleTypes: ['OptionSet', 'Enum', 'Lookup.Simple'],
    supportsChildren: false,
  },

  SpinButton: {
    type: 'SpinButton',
    displayName: 'Spin Button',
    description: 'Numeric input with increment/decrement buttons',
    category: 'inputs',
    icon: 'NumberField',
    defaultProps: {
      defaultValue: 0,
      min: 0,
      max: 100,
      step: 1,
    },
    editableProps: [
      { name: 'min', displayName: 'Minimum', type: 'number', defaultValue: 0 },
      { name: 'max', displayName: 'Maximum', type: 'number', defaultValue: 100 },
      { name: 'step', displayName: 'Step', type: 'number', defaultValue: 1 },
      { name: 'disabled', displayName: 'Disabled', type: 'boolean', defaultValue: false },
    ],
    bindableProps: ['value'],
    compatibleTypes: ['Whole.None', 'Decimal', 'FP'],
    supportsChildren: false,
  },

  Slider: {
    type: 'Slider',
    displayName: 'Slider',
    description: 'Slider for selecting a value in a range',
    category: 'inputs',
    icon: 'Slider',
    defaultProps: {
      min: 0,
      max: 100,
      step: 1,
    },
    editableProps: [
      { name: 'min', displayName: 'Minimum', type: 'number', defaultValue: 0 },
      { name: 'max', displayName: 'Maximum', type: 'number', defaultValue: 100 },
      { name: 'step', displayName: 'Step', type: 'number', defaultValue: 1 },
      { name: 'disabled', displayName: 'Disabled', type: 'boolean', defaultValue: false },
      { name: 'vertical', displayName: 'Vertical', type: 'boolean', defaultValue: false },
    ],
    bindableProps: ['value'],
    compatibleTypes: ['Whole.None', 'Decimal', 'FP'],
    supportsChildren: false,
  },

  // ============ DISPLAY ============
  Text: {
    type: 'Text',
    displayName: 'Text',
    description: 'Display text content',
    category: 'display',
    icon: 'Text',
    defaultProps: {
      children: 'Text content',
    },
    editableProps: [
      { name: 'children', displayName: 'Content', type: 'string', defaultValue: 'Text' },
      { name: 'size', displayName: 'Size', type: 'enum', options: ['100', '200', '300', '400', '500', '600', '700', '800', '900', '1000'], defaultValue: '300' },
      { name: 'weight', displayName: 'Weight', type: 'enum', options: ['regular', 'medium', 'semibold', 'bold'], defaultValue: 'regular' },
      { name: 'align', displayName: 'Align', type: 'enum', options: ['start', 'center', 'end', 'justify'], defaultValue: 'start' },
    ],
    bindableProps: ['children'],
    compatibleTypes: ['SingleLine.Text', 'SingleLine.Email', 'SingleLine.Phone', 'SingleLine.URL', 'Multiple', 'Whole.None', 'Decimal', 'Currency', 'FP', 'TwoOptions', 'DateAndTime.DateOnly', 'DateAndTime.DateAndTime', 'OptionSet', 'Enum'],
    supportsChildren: false,
  },

  Label: {
    type: 'Label',
    displayName: 'Label',
    description: 'Label for form fields',
    category: 'display',
    icon: 'Label',
    defaultProps: {
      children: 'Label',
    },
    editableProps: [
      { name: 'children', displayName: 'Text', type: 'string', defaultValue: 'Label' },
      { name: 'size', displayName: 'Size', type: 'enum', options: ['small', 'medium', 'large'], defaultValue: 'medium' },
      { name: 'weight', displayName: 'Weight', type: 'enum', options: ['regular', 'semibold'], defaultValue: 'regular' },
      { name: 'required', displayName: 'Required', type: 'boolean', defaultValue: false },
    ],
    bindableProps: ['children'],
    compatibleTypes: ['SingleLine.Text'],
    supportsChildren: false,
  },

  Badge: {
    type: 'Badge',
    displayName: 'Badge',
    description: 'Status badge or tag',
    category: 'display',
    icon: 'Badge',
    defaultProps: {
      children: 'Badge',
      appearance: 'filled',
    },
    editableProps: [
      { name: 'children', displayName: 'Text', type: 'string', defaultValue: 'Badge' },
      { name: 'appearance', displayName: 'Appearance', type: 'enum', options: ['filled', 'ghost', 'outline', 'tint'], defaultValue: 'filled' },
      { name: 'color', displayName: 'Color', type: 'enum', options: ['brand', 'danger', 'important', 'informative', 'severe', 'subtle', 'success', 'warning'], defaultValue: 'brand' },
      { name: 'size', displayName: 'Size', type: 'enum', options: ['tiny', 'extra-small', 'small', 'medium', 'large', 'extra-large'], defaultValue: 'medium' },
      { name: 'shape', displayName: 'Shape', type: 'enum', options: ['circular', 'rounded', 'square'], defaultValue: 'circular' },
    ],
    bindableProps: ['children'],
    compatibleTypes: ['SingleLine.Text', 'OptionSet', 'TwoOptions'],
    supportsChildren: false,
  },

  Image: {
    type: 'Image',
    displayName: 'Image',
    description: 'Display an image',
    category: 'display',
    icon: 'Image',
    defaultProps: {
      src: '',
      alt: 'Image',
    },
    editableProps: [
      { name: 'src', displayName: 'Source URL', type: 'string', defaultValue: '' },
      { name: 'alt', displayName: 'Alt Text', type: 'string', defaultValue: 'Image' },
      { name: 'fit', displayName: 'Fit', type: 'enum', options: ['none', 'center', 'contain', 'cover', 'default'], defaultValue: 'default' },
      { name: 'shape', displayName: 'Shape', type: 'enum', options: ['circular', 'rounded', 'square'], defaultValue: 'square' },
      { name: 'bordered', displayName: 'Bordered', type: 'boolean', defaultValue: false },
    ],
    bindableProps: ['src'],
    compatibleTypes: ['SingleLine.URL'],
    supportsChildren: false,
  },

  Divider: {
    type: 'Divider',
    displayName: 'Divider',
    description: 'Visual separator between content',
    category: 'display',
    icon: 'Line',
    defaultProps: {},
    editableProps: [
      { name: 'vertical', displayName: 'Vertical', type: 'boolean', defaultValue: false },
      { name: 'appearance', displayName: 'Appearance', type: 'enum', options: ['default', 'subtle', 'brand', 'strong'], defaultValue: 'default' },
      { name: 'inset', displayName: 'Inset', type: 'boolean', defaultValue: false },
    ],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: false,
  },

  // ============ LAYOUT ============
  Stack: {
    type: 'Stack',
    displayName: 'Stack',
    description: 'Vertical or horizontal container',
    category: 'layout',
    icon: 'Stack',
    defaultProps: {
      direction: 'column',
      gap: '8px',
    },
    editableProps: [
      { name: 'direction', displayName: 'Direction', type: 'enum', options: ['row', 'column'], defaultValue: 'column' },
      { name: 'gap', displayName: 'Gap', type: 'string', defaultValue: '8px' },
      { name: 'wrap', displayName: 'Wrap', type: 'boolean', defaultValue: false },
      { name: 'alignItems', displayName: 'Align Items', type: 'enum', options: ['start', 'center', 'end', 'stretch'], defaultValue: 'stretch' },
      { name: 'justifyContent', displayName: 'Justify', type: 'enum', options: ['start', 'center', 'end', 'space-between', 'space-around'], defaultValue: 'start' },
    ],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: true,
  },

  Card: {
    type: 'Card',
    displayName: 'Card',
    description: 'Container with visual boundaries',
    category: 'layout',
    icon: 'Card',
    defaultProps: {
      appearance: 'filled',
    },
    editableProps: [
      { name: 'appearance', displayName: 'Appearance', type: 'enum', options: ['filled', 'filled-alternative', 'outline', 'subtle'], defaultValue: 'filled' },
      { name: 'orientation', displayName: 'Orientation', type: 'enum', options: ['horizontal', 'vertical'], defaultValue: 'vertical' },
      { name: 'size', displayName: 'Size', type: 'enum', options: ['small', 'medium', 'large'], defaultValue: 'medium' },
    ],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: true,
  },

  // ============ FEEDBACK ============
  Spinner: {
    type: 'Spinner',
    displayName: 'Spinner',
    description: 'Loading spinner',
    category: 'feedback',
    icon: 'Spinner',
    defaultProps: {
      size: 'medium',
    },
    editableProps: [
      { name: 'size', displayName: 'Size', type: 'enum', options: ['extra-tiny', 'tiny', 'extra-small', 'small', 'medium', 'large', 'extra-large', 'huge'], defaultValue: 'medium' },
      { name: 'label', displayName: 'Label', type: 'string', defaultValue: '' },
      { name: 'labelPosition', displayName: 'Label Position', type: 'enum', options: ['above', 'below', 'before', 'after'], defaultValue: 'after' },
    ],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: false,
  },

  ProgressBar: {
    type: 'ProgressBar',
    displayName: 'Progress Bar',
    description: 'Progress indicator',
    category: 'feedback',
    icon: 'ProgressBar',
    defaultProps: {
      value: 0.5,
    },
    editableProps: [
      { name: 'value', displayName: 'Value (0-1)', type: 'number', defaultValue: 0.5 },
      { name: 'max', displayName: 'Max', type: 'number', defaultValue: 1 },
      { name: 'thickness', displayName: 'Thickness', type: 'enum', options: ['medium', 'large'], defaultValue: 'medium' },
      { name: 'color', displayName: 'Color', type: 'enum', options: ['brand', 'error', 'warning', 'success'], defaultValue: 'brand' },
    ],
    bindableProps: ['value'],
    compatibleTypes: ['Decimal', 'FP', 'Whole.None'],
    supportsChildren: false,
  },

  MessageBar: {
    type: 'MessageBar',
    displayName: 'Message Bar',
    description: 'Informational message banner',
    category: 'feedback',
    icon: 'Message',
    defaultProps: {
      intent: 'info',
      children: 'Message content',
    },
    editableProps: [
      { name: 'children', displayName: 'Message', type: 'string', defaultValue: 'Message' },
      { name: 'intent', displayName: 'Intent', type: 'enum', options: ['info', 'warning', 'error', 'success'], defaultValue: 'info' },
      { name: 'shape', displayName: 'Shape', type: 'enum', options: ['rounded', 'square'], defaultValue: 'rounded' },
    ],
    bindableProps: ['children'],
    compatibleTypes: ['SingleLine.Text'],
    supportsChildren: false,
  },

  // ============ ACTIONS ============
  Button: {
    type: 'Button',
    displayName: 'Button',
    description: 'Clickable button',
    category: 'buttons',
    icon: 'Button',
    defaultProps: {
      children: 'Button',
      appearance: 'secondary',
    },
    editableProps: [
      { name: 'children', displayName: 'Text', type: 'string', defaultValue: 'Button' },
      { name: 'appearance', displayName: 'Appearance', type: 'enum', options: ['secondary', 'primary', 'outline', 'subtle', 'transparent'], defaultValue: 'secondary' },
      { name: 'size', displayName: 'Size', type: 'enum', options: ['small', 'medium', 'large'], defaultValue: 'medium' },
      { name: 'shape', displayName: 'Shape', type: 'enum', options: ['rounded', 'circular', 'square'], defaultValue: 'rounded' },
      { name: 'disabled', displayName: 'Disabled', type: 'boolean', defaultValue: false },
    ],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: false,
  },

  Link: {
    type: 'Link',
    displayName: 'Link',
    description: 'Hyperlink',
    category: 'buttons',
    icon: 'Link',
    defaultProps: {
      children: 'Link text',
      href: '#',
    },
    editableProps: [
      { name: 'children', displayName: 'Text', type: 'string', defaultValue: 'Link' },
      { name: 'href', displayName: 'URL', type: 'string', defaultValue: '#' },
      { name: 'appearance', displayName: 'Appearance', type: 'enum', options: ['default', 'subtle'], defaultValue: 'default' },
      { name: 'inline', displayName: 'Inline', type: 'boolean', defaultValue: false },
    ],
    bindableProps: ['href', 'children'],
    compatibleTypes: ['SingleLine.URL', 'SingleLine.Email', 'SingleLine.Phone'],
    supportsChildren: false,
  },

  // ============ PLACEHOLDER DEFINITIONS FOR UNUSED TYPES ============
  // These are defined in FluentComponentType but not fully supported in the designer
  Radio: {
    type: 'Radio',
    displayName: 'Radio',
    description: 'Radio button (use RadioGroup instead)',
    category: 'inputs',
    icon: 'Radio',
    defaultProps: {},
    editableProps: [],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: false,
  },
  Select: {
    type: 'Select',
    displayName: 'Select',
    description: 'Native select (use Dropdown instead)',
    category: 'inputs',
    icon: 'Dropdown',
    defaultProps: {},
    editableProps: [],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: false,
  },
  Avatar: {
    type: 'Avatar',
    displayName: 'Avatar',
    description: 'User avatar',
    category: 'display',
    icon: 'Person',
    defaultProps: {},
    editableProps: [],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: false,
  },
  Table: {
    type: 'Table',
    displayName: 'Table',
    description: 'Data table',
    category: 'data',
    icon: 'Table',
    defaultProps: {},
    editableProps: [],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: false,
  },
  DataGrid: {
    type: 'DataGrid',
    displayName: 'Data Grid',
    description: 'Advanced data grid',
    category: 'data',
    icon: 'Table',
    defaultProps: {},
    editableProps: [],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: false,
  },
  Tree: {
    type: 'Tree',
    displayName: 'Tree',
    description: 'Tree view',
    category: 'data',
    icon: 'Tree',
    defaultProps: {},
    editableProps: [],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: false,
  },
  Accordion: {
    type: 'Accordion',
    displayName: 'Accordion',
    description: 'Expandable sections',
    category: 'layout',
    icon: 'Accordion',
    defaultProps: {},
    editableProps: [],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: false,
  },
  Tabs: {
    type: 'Tabs',
    displayName: 'Tabs',
    description: 'Tabbed content',
    category: 'navigation',
    icon: 'Tabs',
    defaultProps: {},
    editableProps: [],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: false,
  },
  Dialog: {
    type: 'Dialog',
    displayName: 'Dialog',
    description: 'Modal dialog',
    category: 'feedback',
    icon: 'Dialog',
    defaultProps: {},
    editableProps: [],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: false,
  },
  Drawer: {
    type: 'Drawer',
    displayName: 'Drawer',
    description: 'Slide-out panel',
    category: 'layout',
    icon: 'Panel',
    defaultProps: {},
    editableProps: [],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: false,
  },
  Tooltip: {
    type: 'Tooltip',
    displayName: 'Tooltip',
    description: 'Hover tooltip',
    category: 'feedback',
    icon: 'Tooltip',
    defaultProps: {},
    editableProps: [],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: false,
  },
  Popover: {
    type: 'Popover',
    displayName: 'Popover',
    description: 'Popover content',
    category: 'feedback',
    icon: 'Popover',
    defaultProps: {},
    editableProps: [],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: false,
  },
  Menu: {
    type: 'Menu',
    displayName: 'Menu',
    description: 'Dropdown menu',
    category: 'navigation',
    icon: 'Menu',
    defaultProps: {},
    editableProps: [],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: false,
  },
  Skeleton: {
    type: 'Skeleton',
    displayName: 'Skeleton',
    description: 'Loading placeholder',
    category: 'feedback',
    icon: 'Skeleton',
    defaultProps: {},
    editableProps: [],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: false,
  },
  Toast: {
    type: 'Toast',
    displayName: 'Toast',
    description: 'Toast notification',
    category: 'feedback',
    icon: 'Toast',
    defaultProps: {},
    editableProps: [],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: false,
  },
  Flex: {
    type: 'Flex',
    displayName: 'Flex',
    description: 'Flex container (use Stack instead)',
    category: 'layout',
    icon: 'Stack',
    defaultProps: {},
    editableProps: [],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: true,
  },
  Grid: {
    type: 'Grid',
    displayName: 'Grid',
    description: 'Grid layout',
    category: 'layout',
    icon: 'Grid',
    defaultProps: {},
    editableProps: [],
    bindableProps: [],
    compatibleTypes: [],
    supportsChildren: true,
  },
};

/**
 * Get components that are fully supported in the designer (have editable props)
 */
export const supportedComponents = Object.values(componentDefinitions).filter(
  (def) => def.editableProps.length > 0
);

/**
 * Get components grouped by category
 */
export const componentsByCategory = supportedComponents.reduce(
  (acc, def) => {
    if (!acc[def.category]) {
      acc[def.category] = [];
    }
    acc[def.category].push(def);
    return acc;
  },
  {} as Record<string, ComponentDefinition[]>
);

/**
 * Category display names and order
 */
export const categoryInfo: Record<string, { displayName: string; order: number }> = {
  inputs: { displayName: 'Inputs', order: 1 },
  buttons: { displayName: 'Actions', order: 2 },
  display: { displayName: 'Display', order: 3 },
  layout: { displayName: 'Layout', order: 4 },
  feedback: { displayName: 'Feedback', order: 5 },
  data: { displayName: 'Data', order: 6 },
  navigation: { displayName: 'Navigation', order: 7 },
};

/**
 * Get sorted categories with their components
 */
export const getSortedCategories = () => {
  return Object.entries(componentsByCategory)
    .map(([category, components]) => ({
      category,
      ...categoryInfo[category],
      components,
    }))
    .sort((a, b) => a.order - b.order);
};
