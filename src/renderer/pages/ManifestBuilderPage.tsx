import { useState, useEffect } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Tab,
  TabList,
  Tooltip,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Text,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import {
  ArrowUndo24Regular,
  ArrowRedo24Regular,
  FolderOpen24Regular,
  DocumentAdd24Regular,
  Save24Regular,
  ArrowReset24Regular,
  Warning24Regular,
} from '@fluentui/react-icons';
import { PageHeader } from '../components/common';
import {
  PropertyList,
  ControlInfoPanel,
  ResourcesPanel,
  ManifestPreview,
  parseManifestXml,
  validateManifest,
} from '../components/manifest-builder';
import { useManifestStore } from '../stores/manifest.store';
import { useProjectStore } from '../stores/project.store';

const useStyles = makeStyles({
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    flexWrap: 'wrap',
  },
  toolbarSpacer: {
    flex: 1,
  },
  toolbarGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  toolbarDivider: {
    width: '1px',
    height: '24px',
    backgroundColor: tokens.colorNeutralStroke1,
    marginLeft: tokens.spacingHorizontalS,
    marginRight: tokens.spacingHorizontalS,
  },
  content: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalL,
    padding: tokens.spacingHorizontalL,
    overflow: 'hidden',
    '@media (max-width: 1000px)': {
      gridTemplateColumns: '1fr',
      overflow: 'auto',
    },
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    minHeight: 0,
  },
  tabContent: {
    flex: 1,
    overflow: 'auto',
    paddingTop: tokens.spacingVerticalM,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
});

type TabValue = 'properties' | 'resources' | 'control';

