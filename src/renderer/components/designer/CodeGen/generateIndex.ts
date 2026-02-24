import type { DesignerProperty } from '../../../../shared/types/designer.types';
import { getTsType } from '../shared';

interface IndexGenOptions {
  constructorName: string;
  properties: DesignerProperty[];
}

/**
 * Generates the PCF index.ts wrapper class that bridges the PCF framework with the React component.
 */
export function generateIndex(options: IndexGenOptions): string {
  const { constructorName, properties } = options;

  const inputProperties = properties.filter((p) => p.usage === 'input' || p.usage === 'bound');
  const outputProperties = properties.filter((p) => p.usage === 'output' || p.usage === 'bound');

  // Generate the property reads in init/updateView
  const propertyReads = inputProperties
    .map((prop) => `        ${prop.name}: context.parameters.${prop.name}.raw ?? undefined,`)
    .join('\n');

  // Generate the outputs
  const outputDeclarations = outputProperties
    .map((prop) => `    private _${prop.name}: ${getTsType(prop.ofType)} | undefined;`)
    .join('\n');

  const outputGetters = outputProperties
    .map((prop) => `      ${prop.name}: this._${prop.name},`)
    .join('\n');

  return `import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { ${constructorName} } from "./${constructorName}";
import * as React from "react";
import * as ReactDOM from "react-dom/client";

export class ${constructorName}Control implements ComponentFramework.ReactControl<IInputs, IOutputs> {
  private _root: ReactDOM.Root | null = null;
  private _notifyOutputChanged: () => void;
${outputDeclarations}

  /**
   * Used to initialize the control instance. Controls can kick off remote server calls
   * and other initialization actions here.
   */
  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary
  ): void {
    this._notifyOutputChanged = notifyOutputChanged;
  }

  /**
   * Called when any value in the property bag has changed.
   */
  public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
    const props = {
${propertyReads}
      onChange: this.handleChange.bind(this),
    };

    return React.createElement(${constructorName}, props);
  }

  /**
   * Handles property changes from the React component.
   */
  private handleChange(propertyName: string, value: unknown): void {
    switch (propertyName) {
${outputProperties.map((prop) => `      case '${prop.name}':
        this._${prop.name} = value as ${getTsType(prop.ofType)};
        break;`).join('\n')}
      default:
        break;
    }
    this._notifyOutputChanged();
  }

  /**
   * Returns an object based on the output schema defined in the manifest.
   */
  public getOutputs(): IOutputs {
    return {
${outputGetters}
    };
  }

  /**
   * Called when the control is to be removed from the DOM tree.
   */
  public destroy(): void {
    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}
`;
}
