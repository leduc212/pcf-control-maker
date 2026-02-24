import { useState, useEffect } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  Button,
  Input,
  Field,
  Spinner,
  MessageBar,
  MessageBarBody,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Badge,
  Divider,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Tooltip,
  Switch,
  Label,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Folder24Regular,
  FolderOpen24Regular,
  Delete24Regular,
  Archive24Regular,
  MoreHorizontal24Regular,
  ArrowDownload24Regular,
  Cube24Regular,
  Dismiss24Regular,
  ArrowSync24Regular,
  Edit24Regular,
  Warning24Regular,
} from '@fluentui/react-icons';
import { PageHeader, BuildOutput } from '../components/common';
import { useSettingsStore } from '../stores/settings.store';
import type { Solution, SolutionZipInfo } from '../../shared/types/solution.types';

const useStyles = makeStyles({
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  headerActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  solutionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  solutionCard: {
    padding: tokens.spacingHorizontalL,
    '@media (max-width: 600px)': {
      padding: tokens.spacingHorizontalM,
    },
  },
  solutionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacingVerticalM,
    gap: tokens.spacingHorizontalS,
  },
  solutionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    minWidth: 0,
    flex: 1,
  },
  solutionPath: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  solutionMeta: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalXS,
    flexWrap: 'wrap',
  },
  componentsList: {
    marginTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM,
  },
  componentItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    marginBottom: tokens.spacingVerticalXS,
  },
  componentInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  emptyComponents: {
    padding: tokens.spacingVerticalL,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
  actionButtons: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalM,
    flexWrap: 'wrap',
  },
  dialogForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
    paddingTop: '48px',
    paddingBottom: '48px',
  },
  emptyStateIcon: {
    fontSize: '48px',
    color: tokens.colorNeutralForeground3,
    marginBottom: tokens.spacingVerticalM,
  },
  emptyStateTitle: {
    marginBottom: tokens.spacingVerticalS,
  },
  emptyStateDescription: {
    color: tokens.colorNeutralForeground3,
    marginBottom: tokens.spacingVerticalL,
  },
  outputBox: {
    marginTop: tokens.spacingVerticalL,
  },
  zipSection: {
    marginTop: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
  zipButtons: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS,
  },
});

