import type { CSSProperties } from 'react';

// Fluent UI component types supported in the designer
export type FluentComponentType =
  | 'Button'
  | 'Input'
  | 'Textarea'
  | 'Checkbox'
  | 'Radio'
  | 'Switch'
  | 'Dropdown'
  | 'Combobox'
  | 'Select'
  | 'Slider'
  | 'SpinButton'
  | 'Label'
  | 'Text'
  | 'Link'
  | 'Badge'
  | 'Avatar'
  | 'Image'
  | 'Divider'
  | 'Card'
  | 'Table'
  | 'DataGrid'
  | 'Tree'
  | 'Accordion'
  | 'Tabs'
  | 'Dialog'
  | 'Drawer'
  | 'Tooltip'
  | 'Popover'
  | 'Menu'
  | 'Spinner'
  | 'ProgressBar'
  | 'Skeleton'
  | 'Toast'
  | 'MessageBar'
  | 'Stack'
  | 'Flex'
  | 'Grid';

export interface DesignerComponent {
  id: string;
  type: FluentComponentType;
  props: Record<string, unknown>;
  children?: DesignerComponent[];
  bindings?: ComponentBinding[];
  styles?: CSSProperties;
  layout?: LayoutConfig;
}

export interface ComponentBinding {
  property: string;           // Component prop to bind
  source: 'input' | 'output' | 'bound';
  field: string;              // PCF property name
  transform?: string;         // Optional transform expression
}

export interface LayoutConfig {
  display?: 'flex' | 'grid' | 'block';
  flexDirection?: 'row' | 'column';
  justifyContent?: string;
  alignItems?: string;
  gap?: string | number;
  padding?: string | number;
  margin?: string | number;
  width?: string | number;
  height?: string | number;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
}

export interface DesignerState {
  manifest: {
    namespace: string;
    constructor: string;
    displayName: string;
    description: string;
  };
  properties: DesignerProperty[];
  components: DesignerComponent[];
  selectedId: string | null;
  hoveredId: string | null;
  history: HistoryEntry[];
  historyIndex: number;
}

export interface DesignerProperty {
  name: string;
  displayName: string;
  description?: string;
  ofType: PropertyType;
  usage: 'input' | 'output' | 'bound';
  required?: boolean;
  defaultValue?: unknown;
}

export type PropertyType =
  | 'SingleLine.Text'
  | 'SingleLine.Email'
  | 'SingleLine.Phone'
  | 'SingleLine.URL'
  | 'Multiple'
  | 'Whole.None'
  | 'Decimal'
  | 'Currency'
  | 'FP'
  | 'TwoOptions'
  | 'DateAndTime.DateOnly'
  | 'DateAndTime.DateAndTime'
  | 'Enum'
  | 'Lookup.Simple'
  | 'OptionSet';

export interface HistoryEntry {
  timestamp: number;
  action: string;
  state: {
    components: DesignerComponent[];
    properties: DesignerProperty[];
  };
}

export interface ComponentDefinition {
  type: FluentComponentType;
  displayName: string;
  description: string;
  category: ComponentCategory;
  icon: string;
  defaultProps: Record<string, unknown>;
  editableProps: PropDefinition[];
  bindableProps: string[];
  compatibleTypes: PropertyType[];
  supportsChildren: boolean;
}

export type ComponentCategory =
  | 'inputs'
  | 'buttons'
  | 'display'
  | 'layout'
  | 'data'
  | 'feedback'
  | 'navigation';

export interface PropDefinition {
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'color' | 'icon';
  options?: string[];
  defaultValue?: unknown;
  description?: string;
}
