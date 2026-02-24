import type { DesignerProperty } from '../../../../shared/types/designer.types';

interface ManifestOptions {
  namespace: string;
  constructor: string;
  displayName: string;
  description: string;
  properties: DesignerProperty[];
  version?: string;
}

/**
 * Generates ControlManifest.Input.xml content for a PCF component.
 */
export function generateManifest(options: ManifestOptions): string {
  const {
    namespace,
    constructor: constructorName,
    displayName,
    description,
    properties,
    version = '0.0.1',
  } = options;

  const propertiesXml = properties
    .map((prop) => {
      const attrs = [
        `name="${escapeXml(prop.name)}"`,
        `display-name-key="${escapeXml(prop.displayName)}"`,
        prop.description ? `description-key="${escapeXml(prop.description)}"` : '',
        `of-type="${prop.ofType}"`,
        `usage="${prop.usage}"`,
        prop.required ? `required="true"` : `required="false"`,
      ]
        .filter(Boolean)
        .join(' ');

      return `    <property ${attrs} />`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="utf-8" ?>
<manifest>
  <control namespace="${escapeXml(namespace)}"
           constructor="${escapeXml(constructorName)}"
           version="${version}"
           display-name-key="${escapeXml(displayName)}"
           description-key="${escapeXml(description || displayName)}"
           control-type="virtual">

    <!-- Property definitions -->
${propertiesXml || '    <!-- No properties defined -->'}

    <resources>
      <code path="index.ts" order="1"/>
      <platform-library name="React" version="18.2.0"/>
      <platform-library name="Fluent" version="9"/>
    </resources>
  </control>
</manifest>
`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
