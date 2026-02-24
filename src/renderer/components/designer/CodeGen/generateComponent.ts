import type {
  DesignerComponent,
  DesignerProperty,
  FluentComponentType,
} from '../../../../shared/types/designer.types';
import { getTsType } from '../shared';

interface ComponentGenOptions {
  constructorName: string;
  properties: DesignerProperty[];
  components: DesignerComponent[];
}

/**
 * Generates the React component TSX code.
 */
export function generateComponent(options: ComponentGenOptions): string {
  const { constructorName, properties, components } = options;

  // Collect all unique Fluent UI components used
  const usedComponents = collectUsedComponents(components);

  // Generate imports
  const fluentImports = generateFluentImports(usedComponents);

  // Generate props interface
  const propsInterface = generatePropsInterface(constructorName, properties);

  // Generate component JSX
  const componentJsx = generateComponentJsx(components, properties);

  // Generate state for bound properties
  const stateDeclarations = generateStateDeclarations(components, properties);

  return `import * as React from 'react';
${fluentImports}

${propsInterface}

export const ${constructorName}: React.FC<${constructorName}Props> = (props) => {
${stateDeclarations}
  return (
    <FluentProvider theme={webLightTheme}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
${componentJsx}
      </div>
    </FluentProvider>
  );
};

export default ${constructorName};
`;
}

function collectUsedComponents(components: DesignerComponent[]): Set<FluentComponentType> {
  const used = new Set<FluentComponentType>();

  function collect(comps: DesignerComponent[]) {
    for (const comp of comps) {
      used.add(comp.type);
      if (comp.children) {
        collect(comp.children);
      }
    }
  }

  collect(components);
  return used;
}

function generateFluentImports(usedComponents: Set<FluentComponentType>): string {
  const componentImports = Array.from(usedComponents).sort();

  // Map our component types to actual Fluent UI imports
  const importMap: Record<string, string[]> = {
    Button: ['Button'],
    Input: ['Input'],
    Textarea: ['Textarea'],
    Checkbox: ['Checkbox'],
    Switch: ['Switch'],
    Dropdown: ['Dropdown', 'Option'],
    Combobox: ['Combobox', 'Option'],
    SpinButton: ['SpinButton'],
    Slider: ['Slider'],
    Text: ['Text'],
    Label: ['Label'],
    Badge: ['Badge'],
    Image: ['Image'],
    Divider: ['Divider'],
    Card: ['Card'],
    Spinner: ['Spinner'],
    ProgressBar: ['ProgressBar'],
    MessageBar: ['MessageBar', 'MessageBarBody'],
    Link: ['Link'],
    Stack: [], // Stack is just a div with flex
  };

  const imports = new Set<string>(['FluentProvider', 'webLightTheme']);

  for (const comp of componentImports) {
    const compImports = importMap[comp] ?? [comp];
    compImports.forEach((i) => imports.add(i));
  }

  return `import {
  ${Array.from(imports).sort().join(',\n  ')}
} from '@fluentui/react-components';`;
}

function generatePropsInterface(constructorName: string, properties: DesignerProperty[]): string {
  if (properties.length === 0) {
    return `export interface ${constructorName}Props {
  onChange?: (propertyName: string, value: unknown) => void;
}`;
  }

  const propTypes = properties
    .map((prop) => {
      const tsType = getTsType(prop.ofType);
      const optional = !prop.required ? '?' : '';
      return `  ${prop.name}${optional}: ${tsType};`;
    })
    .join('\n');

  return `export interface ${constructorName}Props {
${propTypes}
  onChange?: (propertyName: string, value: unknown) => void;
}`;
}

function generateStateDeclarations(
  components: DesignerComponent[],
  properties: DesignerProperty[]
): string {
  const boundProperties = new Set<string>();

  function collectBindings(comps: DesignerComponent[]) {
    for (const comp of comps) {
      if (comp.bindings) {
        for (const binding of comp.bindings) {
          boundProperties.add(binding.field);
        }
      }
      if (comp.children) {
        collectBindings(comp.children);
      }
    }
  }

  collectBindings(components);

  if (boundProperties.size === 0) {
    return '';
  }

  const declarations = Array.from(boundProperties)
    .map((propName) => {
      const prop = properties.find((p) => p.name === propName);
      if (!prop) return '';

      const capitalizedName = propName.charAt(0).toUpperCase() + propName.slice(1);
      return `  const [${propName}, set${capitalizedName}] = React.useState(props.${propName});`;
    })
    .filter(Boolean)
    .join('\n');

  return declarations ? `${declarations}\n` : '';
}

