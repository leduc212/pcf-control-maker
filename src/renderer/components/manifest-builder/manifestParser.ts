import type {
  PCFManifest,
  ManifestProperty,
  ManifestResource,
  ManifestTypeGroup,
  PCFPropertyType,
  PCFPropertyUsage,
  PCFResourceType,
  PCFPlatformLibrary,
  PCFPlatformLibraryName,
  ManifestFeatureUsage,
} from '../../../shared/types/manifest.types';
import { DEFAULT_MANIFEST, getDefaultPlatformLibraries, DEFAULT_REACT_VERSION, DEFAULT_FLUENT_VERSION } from '../../../shared/constants/manifest.constants';

/**
 * Parses ControlManifest.Input.xml content into a PCFManifest object
 */
export function parseManifestXml(xmlContent: string): PCFManifest {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'application/xml');

  // Check for parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML: ' + parseError.textContent);
  }

  const controlElement = doc.querySelector('control');
  if (!controlElement) {
    throw new Error('No <control> element found in manifest');
  }

  // Parse control info
  const control: PCFManifest['control'] = {
    namespace: controlElement.getAttribute('namespace') || DEFAULT_MANIFEST.control.namespace,
    constructor: controlElement.getAttribute('constructor') || DEFAULT_MANIFEST.control.constructor,
    displayNameKey: controlElement.getAttribute('display-name-key') || '',
    descriptionKey: controlElement.getAttribute('description-key') || '',
    controlType: (controlElement.getAttribute('control-type') as 'standard' | 'virtual' | 'react') || 'standard',
    version: controlElement.getAttribute('version') || '1.0.0',
  };

  // Parse properties
  const properties: ManifestProperty[] = [];
  const propertyElements = doc.querySelectorAll('property');
  propertyElements.forEach((propEl, index) => {
    const property: ManifestProperty = {
      id: `prop-${Date.now()}-${index}`,
      name: propEl.getAttribute('name') || '',
      displayName: propEl.getAttribute('display-name-key') || '',
      description: propEl.getAttribute('description-key') || '',
      ofType: (propEl.getAttribute('of-type') as PCFPropertyType) || 'SingleLine.Text',
      usage: (propEl.getAttribute('usage') as PCFPropertyUsage) || 'bound',
      required: propEl.getAttribute('required') === 'true',
      defaultValue: propEl.getAttribute('default-value') || undefined,
      ofTypeGroup: propEl.getAttribute('of-type-group') || undefined,
    };
    properties.push(property);
  });

  // Parse type groups
  const typeGroups: ManifestTypeGroup[] = [];
  const typeGroupElements = doc.querySelectorAll('type-group');
  typeGroupElements.forEach((groupEl, index) => {
    const types: PCFPropertyType[] = [];
    groupEl.querySelectorAll('type').forEach((typeEl) => {
      types.push(typeEl.textContent as PCFPropertyType);
    });
    typeGroups.push({
      id: `group-${Date.now()}-${index}`,
      name: groupEl.getAttribute('name') || '',
      types,
    });
  });

  // Parse resources
  const resources: ManifestResource[] = [];
  const resourcesElement = doc.querySelector('resources');
  if (resourcesElement) {
    // Code files
    resourcesElement.querySelectorAll('code').forEach((codeEl, index) => {
      resources.push({
        id: `res-code-${Date.now()}-${index}`,
        type: 'code',
        path: codeEl.getAttribute('path') || '',
        order: parseInt(codeEl.getAttribute('order') || '1', 10),
      });
    });

    // CSS files
    resourcesElement.querySelectorAll('css').forEach((cssEl, index) => {
      resources.push({
        id: `res-css-${Date.now()}-${index}`,
        type: 'css',
        path: cssEl.getAttribute('path') || '',
        order: parseInt(cssEl.getAttribute('order') || '1', 10),
      });
    });

    // Image files
    resourcesElement.querySelectorAll('img').forEach((imgEl, index) => {
      resources.push({
        id: `res-img-${Date.now()}-${index}`,
        type: 'img',
        path: imgEl.getAttribute('path') || '',
      });
    });

    // Resx files
    resourcesElement.querySelectorAll('resx').forEach((resxEl, index) => {
      resources.push({
        id: `res-resx-${Date.now()}-${index}`,
        type: 'resx',
        path: resxEl.getAttribute('path') || '',
      });
    });

    // HTML files
    resourcesElement.querySelectorAll('html').forEach((htmlEl, index) => {
      resources.push({
        id: `res-html-${Date.now()}-${index}`,
        type: 'html',
        path: htmlEl.getAttribute('path') || '',
      });
    });
  }

  // Parse platform libraries
  const platformLibraries: PCFPlatformLibrary[] = getDefaultPlatformLibraries();
  const platformLibraryElements = doc.querySelectorAll('platform-library');
  platformLibraryElements.forEach((libEl) => {
    const name = libEl.getAttribute('name') as PCFPlatformLibraryName;
    const version = libEl.getAttribute('version');
    if (name === 'React' || name === 'Fluent') {
      const lib = platformLibraries.find((l) => l.name === name);
      if (lib) {
        lib.enabled = true;
        if (version) {
          lib.version = version;
        }
      }
    }
  });

  // Parse feature usage
  const featureUsage: ManifestFeatureUsage = {};
  const featureElements = doc.querySelectorAll('uses-feature');
  featureElements.forEach((featureEl) => {
    const name = featureEl.getAttribute('name');
    if (name === 'WebAPI') {
      featureUsage.usesWebAPI = true;
    } else if (name?.startsWith('Device.')) {
      featureUsage.usesDevice = true;
    } else if (name === 'Utility') {
      featureUsage.usesUtility = true;
    }
  });

  return {
    control,
    properties,
    typeGroups,
    resources,
    platformLibraries,
    featureUsage,
  };
}

/**
 * Validates a PCFManifest object
 */
export function validateManifest(manifest: PCFManifest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate control info
  if (!manifest.control.namespace) {
    errors.push('Control namespace is required');
  }
  if (!manifest.control.constructor) {
    errors.push('Control constructor is required');
  }
  if (!manifest.control.version) {
    errors.push('Control version is required');
  }
  if (!/^\d+\.\d+\.\d+$/.test(manifest.control.version)) {
    errors.push('Control version must be in format X.Y.Z');
  }

  // Validate properties
  const propertyNames = new Set<string>();
  manifest.properties.forEach((prop) => {
    if (!prop.name) {
      errors.push('Property name is required');
    }
    if (propertyNames.has(prop.name)) {
      errors.push(`Duplicate property name: ${prop.name}`);
    }
    propertyNames.add(prop.name);

    if (!prop.displayName) {
      errors.push(`Property "${prop.name}" requires a display name`);
    }
  });

  // Validate resources
  if (manifest.resources.filter(r => r.type === 'code').length === 0) {
    errors.push('At least one code resource is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
