import { useState } from 'react';
import {
  makeStyles,
  tokens,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Field,
  Text,
  Spinner,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { FolderOpen24Regular } from '@fluentui/react-icons';
import type { ControlTemplate, TemplateCreateOptions } from '../../../shared/types/template.types';

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  templateInfo: {
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalM,
  },
  pathInput: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  pathField: {
    flex: 1,
  },
  successMessage: {
    marginTop: tokens.spacingVerticalM,
  },
});

interface CreateFromTemplateDialogProps {
  template: ControlTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (projectPath: string) => void;
}

export default function CreateFromTemplateDialog({
  template,
  open,
  onOpenChange,
  onSuccess,
}: CreateFromTemplateDialogProps) {
  const styles = useStyles();
  const [controlName, setControlName] = useState('');
  const [namespace, setNamespace] = useState('');
  const [publisherPrefix, setPublisherPrefix] = useState('');
  const [projectPath, setProjectPath] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [createdPath, setCreatedPath] = useState<string | null>(null);

  const handleSelectFolder = async () => {
    const result = await window.electronAPI.project.selectFolder();
    if (result) {
      setProjectPath(result);
    }
  };

  const validateControlName = (name: string): string | null => {
    if (!name) return 'Control name is required';
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
      return 'Must be PascalCase (e.g., MyControl)';
    }
    return null;
  };

  const validateNamespace = (ns: string): string | null => {
    if (!ns) return 'Namespace is required';
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(ns)) {
      return 'Must be PascalCase (e.g., MyNamespace)';
    }
    return null;
  };

  const handleCreate = async () => {
    if (!template) return;

    const nameError = validateControlName(controlName);
    const nsError = validateNamespace(namespace);

    if (nameError || nsError || !projectPath) {
      setError('Please fill in all required fields correctly');
      return;
    }

    setIsCreating(true);
    setError(null);
    setWarning(null);

    try {
      const options: TemplateCreateOptions = {
        templateId: template.id,
        projectPath,
        controlName,
        namespace,
        publisherPrefix: publisherPrefix || undefined,
      };

      const result = await window.electronAPI.template.createFrom(options);

      if (result.success && result.projectPath) {
        setCreatedPath(result.projectPath);
        // Check if there was a warning (e.g., npm install failed)
        if (result.error) {
          setWarning(result.error);
        }
      } else {
        setError(result.error || 'Failed to create project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenProject = () => {
    if (createdPath) {
      onSuccess(createdPath);
      handleClose();
    }
  };

  const handleClose = () => {
    setControlName('');
    setNamespace('');
    setPublisherPrefix('');
    setProjectPath('');
    setError(null);
    setWarning(null);
    setCreatedPath(null);
    onOpenChange(false);
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={(_, data) => data.open || handleClose()}>
      <DialogSurface style={{ maxWidth: '500px' }}>
        <DialogBody>
          <DialogTitle>Create from Template</DialogTitle>
          <DialogContent>
            {createdPath ? (
              <div>
                <MessageBar intent="success" className={styles.successMessage}>
                  <MessageBarBody>
                    Project created successfully at:
                    <br />
                    <Text weight="semibold">{createdPath}</Text>
                  </MessageBarBody>
                </MessageBar>
                {warning ? (
                  <MessageBar intent="warning" style={{ marginTop: tokens.spacingVerticalS }}>
                    <MessageBarBody>{warning}</MessageBarBody>
                  </MessageBar>
                ) : (
                  <Text
                    size={300}
                    block
                    style={{
                      marginTop: tokens.spacingVerticalM,
                      color: tokens.colorNeutralForeground3,
                    }}
                  >
                    Dependencies installed. Your project is ready to build!
                  </Text>
                )}
              </div>
            ) : (
              <>
                <div className={styles.templateInfo}>
                  <Text weight="semibold" block>
                    Template: {template.name}
                  </Text>
                  <Text
                    size={200}
                    style={{ color: tokens.colorNeutralForeground3 }}
                  >
                    {template.description}
                  </Text>
                </div>

                {error && (
                  <MessageBar intent="error" style={{ marginBottom: tokens.spacingVerticalM }}>
                    <MessageBarBody>{error}</MessageBarBody>
                  </MessageBar>
                )}

                <div className={styles.form}>
                  <Field
                    label="Control Name"
                    required
                    hint="PascalCase (e.g., MyRatingControl)"
                    validationState={
                      controlName && validateControlName(controlName)
                        ? 'error'
                        : undefined
                    }
                    validationMessage={
                      controlName ? validateControlName(controlName) : undefined
                    }
                  >
                    <Input
                      value={controlName}
                      onChange={(_, data) => setControlName(data.value)}
                      placeholder="MyControl"
                      disabled={isCreating}
                    />
                  </Field>

                  <Field
                    label="Namespace"
                    required
                    hint="PascalCase (e.g., MyCompany)"
                    validationState={
                      namespace && validateNamespace(namespace) ? 'error' : undefined
                    }
                    validationMessage={
                      namespace ? validateNamespace(namespace) : undefined
                    }
                  >
                    <Input
                      value={namespace}
                      onChange={(_, data) => setNamespace(data.value)}
                      placeholder="MyNamespace"
                      disabled={isCreating}
                    />
                  </Field>

                  <Field
                    label="Publisher Prefix"
                    hint="Optional (e.g., contoso)"
                  >
                    <Input
                      value={publisherPrefix}
                      onChange={(_, data) => setPublisherPrefix(data.value)}
                      placeholder="sample"
                      disabled={isCreating}
                    />
                  </Field>

                  <Field label="Project Location" required>
                    <div className={styles.pathInput}>
                      <Input
                        className={styles.pathField}
                        value={projectPath}
                        onChange={(_, data) => setProjectPath(data.value)}
                        placeholder="Select a folder..."
                        disabled={isCreating}
                      />
                      <Button
                        icon={<FolderOpen24Regular />}
                        onClick={handleSelectFolder}
                        disabled={isCreating}
                      >
                        Browse
                      </Button>
                    </div>
                  </Field>
                </div>
              </>
            )}
          </DialogContent>
          <DialogActions>
            {createdPath ? (
              <>
                <Button appearance="secondary" onClick={handleClose}>
                  Close
                </Button>
                <Button appearance="primary" onClick={handleOpenProject}>
                  Open Project
                </Button>
              </>
            ) : (
              <>
                <Button appearance="secondary" onClick={handleClose} disabled={isCreating}>
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleCreate}
                  disabled={isCreating || !controlName || !namespace || !projectPath}
                  icon={isCreating ? <Spinner size="tiny" /> : undefined}
                >
                  {isCreating ? 'Creating & Installing...' : 'Create Project'}
                </Button>
              </>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