export default function ManifestBuilderPage() {
  const styles = useStyles();
  const { currentProject } = useProjectStore();
  const {
    manifest,
    selectedPropertyId,
    isDirty,
    setControlInfo,
    addProperty,
    updateProperty,
    removeProperty,
    reorderProperties,
    addResource,
    removeResource,
    togglePlatformLibrary,
    updatePlatformLibraryVersion,
    setFeatureUsage,
    setSelectedPropertyId,
    undo,
    redo,
    canUndo,
    canRedo,
    loadManifest,
    reset,
  } = useManifestStore();

  const [selectedTab, setSelectedTab] = useState<TabValue>('properties');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load manifest from current project on mount
  useEffect(() => {
    if (currentProject?.manifestPath) {
      loadFromProject();
    }
  }, [currentProject?.manifestPath]);

  const loadFromProject = async () => {
    if (!currentProject?.manifestPath) return;

    try {
      const result = await window.electronAPI.fs.readFile(currentProject.manifestPath);
      if (result.success && result.content) {
        const parsed = parseManifestXml(result.content);
        loadManifest(parsed);
      }
    } catch (error) {
      console.error('Failed to load manifest:', error);
    }
  };

  const handleImportFile = async () => {
    setImportError(null);

    try {
      const folderPath = await window.electronAPI.project.selectFolder();
      if (!folderPath) return;

      // Look for ControlManifest.Input.xml in the folder
      const manifestPath = `${folderPath}\\ControlManifest.Input.xml`;
      const exists = await window.electronAPI.fs.exists(manifestPath);

      if (!exists) {
        setImportError('No ControlManifest.Input.xml found in the selected folder');
        return;
      }

      const result = await window.electronAPI.fs.readFile(manifestPath);
      if (!result.success || !result.content) {
        setImportError('Failed to read manifest file');
        return;
      }

      const parsed = parseManifestXml(result.content);
      const validation = validateManifest(parsed);

      if (!validation.valid) {
        setImportError(`Manifest has issues:\n${validation.errors.join('\n')}`);
      }

      loadManifest(parsed);
      setIsImportDialogOpen(false);
    } catch (error) {
      setImportError(`Failed to parse manifest: ${(error as Error).message}`);
    }
  };

  const handleSaveToProject = async (content: string) => {
    if (!currentProject?.manifestPath) {
      // No project open, download instead
      return;
    }

    try {
      const result = await window.electronAPI.fs.writeFile(currentProject.manifestPath, content);
      if (result.success) {
        setSaveMessage('Manifest saved to project!');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage('Failed to save: ' + result.error);
        setTimeout(() => setSaveMessage(null), 5000);
      }
    } catch (error) {
      setSaveMessage('Failed to save: ' + (error as Error).message);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  const handleReset = () => {
    reset();
    setIsResetDialogOpen(false);
  };

  return (
    <div className={styles.container}>
      <PageHeader
        title="Manifest Builder"
        subtitle="Visually edit your PCF control manifest"
      />

      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <Tooltip content="Undo (Ctrl+Z)" relationship="label">
            <Button
              appearance="subtle"
              icon={<ArrowUndo24Regular />}
              disabled={!canUndo()}
              onClick={undo}
            />
          </Tooltip>
          <Tooltip content="Redo (Ctrl+Y)" relationship="label">
            <Button
              appearance="subtle"
              icon={<ArrowRedo24Regular />}
              disabled={!canRedo()}
              onClick={redo}
            />
          </Tooltip>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <Tooltip content="Import from folder" relationship="label">
            <Button
              appearance="subtle"
              icon={<FolderOpen24Regular />}
              onClick={() => setIsImportDialogOpen(true)}
            >
              Import
            </Button>
          </Tooltip>
          {currentProject && (
            <Tooltip content="Reload from project" relationship="label">
              <Button appearance="subtle" icon={<DocumentAdd24Regular />} onClick={loadFromProject}>
                Reload
              </Button>
            </Tooltip>
          )}
        </div>

        <div className={styles.toolbarSpacer} />

        <div className={styles.toolbarGroup}>
          <Button
            appearance="subtle"
            icon={<ArrowReset24Regular />}
            onClick={() => setIsResetDialogOpen(true)}
          >
            Reset
          </Button>
        </div>
      </div>

      {saveMessage && (
        <MessageBar
          intent={saveMessage.includes('Failed') ? 'error' : 'success'}
          style={{ margin: tokens.spacingHorizontalM, marginBottom: 0 }}
        >
          <MessageBarBody>{saveMessage}</MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.content}>
        {/* Left Panel - Editor */}
        <div className={styles.panel}>
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, data) => setSelectedTab(data.value as TabValue)}
          >
            <Tab value="properties">Properties</Tab>
            <Tab value="resources">Resources</Tab>
            <Tab value="control">Control Info</Tab>
          </TabList>

          <div className={styles.tabContent}>
            {selectedTab === 'properties' && (
              <PropertyList
                properties={manifest.properties}
                selectedId={selectedPropertyId}
                onSelect={setSelectedPropertyId}
                onAdd={addProperty}
                onUpdate={updateProperty}
                onRemove={removeProperty}
                onReorder={reorderProperties}
              />
            )}

            {selectedTab === 'resources' && (
              <ResourcesPanel
                resources={manifest.resources}
                platformLibraries={manifest.platformLibraries}
                featureUsage={manifest.featureUsage}
                onAddResource={addResource}
                onRemoveResource={removeResource}
                onToggleLibrary={togglePlatformLibrary}
                onUpdateLibraryVersion={updatePlatformLibraryVersion}
                onSetFeatureUsage={setFeatureUsage}
              />
            )}

            {selectedTab === 'control' && (
              <ControlInfoPanel
                control={manifest.control}
                onChange={setControlInfo}
              />
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className={styles.panel}>
          <ManifestPreview
            manifest={manifest}
            onSave={currentProject ? handleSaveToProject : undefined}
          />
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={(_, data) => setIsResetDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                <Warning24Regular style={{ color: tokens.colorPaletteYellowForeground1 }} />
                Reset Manifest
              </div>
            </DialogTitle>
            <DialogContent>
              <Text>
                Are you sure you want to reset the manifest to default values? All your changes will be lost.
              </Text>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsResetDialogOpen(false)}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={handleReset}>
                Reset
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={(_, data) => setIsImportDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Import Manifest</DialogTitle>
            <DialogContent>
              <div className={styles.form}>
                <Text>
                  Select a folder containing a ControlManifest.Input.xml file to import.
                </Text>
                {importError && (
                  <MessageBar intent="error">
                    <MessageBarBody style={{ whiteSpace: 'pre-wrap' }}>{importError}</MessageBarBody>
                  </MessageBar>
                )}
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsImportDialogOpen(false)}>
                Cancel
              </Button>
              <Button appearance="primary" icon={<FolderOpen24Regular />} onClick={handleImportFile}>
                Select Folder
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
