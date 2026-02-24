import { useState, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  Text,
  Button,
  Tooltip,
  Tab,
  TabList,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import {
  Copy24Regular,
  Save24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';
import type { PCFManifest } from '../../../shared/types/manifest.types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalS,
    flexWrap: 'wrap',
    gap: tokens.spacingVerticalS,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  preview: {
    flex: 1,
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: 'Consolas, "Courier New", monospace',
    fontSize: '12px',
    lineHeight: '1.6',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    minHeight: '300px',
  },
  xmlTag: {
    color: tokens.colorPaletteBlueForeground1,
  },
  xmlAttr: {
    color: tokens.colorPaletteGreenForeground1,
  },
  xmlValue: {
    color: tokens.colorPaletteRedForeground1,
  },
  xmlComment: {
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
  },
});

interface ManifestPreviewProps {
  manifest: PCFManifest;
  onSave?: (content: string, filename: string) => void;
}

/**
 * Generates ControlManifest.Input.xml from the manifest object
 */
function generateManifestXml(manifest: PCFManifest): string {
  const { control, properties, resources, platformLibraries, featureUsage, typeGroups } = manifest;

  const indent = (level: number) => '  '.repeat(level);
  const escapeXml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  let xml = `<?xml version="1.0" encoding="utf-8" ?>\n`;
  xml += `<manifest>\n`;

  // Control element
  xml += `${indent(1)}<control namespace="${escapeXml(control.namespace)}" constructor="${escapeXml(control.constructor)}" version="${escapeXml(control.version)}" display-name-key="${escapeXml(control.displayNameKey)}" description-key="${escapeXml(control.descriptionKey)}"`;
  if (control.controlType === 'virtual') {
    xml += ` control-type="virtual"`;
  } else if (control.controlType === 'react') {
    xml += ` control-type="virtual"`;
  }
  xml += `>\n`;

  // External service usage
  if (featureUsage.usesWebAPI || featureUsage.usesDevice || featureUsage.usesUtility) {
    xml += `${indent(2)}<external-service-usage enabled="true">\n`;
    if (featureUsage.usesWebAPI) {
      xml += `${indent(3)}<domain>*.dynamics.com</domain>\n`;
    }
    xml += `${indent(2)}</external-service-usage>\n`;
  }

  // Type groups
  if (typeGroups.length > 0) {
    for (const group of typeGroups) {
      xml += `${indent(2)}<type-group name="${escapeXml(group.name)}">\n`;
      for (const type of group.types) {
        xml += `${indent(3)}<type>${escapeXml(type)}</type>\n`;
      }
      xml += `${indent(2)}</type-group>\n`;
    }
  }

  // Properties
  for (const prop of properties) {
    xml += `${indent(2)}<property name="${escapeXml(prop.name)}" display-name-key="${escapeXml(prop.displayName)}" `;
    if (prop.description) {
      xml += `description-key="${escapeXml(prop.description)}" `;
    }
    xml += `of-type="${escapeXml(prop.ofType)}" usage="${escapeXml(prop.usage)}" required="${prop.required}"`;
    if (prop.defaultValue) {
      xml += ` default-value="${escapeXml(String(prop.defaultValue))}"`;
    }
    if (prop.ofTypeGroup) {
      xml += ` of-type-group="${escapeXml(prop.ofTypeGroup)}"`;
    }
    xml += ` />\n`;
  }

  // Resources
  xml += `${indent(2)}<resources>\n`;

  // Platform libraries
  for (const lib of platformLibraries) {
    if (lib.enabled) {
      xml += `${indent(3)}<platform-library name="${escapeXml(lib.name)}" version="${escapeXml(lib.version)}" />\n`;
    }
  }

  // Code resources
  const codeResources = resources.filter(r => r.type === 'code');
  for (const res of codeResources) {
    xml += `${indent(3)}<code path="${escapeXml(res.path)}" order="${res.order || 1}" />\n`;
  }

  // CSS resources
  const cssResources = resources.filter(r => r.type === 'css');
  for (const res of cssResources) {
    xml += `${indent(3)}<css path="${escapeXml(res.path)}" order="${res.order || 1}" />\n`;
  }

  // Image resources
  const imgResources = resources.filter(r => r.type === 'img');
  for (const res of imgResources) {
    xml += `${indent(3)}<img path="${escapeXml(res.path)}" />\n`;
  }

  // Resx resources
  const resxResources = resources.filter(r => r.type === 'resx');
  for (const res of resxResources) {
    xml += `${indent(3)}<resx path="${escapeXml(res.path)}" version="1.0.0" />\n`;
  }

  // HTML resources
  const htmlResources = resources.filter(r => r.type === 'html');
  for (const res of htmlResources) {
    xml += `${indent(3)}<html path="${escapeXml(res.path)}" />\n`;
  }

  xml += `${indent(2)}</resources>\n`;

  // Feature usage
  if (featureUsage.usesWebAPI || featureUsage.usesDevice || featureUsage.usesUtility) {
    xml += `${indent(2)}<feature-usage>\n`;
    if (featureUsage.usesWebAPI) {
      xml += `${indent(3)}<uses-feature name="WebAPI" required="true" />\n`;
    }
    if (featureUsage.usesDevice) {
      xml += `${indent(3)}<uses-feature name="Device.captureImage" required="false" />\n`;
      xml += `${indent(3)}<uses-feature name="Device.captureAudio" required="false" />\n`;
      xml += `${indent(3)}<uses-feature name="Device.captureVideo" required="false" />\n`;
      xml += `${indent(3)}<uses-feature name="Device.getBarcodeValue" required="false" />\n`;
      xml += `${indent(3)}<uses-feature name="Device.getCurrentPosition" required="false" />\n`;
      xml += `${indent(3)}<uses-feature name="Device.pickFile" required="false" />\n`;
    }
    if (featureUsage.usesUtility) {
      xml += `${indent(3)}<uses-feature name="Utility" required="true" />\n`;
    }
    xml += `${indent(2)}</feature-usage>\n`;
  }

  xml += `${indent(1)}</control>\n`;
  xml += `</manifest>\n`;

  return xml;
}