export default function SolutionsPage() {
  const styles = useStyles();
  const { settings, loadSettings } = useSettingsStore();

  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isZipDialogOpen, setIsZipDialogOpen] = useState(false);
  const [buildOutput, setBuildOutput] = useState<string | null>(null);
  const [newSolution, setNewSolution] = useState({
    name: '',
    path: '',
    publisherName: '',
    publisherPrefix: '',
  });

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  // Zip dialog state
  const [zipInfo, setZipInfo] = useState<SolutionZipInfo | null>(null);
  const [zipNewVersion, setZipNewVersion] = useState('');
  const [zipRemoveGeneratedBy, setZipRemoveGeneratedBy] = useState(false);

  useEffect(() => {
    loadSettings();
    loadSolutions();
  }, []);

  // Initialize form with settings
  useEffect(() => {
    setNewSolution(prev => ({
      ...prev,
      publisherName: prev.publisherName || settings.defaultPublisherName,
      publisherPrefix: prev.publisherPrefix || settings.defaultPublisherPrefix,
    }));
  }, [settings]);

  const loadSolutions = async () => {
    setIsLoading(true);
    try {
      const data = await window.electronAPI.solution.getAll();
      setSolutions(data);
    } catch (error) {
      console.error('Failed to load solutions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadSolutions();
      setBuildOutput('Solutions list refreshed!');
    } catch (error) {
      setBuildOutput('Failed to refresh solutions: ' + (error as Error).message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelectFolder = async () => {
    const folderPath = await window.electronAPI.solution.selectFolder();
    if (folderPath) {
      setNewSolution((prev) => ({ ...prev, path: folderPath }));
    }
  };

  const handleCreateSolution = async () => {
    if (!newSolution.name || !newSolution.path) return;

    setIsCreateDialogOpen(false);
    setBuildOutput('Creating solution...');

    const solution = await window.electronAPI.solution.create(newSolution);

    if (solution) {
      setBuildOutput('Solution created successfully!');
      await loadSolutions();
      setNewSolution({
        name: '',
        path: '',
        publisherName: DEFAULT_PUBLISHER_NAME,
        publisherPrefix: DEFAULT_PUBLISHER_PREFIX,
      });
    } else {
      setBuildOutput('Failed to create solution. Make sure PAC CLI is installed.');
    }
  };

  const handleDeleteSolution = (solutionId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Remove Solution',
      message: 'Remove this solution from the list? (Files will not be deleted from disk)',
      onConfirm: async () => {
        await window.electronAPI.solution.delete(solutionId);
        await loadSolutions();
        setConfirmDialog(prev => ({ ...prev, open: false }));
        setBuildOutput('Solution removed from list.');
      },
    });
  };

  const handleAddComponent = async (solutionId: string) => {
    const pcfPath = await window.electronAPI.solution.selectPcfProject();
    if (!pcfPath) return;

    setBuildOutput('Adding component to solution...');
    const result = await window.electronAPI.solution.addComponent(solutionId, pcfPath);

    if (result.success) {
      setBuildOutput('Component added successfully!');
      await loadSolutions();
    } else {
      setBuildOutput('Failed to add component: ' + result.error);
    }
  };

  const handleRemoveComponent = (solutionId: string, componentPath: string) => {
    setConfirmDialog({
      open: true,
      title: 'Remove Component',
      message: 'Remove this component from the solution? You can add it back later.',
      onConfirm: async () => {
        await window.electronAPI.solution.removeComponent(solutionId, componentPath);
        await loadSolutions();
        setConfirmDialog(prev => ({ ...prev, open: false }));
        setBuildOutput('Component removed from solution.');
      },
    });
  };

  const handleBuildSolution = async (solution: Solution, configuration: 'Debug' | 'Release') => {
    setBuildOutput(`Building solution (${configuration})...`);

    const result = await window.electronAPI.solution.build(solution.id, configuration);

    if (result.success) {
      setBuildOutput(`Build successful!\n\nOutput: ${result.outputPath}\n\n${result.stdout}`);

      // After successful build, offer to modify the zip
      if (result.outputPath) {
        const info = await window.electronAPI.project.readSolutionZip(result.outputPath);
        if (info) {
          setZipInfo(info);
          setZipNewVersion(info.version);
          setZipRemoveGeneratedBy(info.hasGeneratedBy);
          setIsZipDialogOpen(true);
        }
      }

      await loadSolutions();
    } else {
      setBuildOutput(`Build failed:\n\n${result.stderr}`);
    }
  };

  const handleViewZipInfo = async (solutionPath: string, configuration: 'Debug' | 'Release') => {
    const zips = await window.electronAPI.project.findSolutionZips(solutionPath);
    const zipPath = configuration === 'Release' ? zips.release : zips.debug;

    if (zipPath) {
      const info = await window.electronAPI.project.readSolutionZip(zipPath);
      if (info) {
        setZipInfo(info);
        setZipNewVersion(info.version);
        setZipRemoveGeneratedBy(info.hasGeneratedBy);
        setIsZipDialogOpen(true);
      } else {
        setBuildOutput('Failed to read solution.xml from zip file.');
      }
    } else {
      setBuildOutput(`No ${configuration} zip file found. Build the solution first.`);
    }
  };

  const handleUpdateZip = async () => {
    if (!zipInfo) return;

    const result = await window.electronAPI.project.updateSolutionZip({
      zipPath: zipInfo.zipPath,
      newVersion: zipNewVersion !== zipInfo.version ? zipNewVersion : undefined,
      removeGeneratedBy: zipRemoveGeneratedBy && zipInfo.hasGeneratedBy,
    });

    if (result.success) {
      setBuildOutput((prev) => (prev || '') + `\n\nSolution zip updated successfully!`);
      setIsZipDialogOpen(false);
    } else {
      setBuildOutput((prev) => (prev || '') + `\n\nFailed to update zip: ${result.error}`);
    }
  };

  const handleOpenInExplorer = (path: string) => {
    window.electronAPI.fs.openInExplorer(path);
  };

  const handleImportSolution = async () => {
    const folderPath = await window.electronAPI.solution.selectFolder();
    if (!folderPath) return;

    setBuildOutput('Importing solution...');
    const solution = await window.electronAPI.solution.import(folderPath);

    if (solution) {
      setBuildOutput('Solution imported successfully!');
      await loadSolutions();
    } else {
      setBuildOutput('Failed to import. Make sure this is a valid solution folder (contains .cdsproj file).');
    }
  };

  return (
    <div className={styles.container}>
      <PageHeader
        title="Solutions"
        subtitle="Manage solution packages with multiple PCF components"
        actions={
          <div className={styles.headerActions}>
            <Tooltip content="Refresh solutions list" relationship="label">
              <Button
                appearance="subtle"
                icon={isRefreshing ? <Spinner size="tiny" /> : <ArrowSync24Regular />}
                onClick={handleRefresh}
                disabled={isRefreshing}
              />
            </Tooltip>
            <Button appearance="secondary" icon={<ArrowDownload24Regular />} onClick={handleImportSolution}>
              Import Existing
            </Button>
            <Button appearance="primary" icon={<Add24Regular />} onClick={() => setIsCreateDialogOpen(true)}>
              Create Solution
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <Spinner label="Loading solutions..." />
      ) : solutions.length > 0 ? (
        <div className={styles.solutionsList}>
          {solutions.map((solution) => (
            <Card key={solution.id} className={styles.solutionCard}>
              <div className={styles.solutionHeader}>
                <div className={styles.solutionInfo}>
                  <Text size={500} weight="semibold">
                    {solution.name}
                  </Text>
                  <Text className={styles.solutionPath}>{solution.path}</Text>
                  <div className={styles.solutionMeta}>
                    <Badge appearance="outline" size="small">
                      {solution.publisherPrefix}
                    </Badge>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      Publisher: {solution.publisherName}
                    </Text>
                    {solution.lastBuilt && (
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        Last built: {new Date(solution.lastBuilt).toLocaleDateString()}
                      </Text>
                    )}
                  </div>
                </div>

                <Menu>
                  <MenuTrigger disableButtonEnhancement>
                    <Button appearance="subtle" icon={<MoreHorizontal24Regular />} />
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      <MenuItem icon={<FolderOpen24Regular />} onClick={() => handleOpenInExplorer(solution.path)}>
                        Open in Explorer
                      </MenuItem>
                      <MenuItem icon={<Edit24Regular />} onClick={() => handleViewZipInfo(solution.path, 'Release')}>
                        Edit Release Zip
                      </MenuItem>
                      <MenuItem icon={<Edit24Regular />} onClick={() => handleViewZipInfo(solution.path, 'Debug')}>
                        Edit Debug Zip
                      </MenuItem>
                      <MenuItem icon={<Delete24Regular />} onClick={() => handleDeleteSolution(solution.id)}>
                        Remove from List
                      </MenuItem>
                    </MenuList>
                  </MenuPopover>
                </Menu>
              </div>

              <Divider />

              <div className={styles.componentsList}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacingVerticalS }}>
                  <Text weight="medium">Components ({solution.components.length})</Text>
                  <Button size="small" icon={<Add24Regular />} onClick={() => handleAddComponent(solution.id)}>
                    Add Component
                  </Button>
                </div>

                {solution.components.length > 0 ? (
                  solution.components.map((component) => (
                    <div key={component.path} className={styles.componentItem}>
                      <div className={styles.componentInfo}>
                        <Cube24Regular />
                        <div>
                          <Text weight="medium">{component.name}</Text>
                          <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                            {component.path}
                          </Text>
                        </div>
                      </div>
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<Dismiss24Regular />}
                        onClick={() => handleRemoveComponent(solution.id, component.path)}
                      />
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyComponents}>
                    <Text>No components added yet. Click "Add Component" to add PCF projects.</Text>
                  </div>
                )}
              </div>

              <div className={styles.actionButtons}>
                <Button
                  appearance="primary"
                  icon={<Archive24Regular />}
                  onClick={() => handleBuildSolution(solution, 'Release')}
                  disabled={solution.components.length === 0}
                >
                  Build Release
                </Button>
                <Button
                  appearance="secondary"
                  icon={<Archive24Regular />}
                  onClick={() => handleBuildSolution(solution, 'Debug')}
                  disabled={solution.components.length === 0}
                >
                  Build Debug
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className={styles.emptyState}>
            <Folder24Regular className={styles.emptyStateIcon} />
            <Text size={400} weight="medium" className={styles.emptyStateTitle}>
              No solutions yet
            </Text>
            <Text size={300} className={styles.emptyStateDescription}>
              Create a solution to package multiple PCF components together
            </Text>
            <Button appearance="primary" icon={<Add24Regular />} onClick={() => setIsCreateDialogOpen(true)}>
              Create Your First Solution
            </Button>
          </div>
        </Card>
      )}

      {buildOutput && (
        <div className={styles.outputBox}>
          <BuildOutput
            output={buildOutput}
            onClear={() => setBuildOutput(null)}
            title="Output"
          />
        </div>
      )}

      {/* Create Solution Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(_, data) => setIsCreateDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Create New Solution</DialogTitle>
            <DialogContent>
              <div className={styles.dialogForm}>
                <Field label="Solution Name" required>
                  <Input
                    value={newSolution.name}
                    onChange={(_, data) => setNewSolution((prev) => ({ ...prev, name: data.value }))}
                    placeholder="MyCombinedSolution"
                  />
                </Field>
                <Field label="Location" required>
                  <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
                    <Input
                      value={newSolution.path}
                      onChange={(_, data) => setNewSolution((prev) => ({ ...prev, path: data.value }))}
                      placeholder="Select a folder..."
                      style={{ flex: 1 }}
                    />
                    <Button onClick={handleSelectFolder}>Browse</Button>
                  </div>
                </Field>
                <Field label="Publisher Name">
                  <Input
                    value={newSolution.publisherName}
                    onChange={(_, data) => setNewSolution((prev) => ({ ...prev, publisherName: data.value }))}
                  />
                </Field>
                <Field label="Publisher Prefix">
                  <Input
                    value={newSolution.publisherPrefix}
                    onChange={(_, data) => setNewSolution((prev) => ({ ...prev, publisherPrefix: data.value }))}
                  />
                </Field>
              </div>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button
                appearance="primary"
                onClick={handleCreateSolution}
                disabled={!newSolution.name || !newSolution.path}
              >
                Create
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Solution Zip Modification Dialog */}
      <Dialog open={isZipDialogOpen} onOpenChange={(_, data) => setIsZipDialogOpen(data.open)}>
        <DialogSurface style={{ maxWidth: '600px' }}>
          <DialogBody>
            <DialogTitle>Modify Solution Package</DialogTitle>
            <DialogContent>
              {zipInfo && (
                <div className={styles.dialogForm}>
                  <div className={styles.zipSection}>
                    <Text weight="medium" block style={{ marginBottom: tokens.spacingVerticalS }}>
                      Package Info
                    </Text>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                      Zip File: {zipInfo.zipPath}
                    </Text>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                      Solution Name: {zipInfo.uniqueName}
                    </Text>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                      Publisher: {zipInfo.publisherName}
                    </Text>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                      Current Version: {zipInfo.version}
                    </Text>
                  </div>

                  <Field label="New Version">
                    <Input
                      value={zipNewVersion}
                      onChange={(_, data) => setZipNewVersion(data.value)}
                      placeholder={zipInfo.version}
                    />
                  </Field>

                  {zipInfo.hasGeneratedBy && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                      <Switch
                        checked={zipRemoveGeneratedBy}
                        onChange={(_, data) => setZipRemoveGeneratedBy(data.checked)}
                      />
                      <Label>Remove generatedBy="CrmLive" attribute</Label>
                    </div>
                  )}

                  <MessageBar intent="info" style={{ marginTop: tokens.spacingVerticalS }}>
                    <MessageBarBody>
                      This will modify the solution.xml file inside the zip package.
                    </MessageBarBody>
                  </MessageBar>
                </div>
              )}
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Skip</Button>
              </DialogTrigger>
              <Button appearance="primary" onClick={handleUpdateZip}>
                Update Package
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(_, data) => setConfirmDialog(prev => ({ ...prev, open: data.open }))}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                <Warning24Regular style={{ color: tokens.colorPaletteYellowForeground1 }} />
                {confirmDialog.title}
              </div>
            </DialogTitle>
            <DialogContent>
              <Text>{confirmDialog.message}</Text>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button appearance="primary" onClick={confirmDialog.onConfirm}>
                Confirm
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
