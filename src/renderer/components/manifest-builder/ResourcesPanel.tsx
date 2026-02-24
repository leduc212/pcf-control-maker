import { useState } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  Text,
  Button,
  Input,
  Field,
  Select,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Switch,
  Checkbox,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Delete24Regular,
  Code24Regular,
  Image24Regular,
  DocumentCss24Regular,
  Globe24Regular,
  Document24Regular,
} from '@fluentui/react-icons';
import type { ManifestResource, PCFResourceType, PCFPlatformLibrary, ManifestFeatureUsage, PCFPlatformLibraryName } from '../../../shared/types/manifest.types';
import { PLATFORM_LIBRARIES } from '../../../shared/constants/manifest.constants';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  section: {
    marginTop: tokens.spacingVerticalL,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalS,
  },
  card: {
    padding: tokens.spacingHorizontalL,
  },
  resourceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  resourceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
  },
  resourceIcon: {
    color: tokens.colorNeutralForeground3,
  },
  resourceInfo: {
    flex: 1,
    minWidth: 0,
  },
  emptyState: {
    padding: tokens.spacingVerticalM,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
  libraryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  libraryCard: {
    padding: tokens.spacingHorizontalM,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  libraryCardSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    ':hover': {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
  libraryVersionInput: {
    marginTop: tokens.spacingVerticalXS,
    width: '120px',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingVerticalS,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
});

const RESOURCE_TYPE_OPTIONS: { value: PCFResourceType; label: string; icon: React.ReactNode }[] = [
  { value: 'code', label: 'Code (TypeScript/JavaScript)', icon: <Code24Regular /> },
  { value: 'css', label: 'CSS Stylesheet', icon: <DocumentCss24Regular /> },
  { value: 'img', label: 'Image', icon: <Image24Regular /> },
  { value: 'resx', label: 'Localization (RESX)', icon: <Globe24Regular /> },
  { value: 'html', label: 'HTML Template', icon: <Document24Regular /> },
];

const getResourceIcon = (type: PCFResourceType) => {
  const option = RESOURCE_TYPE_OPTIONS.find((o) => o.value === type);
  return option?.icon || <Document24Regular />;
};

interface ResourcesPanelProps {
  resources: ManifestResource[];
  platformLibraries: PCFPlatformLibrary[];
  featureUsage: ManifestFeatureUsage;
  onAddResource: (resource: ManifestResource) => void;
  onRemoveResource: (id: string) => void;
  onToggleLibrary: (libraryName: PCFPlatformLibraryName) => void;
  onUpdateLibraryVersion: (libraryName: PCFPlatformLibraryName, version: string) => void;
  onSetFeatureUsage: (features: Partial<ManifestFeatureUsage>) => void;
}

export default function ResourcesPanel({
  resources,
  platformLibraries,
  featureUsage,
  onAddResource,
  onRemoveResource,
  onToggleLibrary,
  onUpdateLibraryVersion,
  onSetFeatureUsage,
}: ResourcesPanelProps) {
  const styles = useStyles();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newResource, setNewResource] = useState<Partial<ManifestResource>>({
    type: 'css',
    path: '',
  });

  const handleAddResource = () => {
    if (newResource.type && newResource.path) {
      onAddResource({
        id: `res-${Date.now()}`,
        type: newResource.type,
        path: newResource.path,
        order: resources.length + 1,
      });
      setNewResource({ type: 'css', path: '' });
      setIsAddDialogOpen(false);
    }
  };

  const groupedResources = RESOURCE_TYPE_OPTIONS.reduce((acc, opt) => {
    acc[opt.value] = resources.filter((r) => r.type === opt.value);
    return acc;
  }, {} as Record<PCFResourceType, ManifestResource[]>);

  return (
    <div className={styles.container}>
      <Text size={500} weight="semibold">
        Resources & Configuration
      </Text>

      {/* Resources Section */}
      <Card className={styles.card}>
        <div className={styles.sectionHeader}>
          <Text weight="semibold">Resource Files</Text>
          <Button
            appearance="primary"
            size="small"
            icon={<Add24Regular />}
            onClick={() => setIsAddDialogOpen(true)}
          >
            Add Resource
          </Button>
        </div>

        <div className={styles.resourceList}>
          {resources.length === 0 ? (
            <div className={styles.emptyState}>
              <Text>No additional resources. Add CSS, images, or localization files.</Text>
            </div>
          ) : (
            resources.map((resource) => (
              <div key={resource.id} className={styles.resourceItem}>
                <span className={styles.resourceIcon}>{getResourceIcon(resource.type)}</span>
                <div className={styles.resourceInfo}>
                  <Text weight="medium">{resource.path}</Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    {RESOURCE_TYPE_OPTIONS.find((o) => o.value === resource.type)?.label}
                  </Text>
                </div>
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<Delete24Regular />}
                  onClick={() => onRemoveResource(resource.id)}
                />
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Platform Libraries Section */}
      <div className={styles.section}>
        <Text weight="semibold" block style={{ marginBottom: tokens.spacingVerticalS }}>
          Platform Libraries
        </Text>
        <div className={styles.libraryGrid}>
          {PLATFORM_LIBRARIES.map((libInfo) => {
            const currentLib = platformLibraries.find((l) => l.name === libInfo.name);
            const isEnabled = currentLib?.enabled || false;
            const currentVersion = currentLib?.version || libInfo.defaultVersion;
            return (
              <Card
                key={libInfo.name}
                className={`${styles.libraryCard} ${isEnabled ? styles.libraryCardSelected : ''}`}
              >
                <div
                  style={{ display: 'flex', alignItems: 'flex-start', gap: tokens.spacingHorizontalS, cursor: 'pointer' }}
                  onClick={() => onToggleLibrary(libInfo.name)}
                >
                  <Checkbox checked={isEnabled} onChange={() => {}} />
                  <div style={{ flex: 1 }}>
                    <Text weight="semibold">{libInfo.label}</Text>
                    <Text size={200} block style={{ color: tokens.colorNeutralForeground3 }}>
                      {libInfo.description}
                    </Text>
                  </div>
                </div>
                {isEnabled && (
                  <div className={styles.libraryVersionInput} onClick={(e) => e.stopPropagation()}>
                    <Field label="Version" size="small">
                      <Input
                        size="small"
                        value={currentVersion}
                        onChange={(_, data) => onUpdateLibraryVersion(libInfo.name, data.value)}
                        placeholder={libInfo.defaultVersion}
                      />
                    </Field>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Feature Usage Section */}
      <div className={styles.section}>
        <Text weight="semibold" block style={{ marginBottom: tokens.spacingVerticalS }}>
          Feature Usage
        </Text>
        <Card className={styles.card}>
          <div className={styles.featureGrid}>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
              <Switch
                checked={featureUsage.usesWebAPI || false}
                onChange={(_, data) => onSetFeatureUsage({ usesWebAPI: data.checked })}
              />
              <div>
                <Text>Web API</Text>
                <Text size={200} block style={{ color: tokens.colorNeutralForeground3 }}>
                  Access Dataverse web API
                </Text>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
              <Switch
                checked={featureUsage.usesDevice || false}
                onChange={(_, data) => onSetFeatureUsage({ usesDevice: data.checked })}
              />
              <div>
                <Text>Device</Text>
                <Text size={200} block style={{ color: tokens.colorNeutralForeground3 }}>
                  Access device capabilities
                </Text>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
              <Switch
                checked={featureUsage.usesUtility || false}
                onChange={(_, data) => onSetFeatureUsage({ usesUtility: data.checked })}
              />
              <div>
                <Text>Utility</Text>
                <Text size={200} block style={{ color: tokens.colorNeutralForeground3 }}>
                  Access utility functions
                </Text>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Add Resource Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(_, data) => setIsAddDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Add Resource</DialogTitle>
            <DialogContent>
              <div className={styles.form}>
                <Field label="Resource Type" required>
                  <Select
                    value={newResource.type || 'css'}
                    onChange={(_, data) => setNewResource({ ...newResource, type: data.value as PCFResourceType })}
                  >
                    {RESOURCE_TYPE_OPTIONS.filter((o) => o.value !== 'code').map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="File Path" required hint="Relative path from control root">
                  <Input
                    value={newResource.path || ''}
                    onChange={(_, data) => setNewResource({ ...newResource, path: data.value })}
                    placeholder={
                      newResource.type === 'css'
                        ? 'css/styles.css'
                        : newResource.type === 'img'
                        ? 'img/icon.png'
                        : newResource.type === 'resx'
                        ? 'strings/MyControl.resx'
                        : 'file.html'
                    }
                  />
                </Field>
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={handleAddResource}
                disabled={!newResource.path}
              >
                Add
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
