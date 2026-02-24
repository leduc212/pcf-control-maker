import { useState } from 'react';
import {
  makeStyles,
  tokens,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  TabList,
  Tab,
  Text,
  MessageBar,
  MessageBarBody,
  Spinner,
  Field,
  Input,
  Divider,
} from '@fluentui/react-components';
import {
  Save24Regular,
  FolderOpen24Regular,
  Checkmark24Regular,
  Add24Regular,
  Code24Regular,
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import type { GeneratedCode } from '../CodeGen';
import { CodePreview } from './CodePreview';
import { useProjectStore } from '../../../stores/project.store';
import { DEFAULT_NAMESPACE } from '../../../../shared/constants/pcf.constants';

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    minWidth: '600px',
    maxWidth: '800px',
  },
  tabContent: {
    marginTop: tokens.spacingVerticalM,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  successMessage: {
    marginTop: tokens.spacingVerticalM,
  },
  modeSelector: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalM,
  },
  modeButton: {
    flex: 1,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  folderRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  outputLog: {
    backgroundColor: tokens.colorNeutralBackground3,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: 'monospace',
    fontSize: '12px',
    maxHeight: '150px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
  },
});

type TabValue = 'manifest' | 'component' | 'index';
type DialogMode = 'preview' | 'create';

interface ExportDialogProps {
  generatedCode: GeneratedCode;
  constructorName: string;
  onExport: (targetPath: string) => Promise<void>;
  trigger?: React.ReactNode;
}

