import { useEffect, useState } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  Text,
  Input,
  Select,
  Field,
  Button,
  Spinner,
  Switch,
  Divider,
  MessageBar,
  MessageBarBody,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogTrigger,
} from '@fluentui/react-components';
import {
  Save24Regular,
  ArrowReset24Regular,
  Warning24Regular,
} from '@fluentui/react-icons';
import { PageHeader } from '../components/common';
import { useSettingsStore } from '../stores/settings.store';
import type { AppSettings } from '../../shared/types/settings.types';

const useStyles = makeStyles({
  container: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  section: {
    marginBottom: tokens.spacingVerticalXXL,
  },
  sectionTitle: {
    marginBottom: tokens.spacingVerticalM,
  },
  card: {
    padding: tokens.spacingHorizontalL,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalL,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL,
  },
  hint: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    marginTop: tokens.spacingVerticalXS,
  },
});

export default function SettingsPage() {
  const styles = useStyles();
  const { settings, isLoading, isSaving, loadSettings, saveSettings, resetSettings } = useSettingsStore();
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [showSaved, setShowSaved] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate namespace
    if (!formData.defaultNamespace) {
      errors.defaultNamespace = 'Namespace is required';
    } else if (!/^[A-Za-z][A-Za-z0-9_.]*$/.test(formData.defaultNamespace)) {
      errors.defaultNamespace = 'Invalid namespace format (use letters, numbers, dots, underscores)';
    }

    // Validate publisher prefix
    if (!formData.defaultPublisherPrefix) {
      errors.defaultPublisherPrefix = 'Publisher prefix is required';
    } else if (!/^[a-z]{2,8}$/.test(formData.defaultPublisherPrefix)) {
      errors.defaultPublisherPrefix = 'Must be 2-8 lowercase letters';
    }

    // Validate publisher name
    if (!formData.defaultPublisherName) {
      errors.defaultPublisherName = 'Publisher name is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const success = await saveSettings(formData);
    if (success) {
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    }
  };

  const handleResetConfirm = async () => {
    await resetSettings();
    setValidationErrors({});
    setIsResetDialogOpen(false);
  };

  const updateField = <K extends keyof AppSettings>(field: K, value: AppSettings[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when field is updated
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <PageHeader title="Settings" subtitle="Configure application defaults" />
        <Spinner label="Loading settings..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Settings"
        subtitle="Configure application defaults and preferences"
      />

      {showSaved && (
        <MessageBar intent="success" style={{ marginBottom: tokens.spacingVerticalL }}>
          <MessageBarBody>Settings saved successfully!</MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.section}>
        <Text size={500} weight="semibold" className={styles.sectionTitle} block>
          PCF Project Defaults
        </Text>
        <Card className={styles.card}>
          <div className={styles.form}>
            <Field
              label="Default Namespace"
              validationMessage={validationErrors.defaultNamespace}
              validationState={validationErrors.defaultNamespace ? 'error' : undefined}
              hint="Used as the default namespace when creating new PCF components"
            >
              <Input
                value={formData.defaultNamespace}
                onChange={(_, data) => updateField('defaultNamespace', data.value)}
                placeholder="e.g., Contoso.Controls"
              />
            </Field>

            <div className={styles.row}>
              <Field
                label="Default Template"
                hint="Component template type"
              >
                <Select
                  value={formData.defaultTemplate}
                  onChange={(_, data) => updateField('defaultTemplate', data.value as 'field' | 'dataset')}
                >
                  <option value="field">Field</option>
                  <option value="dataset">Dataset</option>
                </Select>
              </Field>

              <Field
                label="Default Framework"
                hint="JavaScript framework for new components"
              >
                <Select
                  value={formData.defaultFramework}
                  onChange={(_, data) => updateField('defaultFramework', data.value as 'none' | 'react')}
                >
                  <option value="react">React</option>
                  <option value="none">None (Standard)</option>
                </Select>
              </Field>
            </div>
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <Text size={500} weight="semibold" className={styles.sectionTitle} block>
          Solution Publishing Defaults
        </Text>
        <Card className={styles.card}>
          <div className={styles.form}>
            <Field
              label="Default Publisher Name"
              validationMessage={validationErrors.defaultPublisherName}
              validationState={validationErrors.defaultPublisherName ? 'error' : undefined}
              hint="Your organization or developer name"
            >
              <Input
                value={formData.defaultPublisherName}
                onChange={(_, data) => updateField('defaultPublisherName', data.value)}
                placeholder="e.g., Contoso"
              />
            </Field>

            <Field
              label="Default Publisher Prefix"
              validationMessage={validationErrors.defaultPublisherPrefix}
              validationState={validationErrors.defaultPublisherPrefix ? 'error' : undefined}
              hint="2-8 lowercase letters, used as prefix for solution components"
            >
              <Input
                value={formData.defaultPublisherPrefix}
                onChange={(_, data) => updateField('defaultPublisherPrefix', data.value.toLowerCase())}
                placeholder="e.g., contoso"
                maxLength={8}
              />
            </Field>
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <Text size={500} weight="semibold" className={styles.sectionTitle} block>
          Editor Preferences
        </Text>
        <Card className={styles.card}>
          <div className={styles.form}>
            <Field
              label="Code Editor Command"
              hint="Command to open folders in your code editor (e.g., 'code' for VS Code, 'cursor' for Cursor)"
            >
              <Input
                value={formData.defaultEditor}
                onChange={(_, data) => updateField('defaultEditor', data.value)}
                placeholder="code"
              />
            </Field>

            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
              <Switch
                checked={formData.showCommandPreview}
                onChange={(_, data) => updateField('showCommandPreview', data.checked)}
              />
              <Text>Show command preview before execution</Text>
            </div>
            <Text className={styles.hint}>
              When enabled, shows the PAC CLI command that will be executed
            </Text>
          </div>
        </Card>
      </div>

      <Divider />

      <div className={styles.actions}>
        <Button
          appearance="primary"
          icon={<Save24Regular />}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
        <Button
          appearance="secondary"
          icon={<ArrowReset24Regular />}
          onClick={() => setIsResetDialogOpen(true)}
          disabled={isSaving}
        >
          Reset to Defaults
        </Button>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={(_, data) => setIsResetDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                <Warning24Regular style={{ color: tokens.colorPaletteYellowForeground1 }} />
                Reset Settings
              </div>
            </DialogTitle>
            <DialogContent>
              <Text>Are you sure you want to reset all settings to their default values? This cannot be undone.</Text>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button appearance="primary" onClick={handleResetConfirm}>
                Reset
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
