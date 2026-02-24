export { generateManifest } from './generateManifest';
export { generateComponent } from './generateComponent';
export { generateIndex } from './generateIndex';

import type {
  DesignerComponent,
  DesignerProperty,
} from '../../../../shared/types/designer.types';
import { generateManifest } from './generateManifest';
import { generateComponent } from './generateComponent';
import { generateIndex } from './generateIndex';

export interface GeneratedCode {
  manifest: string;
  component: string;
  index: string;
}

export interface CodeGeneratorOptions {
  manifest: {
    namespace: string;
    constructor: string;
    displayName: string;
    description: string;
  };
  properties: DesignerProperty[];
  components: DesignerComponent[];
}

/**
 * Generates all PCF code files from the designer state.
 */
export function generateAllCode(options: CodeGeneratorOptions): GeneratedCode {
  const { manifest, properties, components } = options;

  return {
    manifest: generateManifest({
      namespace: manifest.namespace,
      constructor: manifest.constructor,
      displayName: manifest.displayName,
      description: manifest.description,
      properties,
    }),
    component: generateComponent({
      constructorName: manifest.constructor,
      properties,
      components,
    }),
    index: generateIndex({
      constructorName: manifest.constructor,
      properties,
    }),
  };
}