/**
 * Simple syntax highlighting for XML
 */
function highlightXml(xml: string, styles: ReturnType<typeof useStyles>): React.ReactNode[] {
  const lines = xml.split('\n');
  return lines.map((line, index) => {
    // Highlight XML comments
    if (line.includes('<!--')) {
      return <div key={index} className={styles.xmlComment}>{line}</div>;
    }

    // Highlight tags and attributes
    const highlighted = line
      .replace(/(&lt;\/?\w+)/g, `<span class="${styles.xmlTag}">$1</span>`)
      .replace(/(\s)(\w+[-\w]*)=/g, `$1<span class="${styles.xmlAttr}">$2</span>=`)
      .replace(/"([^"]*)"/g, `"<span class="${styles.xmlValue}">$1</span>"`);

    return <div key={index} dangerouslySetInnerHTML={{ __html: highlighted }} />;
  });
}

export default function ManifestPreview({ manifest, onSave }: ManifestPreviewProps) {
  const styles = useStyles();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const xmlContent = useMemo(() => generateManifestXml(manifest), [manifest]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(xmlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSave = async () => {
    if (onSave) {
      onSave(xmlContent, 'ControlManifest.Input.xml');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      // Fallback: trigger download
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ControlManifest.Input.xml';
      a.click();
      URL.revokeObjectURL(url);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={500} weight="semibold">
          Manifest Preview
        </Text>
        <div className={styles.actions}>
          <Tooltip content={copied ? 'Copied!' : 'Copy to clipboard'} relationship="label">
            <Button
              appearance="subtle"
              icon={copied ? <Checkmark24Regular /> : <Copy24Regular />}
              onClick={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </Tooltip>
          <Tooltip content="Save to file" relationship="label">
            <Button
              appearance="primary"
              icon={saved ? <Checkmark24Regular /> : <Save24Regular />}
              onClick={handleSave}
            >
              {saved ? 'Saved!' : 'Save'}
            </Button>
          </Tooltip>
        </div>
      </div>

      <Card className={styles.preview}>
        <pre style={{ margin: 0 }}>{xmlContent}</pre>
      </Card>

      {manifest.properties.length === 0 && (
        <MessageBar intent="warning" style={{ marginTop: tokens.spacingVerticalS }}>
          <MessageBarBody>
            No properties defined. Add at least one property to create a functional control.
          </MessageBarBody>
        </MessageBar>
      )}
    </div>
  );
}

export { generateManifestXml };
