import { useState, useEffect, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  Button,
  Input,
  Select,
  Field,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Divider,
  Badge,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  RadioGroup,
  Radio,
  Label,
  Tooltip,
  Switch,
} from '@fluentui/react-components';
import {
  FolderOpen24Regular,
  Play24Regular,
  Stop24Regular,
  Wrench24Regular,
  Archive24Regular,
  Settings24Regular,
  Add24Regular,
  DesignIdeas24Regular,
  ArrowSync24Regular,
  ArrowUp24Regular,
  Edit24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
  Code24Regular,
  DocumentBulletList24Regular,
} from '@fluentui/react-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageHeader, BuildOutput } from '../components/common';
import { useProjectStore } from '../stores/project.store';
import { useSettingsStore } from '../stores/settings.store';
import { useProjectKeyboardShortcuts } from '../hooks';
import { PCF_TEMPLATES, PCF_FRAMEWORKS } from '../../shared/constants/pcf.constants';
import type { ProjectSolutionInfo, ControlManifestInfo } from '../../shared/types/project.types';
import type { SolutionZipInfo } from '../../shared/types/solution.types';

const useStyles = makeStyles({
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  section: {
    marginBottom: tokens.spacingVerticalXXL,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    maxWidth: '600px',
    '@media (max-width: 700px)': {
      maxWidth: '100%',
    },
  },
  row: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    '@media (max-width: 600px)': {
      flexDirection: 'column',
    },
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL,
    flexWrap: 'wrap',
  },
  projectInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
    '@media (max-width: 600px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: tokens.spacingHorizontalS,
    },
  },
  infoCard: {
    padding: tokens.spacingVerticalM,
    '@media (max-width: 600px)': {
      padding: tokens.spacingVerticalS,
    },
  },
  infoLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  actionButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL,
    '@media (max-width: 600px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: tokens.spacingHorizontalS,
    },
  },
  actionCard: {
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  dialogForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  manifestContent: {
    backgroundColor: tokens.colorNeutralBackground3,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: 'monospace',
    fontSize: '12px',
    maxHeight: '400px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    '@media (max-width: 600px)': {
      maxHeight: '250px',
      fontSize: '11px',
    },
  },
  versionSection: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  versionDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  solutionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalM,
  },
  solutionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
  },
  solutionItemSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    ':hover': {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
  zipSection: {
    marginTop: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
});

// Validation helpers
const validatePascalCase = (value: string): string | null => {
  if (!value) return 'This field is required';
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
    return 'Must be PascalCase (e.g., MyComponent)';
  }
  return null;
};

const validateNamespace = (value: string): string | null => {
  if (!value) return 'This field is required';
  if (!/^[A-Z][a-zA-Z0-9]*(\.[A-Z][a-zA-Z0-9]*)*$/.test(value)) {
    return 'Invalid namespace format (e.g., MyNamespace or My.Namespace)';
  }
  return null;
};

const validatePublisherPrefix = (value: string): string | null => {
  if (!value) return 'This field is required';
  if (!/^[a-z]{2,8}$/.test(value)) {
    return 'Must be 2-8 lowercase letters';
  }
  return null;
};