export function ExportDialog({
  generatedCode,
  constructorName,
  onExport,
  trigger,
}: ExportDialogProps) {
  const styles = useStyles();
  const navigate = useNavigate();
  const { openProject } = useProjectStore();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DialogMode>('preview');
  const [selectedTab, setSelectedTab] = useState<TabValue>('manifest');
  const [isExporting, setIsExporting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [createLog, setCreateLog] = useState<string>('');

  const [projectForm, setProjectForm] = useState({
    name: constructorName || 'MyControl',
    namespace: DEFAULT_NAMESPACE,
    outputDirectory: '',
  });

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportError(null);

      // Open folder picker
      const result = await window.electronAPI.project.selectFolder();
      if (!result) {
        setIsExporting(false);
        return;
      }

      await onExport(result);
      setExportSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setExportSuccess(false);
      }, 2000);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectFolder = async () => {
    const folderPath = await window.electronAPI.project.selectFolder();
    if (folderPath) {
      setProjectForm((prev) => ({ ...prev, outputDirectory: folderPath }));
    }
  };

  const handleCreateProject = async () => {
    if (!projectForm.name || !projectForm.outputDirectory) return;

    setIsCreating(true);
    setExportError(null);
    setCreateLog('');

    try {
      const fullPath = `${projectForm.outputDirectory}\\${projectForm.name}`;

      // Step 1: Create PCF project with React framework
      setCreateLog((prev) => prev + 'Creating PCF project with React framework...\n');
      const initResult = await window.electronAPI.pac.pcfInit({
        name: projectForm.name,
        namespace: projectForm.namespace,
        template: 'field',
        framework: 'react',
        outputDirectory: fullPath,
        runNpmInstall: true,
      });

      const initOutput = initResult as { success: boolean; stdout: string; stderr: string };
      if (!initOutput.success) {
        throw new Error(initOutput.stderr || 'Failed to create PCF project');
      }
      setCreateLog((prev) => prev + 'PCF project created successfully.\n');

      // Step 2: Install Fluent UI dependencies
      setCreateLog((prev) => prev + 'Installing Fluent UI dependencies...\n');
      const installResult = await window.electronAPI.pac.npmInstall(
        fullPath,
        ['@fluentui/react-components', '@fluentui/react-icons']
      );
      const installOutput = installResult as { success: boolean; stdout: string; stderr: string };
      if (!installOutput.success) {
        setCreateLog((prev) => prev + 'Warning: Could not install Fluent UI. You may need to install manually.\n');
      } else {
        setCreateLog((prev) => prev + 'Fluent UI dependencies installed.\n');
      }

      // Step 3: Write the generated code files
      setCreateLog((prev) => prev + 'Writing generated code files...\n');

      // Write manifest
      await window.electronAPI.fs.writeFile(
        `${fullPath}/${projectForm.name}/ControlManifest.Input.xml`,
        generatedCode.manifest
      );

      // Write component
      await window.electronAPI.fs.writeFile(
        `${fullPath}/${projectForm.name}/${projectForm.name}.tsx`,
        generatedCode.component
      );

      // Write index
      await window.electronAPI.fs.writeFile(
        `${fullPath}/${projectForm.name}/index.ts`,
        generatedCode.index
      );

      setCreateLog((prev) => prev + 'Code files written successfully.\n');
      setCreateLog((prev) => prev + '\nProject created successfully!\n');

      // Success - open the project
      setExportSuccess(true);

      setTimeout(async () => {
        await openProject(fullPath);
        setOpen(false);
        setExportSuccess(false);
        navigate('/project');
      }, 1500);

    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Failed to create project');
      setCreateLog((prev) => prev + `\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    } finally {
      setIsCreating(false);
    }
  };

  const tabs: { value: TabValue; label: string; filename: string; code: string }[] = [
    {
      value: 'manifest',
      label: 'Manifest',
      filename: 'ControlManifest.Input.xml',
      code: generatedCode.manifest,
    },
    {
      value: 'component',
      label: 'Component',
      filename: `${constructorName}.tsx`,
      code: generatedCode.component,
    },
    {
      value: 'index',
      label: 'Index',
      filename: 'index.ts',
      code: generatedCode.index,
    },
  ];

  const currentTab = tabs.find((t) => t.value === selectedTab) ?? tabs[0];

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        {trigger ?? (
          <Button appearance="primary" icon={<Save24Regular />}>
            Generate Code
          </Button>
        )}
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Generated Code</DialogTitle>
          <DialogContent>
            <div className={styles.content}>
              {/* Mode Selector */}
              <div className={styles.modeSelector}>
                <Button
                  className={styles.modeButton}
                  appearance={mode === 'preview' ? 'primary' : 'outline'}
                  icon={<Code24Regular />}
                  onClick={() => setMode('preview')}
                >
                  Preview Code
                </Button>
                <Button
                  className={styles.modeButton}
                  appearance={mode === 'create' ? 'primary' : 'outline'}
                  icon={<Add24Regular />}
                  onClick={() => setMode('create')}
                >
                  Create PCF Project
                </Button>
              </div>

              <Divider />

              {mode === 'preview' ? (
                <>
                  <Text>
                    Review the generated code below. You can copy individual files or export all
                    files to an existing project folder.
                  </Text>

                  <TabList
                    selectedValue={selectedTab}
                    onTabSelect={(_, data) => setSelectedTab(data.value as TabValue)}
                    size="small"
                  >
                    {tabs.map((tab) => (
                      <Tab key={tab.value} value={tab.value}>
                        {tab.label}
                      </Tab>
                    ))}
                  </TabList>

                  <div className={styles.tabContent}>
                    <CodePreview
                      title={currentTab.label}
                      filename={currentTab.filename}
                      code={currentTab.code}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Text>
                    Create a new PCF project with the generated code. This will:
                  </Text>
                  <ul style={{ margin: `${tokens.spacingVerticalS} 0`, paddingLeft: tokens.spacingHorizontalL }}>
                    <li>Create a new PCF project using PAC CLI with React framework</li>
                    <li>Install Fluent UI dependencies</li>
                    <li>Write your designed component code</li>
                  </ul>

                  <div className={styles.form}>
                    <Field label="Component Name" required>
                      <Input
                        value={projectForm.name}
                        onChange={(_, data) =>
                          setProjectForm((prev) => ({ ...prev, name: data.value }))
                        }
                        placeholder="MyControl"
                      />
                    </Field>

                    <Field label="Namespace" required>
                      <Input
                        value={projectForm.namespace}
                        onChange={(_, data) =>
                          setProjectForm((prev) => ({ ...prev, namespace: data.value }))
                        }
                        placeholder="PCFControls"
                      />
                    </Field>

                    <Field label="Output Directory" required>
                      <div className={styles.folderRow}>
                        <Input
                          value={projectForm.outputDirectory}
                          onChange={(_, data) =>
                            setProjectForm((prev) => ({ ...prev, outputDirectory: data.value }))
                          }
                          placeholder="Select a folder..."
                          style={{ flex: 1 }}
                        />
                        <Button onClick={handleSelectFolder}>Browse</Button>
                      </div>
                    </Field>

                    {createLog && (
                      <div className={styles.outputLog}>{createLog}</div>
                    )}
                  </div>
                </>
              )}

              {exportError && (
                <MessageBar intent="error">
                  <MessageBarBody>{exportError}</MessageBarBody>
                </MessageBar>
              )}

              {exportSuccess && (
                <MessageBar intent="success" className={styles.successMessage}>
                  <MessageBarBody>
                    <Checkmark24Regular style={{ marginRight: tokens.spacingHorizontalS }} />
                    {mode === 'preview' ? 'Code exported successfully!' : 'Project created successfully!'}
                  </MessageBarBody>
                </MessageBar>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Close</Button>
            </DialogTrigger>
            {mode === 'preview' ? (
              <Button
                appearance="primary"
                icon={isExporting ? <Spinner size="tiny" /> : <FolderOpen24Regular />}
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? 'Exporting...' : 'Export to Folder'}
              </Button>
            ) : (
              <Button
                appearance="primary"
                icon={isCreating ? <Spinner size="tiny" /> : <Add24Regular />}
                onClick={handleCreateProject}
                disabled={isCreating || !projectForm.name || !projectForm.outputDirectory}
              >
                {isCreating ? 'Creating...' : 'Create Project'}
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