function generateComponentJsx(
  components: DesignerComponent[],
  properties: DesignerProperty[],
  indent = 8
): string {
  if (components.length === 0) {
    return `${' '.repeat(indent)}{/* No components designed yet */}`;
  }

  return components
    .map((comp) => generateSingleComponentJsx(comp, properties, indent))
    .join('\n');
}

function generateSingleComponentJsx(
  component: DesignerComponent,
  properties: DesignerProperty[],
  indent: number
): string {
  const spaces = ' '.repeat(indent);
  const { type, props, bindings, children } = component;

  // Build props string
  const propsEntries: string[] = [];

  // Add regular props
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'string') {
        propsEntries.push(`${key}="${value}"`);
      } else if (typeof value === 'boolean') {
        if (value) {
          propsEntries.push(key);
        }
      } else if (typeof value === 'number') {
        propsEntries.push(`${key}={${value}}`);
      }
    }
  }

  // Add bindings
  if (bindings) {
    for (const binding of bindings) {
      const prop = properties.find((p) => p.name === binding.field);
      if (prop) {
        const capitalizedName = binding.field.charAt(0).toUpperCase() + binding.field.slice(1);

        // Add value prop
        propsEntries.push(`${binding.property}={${binding.field}}`);

        // Add onChange handler for inputs
        if (['value', 'checked', 'selectedOptions'].includes(binding.property)) {
          const handler = getChangeHandler(type, binding.property, binding.field, capitalizedName);
          if (handler) {
            propsEntries.push(handler);
          }
        }
      }
    }
  }

  const propsString = propsEntries.length > 0 ? ' ' + propsEntries.join(' ') : '';

  // Handle special components
  if (type === 'Stack') {
    const direction = (props.direction as string) ?? 'column';
    const gap = (props.gap as string) ?? '8px';
    const childrenJsx = children
      ? '\n' + generateComponentJsx(children, properties, indent + 2) + '\n' + spaces
      : '';

    return `${spaces}<div style={{ display: 'flex', flexDirection: '${direction}', gap: '${gap}' }}>${childrenJsx}</div>`;
  }

  if (type === 'Card') {
    const childrenJsx = children
      ? '\n' + generateComponentJsx(children, properties, indent + 2) + '\n' + spaces
      : '';

    return `${spaces}<Card${propsString}>${childrenJsx}</Card>`;
  }

  // Handle components with text content
  if (['Text', 'Label', 'Badge', 'Button', 'Link'].includes(type)) {
    const content = (props.children as string) ?? type;
    // Check if there's a binding for children
    const childBinding = bindings?.find((b) => b.property === 'children');
    if (childBinding) {
      return `${spaces}<${type}${propsString}>{${childBinding.field}}</${type}>`;
    }
    return `${spaces}<${type}${propsString}>${content}</${type}>`;
  }

  // Handle MessageBar specially
  if (type === 'MessageBar') {
    const content = (props.children as string) ?? 'Message';
    return `${spaces}<MessageBar${propsString}>
${spaces}  <MessageBarBody>${content}</MessageBarBody>
${spaces}</MessageBar>`;
  }

  // Handle Dropdown/Combobox with options
  if (type === 'Dropdown' || type === 'Combobox') {
    return `${spaces}<${type}${propsString}>
${spaces}  <Option value="1">Option 1</Option>
${spaces}  <Option value="2">Option 2</Option>
${spaces}  <Option value="3">Option 3</Option>
${spaces}</${type}>`;
  }

  // Self-closing components
  return `${spaces}<${type}${propsString} />`;
}

function getChangeHandler(
  componentType: FluentComponentType,
  bindingProp: string,
  fieldName: string,
  capitalizedName: string
): string | null {
  switch (componentType) {
    case 'Input':
    case 'Textarea':
      return `onChange={(_, data) => { set${capitalizedName}(data.value); props.onChange?.('${fieldName}', data.value); }}`;
    case 'Checkbox':
    case 'Switch':
      return `onChange={(_, data) => { set${capitalizedName}(data.checked); props.onChange?.('${fieldName}', data.checked); }}`;
    case 'SpinButton':
      return `onChange={(_, data) => { set${capitalizedName}(data.value ?? 0); props.onChange?.('${fieldName}', data.value); }}`;
    case 'Slider':
      return `onChange={(_, data) => { set${capitalizedName}(data.value); props.onChange?.('${fieldName}', data.value); }}`;
    case 'Dropdown':
    case 'Combobox':
      return `onOptionSelect={(_, data) => { set${capitalizedName}(data.optionValue); props.onChange?.('${fieldName}', data.optionValue); }}`;
    default:
      return null;
  }
}