export default function ProjectPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentProject, isLoading, error, createProject, openProject, setCurrentProject } =
    useProjectStore();
  const { settings, loadSettings } = useSettingsStore();

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Handle navigation state from template creation
  useEffect(() => {
    const state = location.state as { projectPath?: string } | null;
    if (state?.projectPath && !currentProject) {
      openProject(state.projectPath);
      // Clear the state to prevent re-opening on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, currentProject, openProject, navigate, location.pathname]);

  const [formData, setFormData] = useState({
    name: '',
    namespace: '',
    template: 'field' as 'field' | 'dataset',
    framework: 'react' as 'none' | 'react',
    outputDirectory: '',
  });

  // Initialize form with settings when they load
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      namespace: prev.namespace || settings.defaultNamespace,
      template: settings.defaultTemplate,
      framework: settings.defaultFramework,
    }));
  }, [settings]);

  const [devServerRunning, setDevServerRunning] = useState(false);
  const [devServerPort, setDevServerPort] = useState<number | null>(null);
  const [buildOutput, setBuildOutput] = useState<string | null>(null);
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false);
  const [isConfigureDialogOpen, setIsConfigureDialogOpen] = useState(false);
  const [isZipDialogOpen, setIsZipDialogOpen] = useState(false);
  const [manifestContent, setManifestContent] = useState<string>('');
  const [manifestInfo, setManifestInfo] = useState<ControlManifestInfo | null>(null);
  const [isEditingVersion, setIsEditingVersion] = useState(false);
  const [editVersion, setEditVersion] = useState('');
  const [projectSolutions, setProjectSolutions] = useState<ProjectSolutionInfo[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Validation errors
  const validationErrors = useMemo(() => ({
    name: validatePascalCase(formData.name),
    namespace: validateNamespace(formData.namespace),
  }), [formData.name, formData.namespace]);

  const isFormValid = !validationErrors.name && !validationErrors.namespace && formData.outputDirectory;

  // Package dialog state
  const [packageConfig, setPackageConfig] = useState({
    publisherName: '',
    publisherPrefix: '',
    configuration: 'Release' as 'Debug' | 'Release',
    solutionName: '',
    useExistingSolution: false,
    selectedSolutionPath: '',
  });

  // Initialize package config with settings
  useEffect(() => {
    setPackageConfig(prev => ({
      ...prev,
      publisherName: prev.publisherName || settings.defaultPublisherName,
      publisherPrefix: prev.publisherPrefix || settings.defaultPublisherPrefix,
    }));
  }, [settings]);

  // Zip dialog state
  const [zipInfo, setZipInfo] = useState<SolutionZipInfo | null>(null);
  const [zipNewVersion, setZipNewVersion] = useState('');
  const [zipRemoveGeneratedBy, setZipRemoveGeneratedBy] = useState(false);
  const [lastBuiltZipPath, setLastBuiltZipPath] = useState<string | null>(null);

  // Keyboard shortcuts (Ctrl+B: Build, Ctrl+Enter: Start, Ctrl+Shift+P: Package)
  useProjectKeyboardShortcuts({
    onBuild: () => currentProject && handleBuildShortcut(),
    onStart: () => currentProject && handleStartShortcut(),
    onPackage: () => currentProject && setIsPackageDialogOpen(true),
    onRefresh: () => currentProject && handleRefreshShortcut(),
  });

  // Handlers for keyboard shortcuts (need to be defined before hook usage)
  const handleBuildShortcut = async () => {
    if (!currentProject) return;
    setBuildOutput('Building...');
    const result = await window.electronAPI.pac.pcfBuild({
      projectPath: currentProject.path,
      production: false,
    });
    const output = result as { success: boolean; stdout: string; stderr: string };
    setBuildOutput(output.success ? 'Build successful!\n\n' + output.stdout : 'Build failed:\n\n' + output.stderr);
  };

  const handleStartShortcut = async () => {
    if (!currentProject) return;
    if (devServerRunning) {
      await handleStop();
      return;
    }
    setBuildOutput('Starting development server...');
    const result = await window.electronAPI.pac.pcfStart(currentProject.path);
    const output = result as { success: boolean; stdout: string; stderr: string; port?: number };
    if (output.success) {
      setDevServerRunning(true);
      if (output.port) {
        setDevServerPort(output.port);
      }
    }
    setBuildOutput(output.stdout || output.stderr);
  };

  const handleRefreshShortcut = async () => {
    if (!currentProject?.path) return;
    setIsRefreshing(true);
    try {
      await openProject(currentProject.path);
      setBuildOutput('Project refreshed successfully!');
    } catch (err) {
      setBuildOutput('Failed to refresh project: ' + (err as Error).message);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check dev server status when project changes
  useEffect(() => {
    if (currentProject?.path) {
      window.electronAPI.pac.pcfIsRunning(currentProject.path).then(setDevServerRunning);
    } else {
      setDevServerRunning(false);
      setDevServerPort(null);
    }
  }, [currentProject?.path]);

  // Load manifest info when project changes
  useEffect(() => {
    if (currentProject?.manifestPath) {
      loadManifestInfo();
      loadProjectSolutions();
    }
  }, [currentProject?.manifestPath]);

  const loadManifestInfo = async () => {
    if (!currentProject?.manifestPath) return;
    const info = await window.electronAPI.project.parseManifest(currentProject.manifestPath);
    if (info) {
      setManifestInfo(info);
      setEditVersion(info.version);
    }
  };

  const loadProjectSolutions = async () => {
    if (!currentProject?.path) return;
    const solutions = await window.electronAPI.project.findSolutions(currentProject.path);
    setProjectSolutions(solutions);
  };

  const handleRefresh = async () => {
    if (!currentProject?.path) return;
    setIsRefreshing(true);
    try {
      await openProject(currentProject.path);
      await loadManifestInfo();
      await loadProjectSolutions();
      setBuildOutput('Project refreshed successfully!');
    } catch (err) {
      setBuildOutput('Failed to refresh project: ' + (err as Error).message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelectFolder = async () => {
    const folderPath = await window.electronAPI.project.selectFolder();
    if (folderPath) {
      setFormData((prev) => ({ ...prev, outputDirectory: folderPath }));
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.outputDirectory) return;

    const fullPath = `${formData.outputDirectory}\\${formData.name}`;
    await createProject({
      ...formData,
      outputDirectory: fullPath,
    });
  };

  const handleOpenExisting = async () => {
    const folderPath = await window.electronAPI.project.selectFolder();
    if (folderPath) {
      await openProject(folderPath);
    }
  };

  const handleBuild = async () => {
    if (!currentProject) return;
    setBuildOutput('Building...');

    const result = await window.electronAPI.pac.pcfBuild({
      projectPath: currentProject.path,
      production: false,
    });

    const output = result as { success: boolean; stdout: string; stderr: string };
    setBuildOutput(output.success ? 'Build successful!\n\n' + output.stdout : 'Build failed:\n\n' + output.stderr);
  };

  const handleStart = async () => {
    if (!currentProject) return;
    setBuildOutput('Starting development server...');

    const result = await window.electronAPI.pac.pcfStart(currentProject.path);
    const output = result as { success: boolean; stdout: string; stderr: string; port?: number };
    if (output.success) {
      setDevServerRunning(true);
      if (output.port) {
        setDevServerPort(output.port);
      }
    }
    setBuildOutput(output.stdout || output.stderr);
  };

  const handleStop = async () => {
    if (!currentProject) return;
    await window.electronAPI.pac.pcfStop(currentProject.path);
    setDevServerRunning(false);
    setDevServerPort(null);
    setBuildOutput('Development server stopped.');
  };

  const handleOpenInExplorer = () => {
    if (currentProject) {
      window.electronAPI.fs.openInExplorer(currentProject.path);
    }
  };

  const handleOpenInEditor = async () => {
    if (currentProject) {
      const result = await window.electronAPI.fs.openInEditor(currentProject.path, settings.defaultEditor);
      if (!result.success) {
        setBuildOutput(`Failed to open in editor: ${result.error}`);
      }
    }
  };

  const handleUpdateVersion = async () => {
    if (!currentProject?.manifestPath || !editVersion) return;

    const success = await window.electronAPI.project.updateManifestVersion(
      currentProject.manifestPath,
      editVersion
    );

    if (success) {
      setManifestInfo((prev) => prev ? { ...prev, version: editVersion } : null);
      setIsEditingVersion(false);
      setBuildOutput(`Version updated to ${editVersion}`);
    } else {
      setBuildOutput('Failed to update version');
    }
  };

  const handleIncrementVersion = async () => {
    if (!currentProject?.manifestPath || !manifestInfo) return;

    const newVersion = await window.electronAPI.project.incrementVersion(manifestInfo.version);
    const success = await window.electronAPI.project.updateManifestVersion(
      currentProject.manifestPath,
      newVersion
    );

    if (success) {
      setManifestInfo((prev) => prev ? { ...prev, version: newVersion } : null);
      setEditVersion(newVersion);
      setBuildOutput(`Version incremented to ${newVersion}`);
    } else {
      setBuildOutput('Failed to increment version');
    }
  };

  const handleOpenPackageDialog = () => {
    // Reset package config
    setPackageConfig((prev) => ({
      ...prev,
      solutionName: currentProject?.name || '',
      useExistingSolution: projectSolutions.length > 0,
      selectedSolutionPath: projectSolutions.length > 0 ? projectSolutions[0].path : '',
    }));
    setIsPackageDialogOpen(true);
  };

  const handlePackage = async () => {
    if (!currentProject) return;
    setIsPackageDialogOpen(false);
    setBuildOutput('Creating solution and packaging...\n');

    try {
      let solutionPath: string;

      if (packageConfig.useExistingSolution && packageConfig.selectedSolutionPath) {
        // Use existing solution
        solutionPath = packageConfig.selectedSolutionPath;
        setBuildOutput((prev) => prev + `\nUsing existing solution: ${solutionPath}`);
      } else {
        // Create new solution
        const solutionName = packageConfig.solutionName || `${packageConfig.publisherPrefix}${currentProject.name}`;
        solutionPath = `${currentProject.path}\\${solutionName}`;

        setBuildOutput((prev) => prev + '\nStep 1: Creating solution...');
        const solutionResult = await window.electronAPI.pac.solutionInit({
          name: solutionName,
          publisherName: packageConfig.publisherName,
          publisherPrefix: packageConfig.publisherPrefix,
          outputDirectory: currentProject.path,
        });

        const solOutput = solutionResult as { success: boolean; stdout: string; stderr: string };
        if (!solOutput.success) {
          setBuildOutput((prev) => prev + '\nFailed to create solution:\n' + solOutput.stderr);
          return;
        }
        setBuildOutput((prev) => prev + '\nSolution created successfully.');

        // Add reference to PCF
        setBuildOutput((prev) => prev + '\nStep 2: Adding PCF reference to solution...');
        const addRefResult = await window.electronAPI.pac.solutionAddReference(
          solutionPath,
          currentProject.path
        );

        const refOutput = addRefResult as { success: boolean; stdout: string; stderr: string };
        if (!refOutput.success) {
          setBuildOutput((prev) => prev + '\nFailed to add reference:\n' + refOutput.stderr);
          return;
        }
        setBuildOutput((prev) => prev + '\nReference added successfully.');
      }

      // Build solution
      setBuildOutput((prev) => prev + `\nBuilding solution (${packageConfig.configuration})...`);
      const buildResult = await window.electronAPI.pac.solutionBuild(
        solutionPath,
        packageConfig.configuration
      );

      const buildOutput = buildResult as { success: boolean; stdout: string; stderr: string };
      if (buildOutput.success) {
        setBuildOutput((prev) => prev + '\n\nPackaging completed successfully!\n' + buildOutput.stdout);

        // Find and offer to modify the zip file
        const zips = await window.electronAPI.project.findSolutionZips(solutionPath);
        const zipPath = packageConfig.configuration === 'Release' ? zips.release : zips.debug;

        if (zipPath) {
          setLastBuiltZipPath(zipPath);
          // Automatically open zip dialog after successful build
          const info = await window.electronAPI.project.readSolutionZip(zipPath);
          if (info) {
            setZipInfo(info);
            setZipNewVersion(info.version);
            setZipRemoveGeneratedBy(info.hasGeneratedBy);
            setIsZipDialogOpen(true);
          }
        }

        // Reload project solutions
        await loadProjectSolutions();
      } else {
        setBuildOutput((prev) => prev + '\n\nPackaging failed:\n' + buildOutput.stderr);
      }
    } catch (err) {
      setBuildOutput((prev) => prev + '\n\nError: ' + (err as Error).message);
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
      setBuildOutput((prev) => prev + `\n\nSolution zip updated successfully!`);
      setIsZipDialogOpen(false);
    } else {
      setBuildOutput((prev) => prev + `\n\nFailed to update zip: ${result.error}`);
    }
  };

  const handleConfigure = async () => {
    if (!currentProject?.manifestPath) {
      setBuildOutput('Looking for manifest file...');
      return;
    }

    const result = await window.electronAPI.fs.readFile(currentProject.manifestPath);
    if (result.success && result.content) {
      setManifestContent(result.content);
      setIsConfigureDialogOpen(true);
    } else {
      setBuildOutput('Failed to read manifest file: ' + result.error);
    }
  };

  const handleOpenManifestInExplorer = () => {
    if (currentProject?.manifestPath) {
      window.electronAPI.fs.openInExplorer(currentProject.manifestPath);
    }
  };

  const handleCreateNew = () => {
    setCurrentProject(null);
  };

  if (currentProject) {
    return (
      <div className={styles.container}>
        <PageHeader
          title={currentProject.name}
          subtitle={currentProject.path}
          actions={
            <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, flexWrap: 'wrap' }}>
              <Tooltip content="Refresh project" relationship="label">
                <Button
                  appearance="subtle"
                  icon={isRefreshing ? <Spinner size="tiny" /> : <ArrowSync24Regular />}
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                />
              </Tooltip>
              <Button
                appearance="primary"
                icon={<Add24Regular />}
                onClick={handleCreateNew}
              >
                Create New PCF
              </Button>
              <Tooltip content="Open project in VS Code" relationship="label">
                <Button
                  appearance="subtle"
                  icon={<Code24Regular />}
                  onClick={handleOpenInEditor}
                >
                  Open in Editor
                </Button>
              </Tooltip>
              <Button
                appearance="subtle"
                icon={<FolderOpen24Regular />}
                onClick={handleOpenInExplorer}
              >
                Open in Explorer
              </Button>
            </div>
          }
        />

        <div className={styles.projectInfo}>
          <Card className={styles.infoCard}>
            <Text className={styles.infoLabel}>Type</Text>
            <Text weight="medium">PCF Component</Text>
          </Card>
          <Card className={styles.infoCard}>
            <Text className={styles.infoLabel}>Control Version</Text>
            <div className={styles.versionSection}>
              {isEditingVersion ? (
                <>
                  <Input
                    size="small"
                    value={editVersion}
                    onChange={(_, data) => setEditVersion(data.value)}
                    style={{ width: '100px' }}
                  />
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<Checkmark24Regular />}
                    onClick={handleUpdateVersion}
                  />
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<Dismiss24Regular />}
                    onClick={() => {
                      setIsEditingVersion(false);
                      setEditVersion(manifestInfo?.version || '');
                    }}
                  />
                </>
              ) : (
                <div className={styles.versionDisplay}>
                  <Text weight="medium">{manifestInfo?.version || 'Loading...'}</Text>
                  <Tooltip content="Edit version" relationship="label">
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={<Edit24Regular />}
                      onClick={() => setIsEditingVersion(true)}
                    />
                  </Tooltip>
                  <Tooltip content="Increment version (+1)" relationship="label">
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={<ArrowUp24Regular />}
                      onClick={handleIncrementVersion}
                    />
                  </Tooltip>
                </div>
              )}
            </div>
          </Card>
          <Card className={styles.infoCard}>
            <Text className={styles.infoLabel}>Solutions Found</Text>
            <Badge
              appearance={projectSolutions.length > 0 ? 'filled' : 'outline'}
              color={projectSolutions.length > 0 ? 'success' : 'warning'}
            >
              {projectSolutions.length}
            </Badge>
          </Card>
          <Card className={styles.infoCard}>
            <Text className={styles.infoLabel}>Last Opened</Text>
            <Text weight="medium">
              {new Date(currentProject.lastOpened).toLocaleDateString()}
            </Text>
          </Card>
        </div>

        <Divider />

        <div className={styles.actionButtons}>
          <Tooltip content="Ctrl+Enter" relationship="description" positioning="below">
            <Card className={styles.actionCard} onClick={devServerRunning ? handleStop : handleStart}>
              <CardHeader
                image={devServerRunning ? <Stop24Regular /> : <Play24Regular />}
                header={
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text weight="semibold">{devServerRunning ? 'Stop' : 'Start'}</Text>
                    {devServerRunning && (
                      <Badge appearance="filled" color="success" size="small">
                        Running{devServerPort ? ` :${devServerPort}` : ''}
                      </Badge>
                    )}
                  </span>
                }
                description={devServerRunning ? 'Stop development server' : 'Run development server'}
              />
            </Card>
          </Tooltip>
          <Tooltip content="Ctrl+B" relationship="description" positioning="below">
            <Card className={styles.actionCard} onClick={handleBuild}>
              <CardHeader
                image={<Wrench24Regular />}
                header={<Text weight="semibold">Build</Text>}
                description="Build the component"
              />
            </Card>
          </Tooltip>
          <Tooltip content="Ctrl+Shift+P" relationship="description" positioning="below">
            <Card className={styles.actionCard} onClick={handleOpenPackageDialog}>
              <CardHeader
                image={<Archive24Regular />}
                header={<Text weight="semibold">Package</Text>}
                description="Create solution package"
              />
            </Card>
          </Tooltip>
          <Card className={styles.actionCard} onClick={handleConfigure}>
            <CardHeader
              image={<Settings24Regular />}
              header={<Text weight="semibold">Configure</Text>}
              description="View manifest"
            />
          </Card>
          <Card className={styles.actionCard} onClick={() => navigate('/designer')}>
            <CardHeader
              image={<DesignIdeas24Regular />}
              header={<Text weight="semibold">Designer</Text>}
              description="Visual UI designer"
            />
          </Card>
        </div>

        {buildOutput && (
          <BuildOutput
            output={buildOutput}
            onClear={() => setBuildOutput(null)}
            title="Build Output"
          />
        )}

        {/* Package Dialog */}
        <Dialog open={isPackageDialogOpen} onOpenChange={(_, data) => setIsPackageDialogOpen(data.open)}>
          <DialogSurface style={{ maxWidth: '550px' }}>
            <DialogBody>
              <DialogTitle>Package Solution</DialogTitle>
              <DialogContent>
                <div className={styles.dialogForm}>
                  {projectSolutions.length > 0 && (
                    <>
                      <Field label="Solution Selection">
                        <RadioGroup
                          value={packageConfig.useExistingSolution ? 'existing' : 'new'}
                          onChange={(_, data) =>
                            setPackageConfig((prev) => ({
                              ...prev,
                              useExistingSolution: data.value === 'existing',
                            }))
                          }
                        >
                          <Radio value="existing" label="Use existing solution" />
                          <Radio value="new" label="Create new solution" />
                        </RadioGroup>
                      </Field>

                      {packageConfig.useExistingSolution && (
                        <div className={styles.solutionList}>
                          <Label>Select Solution:</Label>
                          {projectSolutions.map((sol) => (
                            <div
                              key={sol.path}
                              className={`${styles.solutionItem} ${packageConfig.selectedSolutionPath === sol.path ? styles.solutionItemSelected : ''}`}
                              onClick={() =>
                                setPackageConfig((prev) => ({
                                  ...prev,
                                  selectedSolutionPath: sol.path,
                                }))
                              }
                            >
                              <Archive24Regular />
                              <div>
                                <Text weight="medium">{sol.name}</Text>
                                <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                                  {sol.path}
                                </Text>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {(!packageConfig.useExistingSolution || projectSolutions.length === 0) && (
                    <>
                      <Field label="Solution Name">
                        <Input
                          value={packageConfig.solutionName}
                          onChange={(_, data) =>
                            setPackageConfig((prev) => ({ ...prev, solutionName: data.value }))
                          }
                          placeholder={`${packageConfig.publisherPrefix}${currentProject.name}`}
                        />
                      </Field>
                      <Field label="Publisher Name" hint="Your organization or personal name">
                        <Input
                          value={packageConfig.publisherName}
                          onChange={(_, data) =>
                            setPackageConfig((prev) => ({ ...prev, publisherName: data.value }))
                          }
                        />
                      </Field>
                      <Field
                        label="Publisher Prefix"
                        hint="2-8 lowercase letters (e.g., contoso)"
                        validationState={packageConfig.publisherPrefix && validatePublisherPrefix(packageConfig.publisherPrefix) ? 'error' : undefined}
                        validationMessage={packageConfig.publisherPrefix ? validatePublisherPrefix(packageConfig.publisherPrefix) : undefined}
                      >
                        <Input
                          value={packageConfig.publisherPrefix}
                          onChange={(_, data) =>
                            setPackageConfig((prev) => ({ ...prev, publisherPrefix: data.value.toLowerCase() }))
                          }
                        />
                      </Field>
                    </>
                  )}

                  <Field label="Configuration">
                    <RadioGroup
                      value={packageConfig.configuration}
                      onChange={(_, data) =>
                        setPackageConfig((prev) => ({
                          ...prev,
                          configuration: data.value as 'Debug' | 'Release',
                        }))
                      }
                    >
                      <Radio value="Debug" label="Debug" />
                      <Radio value="Release" label="Release (Recommended)" />
                    </RadioGroup>
                  </Field>
                </div>
              </DialogContent>
              <DialogActions>
                <DialogTrigger disableButtonEnhancement>
                  <Button appearance="secondary">Cancel</Button>
                </DialogTrigger>
                <Button
                  appearance="primary"
                  onClick={handlePackage}
                  disabled={!packageConfig.useExistingSolution && !!validatePublisherPrefix(packageConfig.publisherPrefix)}
                >
                  Package
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

        {/* Configure/Manifest Dialog */}
        <Dialog open={isConfigureDialogOpen} onOpenChange={(_, data) => setIsConfigureDialogOpen(data.open)}>
          <DialogSurface style={{ maxWidth: '700px' }}>
            <DialogBody>
              <DialogTitle>Control Manifest</DialogTitle>
              <DialogContent>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalS, display: 'block' }}>
                  {currentProject.manifestPath}
                </Text>
                <div className={styles.manifestContent}>
                  {manifestContent}
                </div>
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={handleOpenManifestInExplorer}>
                  Open in Explorer
                </Button>
                <Button
                  appearance="secondary"
                  icon={<DocumentBulletList24Regular />}
                  onClick={() => {
                    setIsConfigureDialogOpen(false);
                    navigate('/manifest');
                  }}
                >
                  Manifest Builder
                </Button>
                <DialogTrigger disableButtonEnhancement>
                  <Button appearance="primary">Close</Button>
                </DialogTrigger>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Project"
        subtitle="Create a new PCF component or open an existing project"
      />

      {error && (
        <MessageBar intent="error" style={{ marginBottom: tokens.spacingVerticalL }}>
          <MessageBarBody>
            <MessageBarTitle>Error</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.section}>
        <Text size={500} weight="semibold" block style={{ marginBottom: tokens.spacingVerticalM }}>
          Create New PCF Component
        </Text>

        <div className={styles.form}>
          <Field
            label="Component Name"
            required
            validationState={formData.name && validationErrors.name ? 'error' : undefined}
            validationMessage={formData.name ? validationErrors.name : undefined}
            hint="Use PascalCase (e.g., MyComponent, DatePicker)"
          >
            <Tooltip
              content="The name of your PCF control. Must start with uppercase and contain only letters and numbers."
              relationship="description"
              positioning="above"
            >
              <Input
                value={formData.name}
                onChange={(_, data) =>
                  setFormData((prev) => ({ ...prev, name: data.value }))
                }
                placeholder="MyComponent"
              />
            </Tooltip>
          </Field>

          <Field
            label="Namespace"
            required
            validationState={formData.namespace && validationErrors.namespace ? 'error' : undefined}
            validationMessage={formData.namespace ? validationErrors.namespace : undefined}
            hint="Usually your company or project name"
          >
            <Tooltip
              content="The namespace groups your controls. Use PascalCase, can include dots (e.g., Contoso.Controls)."
              relationship="description"
              positioning="above"
            >
              <Input
                value={formData.namespace}
                onChange={(_, data) =>
                  setFormData((prev) => ({ ...prev, namespace: data.value }))
                }
                placeholder="MyNamespace"
              />
            </Tooltip>
          </Field>

          <div className={styles.row}>
            <Field label="Template" style={{ flex: 1 }}>
              <Select
                value={formData.template}
                onChange={(_, data) =>
                  setFormData((prev) => ({
                    ...prev,
                    template: data.value as 'field' | 'dataset',
                  }))
                }
              >
                {PCF_TEMPLATES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Framework" style={{ flex: 1 }}>
              <Select
                value={formData.framework}
                onChange={(_, data) =>
                  setFormData((prev) => ({
                    ...prev,
                    framework: data.value as 'none' | 'react',
                  }))
                }
              >
                {PCF_FRAMEWORKS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Output Directory" required>
            <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
              <Input
                value={formData.outputDirectory}
                onChange={(_, data) =>
                  setFormData((prev) => ({ ...prev, outputDirectory: data.value }))
                }
                placeholder="Select a folder..."
                style={{ flex: 1 }}
              />
              <Button onClick={handleSelectFolder}>Browse</Button>
            </div>
          </Field>

          <div className={styles.actions}>
            <Tooltip
              content={!isFormValid ? 'Please fill all required fields correctly' : 'Create your PCF project'}
              relationship="label"
            >
              <Button
                appearance="primary"
                onClick={handleCreate}
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? <Spinner size="tiny" /> : 'Create Project'}
              </Button>
            </Tooltip>
            <Button appearance="secondary" onClick={handleOpenExisting}>
              Open Existing
            </Button>
            <Button
              appearance="outline"
              icon={<DesignIdeas24Regular />}
              onClick={() => navigate('/designer')}
            >
              Start with Visual Designer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
