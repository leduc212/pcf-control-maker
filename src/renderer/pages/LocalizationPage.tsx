import { useEffect, useState } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Spinner,
  MessageBar,
  MessageBarBody,
  Badge,
  Tooltip,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Input,
  Field,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Globe24Regular,
  ArrowDownload24Regular,
  ArrowUpload24Regular,
  FolderOpen24Regular,
  Warning24Regular,
} from '@fluentui/react-icons';
import { PageHeader } from '../components/common';
import {
  LocalizationGrid,
  AddEntryDialog,
  AddLanguageDialog,
} from '../components/localization';
import type {
  LocalizationProject,
  LocalizationEntry,
} from '../../shared/types/localization.types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
    flexWrap: 'wrap',
  },
  toolbarGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  spacer: {
    flex: 1,
  },
  stats: {
    display: 'flex',
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalM,
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingHorizontalM,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL,
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground3,
  },
});

export default function LocalizationPage() {
  const styles = useStyles();

  const [project, setProject] = useState<LocalizationProject | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingTranslations, setMissingTranslations] = useState<
    { key: string; missingLanguages: string[] }[]
  >([]);

  // Dialog states
  const [addEntryDialogOpen, setAddEntryDialogOpen] = useState(false);
  const [addLanguageDialogOpen, setAddLanguageDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LocalizationEntry | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const loadProject = async (path: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.localization.loadProject(path);
      if (result) {
        setProject(result);
        setProjectPath(path);
        // Load missing translations
        const missing = await window.electronAPI.localization.getMissing(result.basePath);
        setMissingTranslations(missing);
      } else {
        setError('Failed to load localization files');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFolder = async () => {
    const result = await window.electronAPI.project.selectFolder();
    if (result) {
      await loadProject(result);
    }
  };

  const handleAddEntry = async (entry: LocalizationEntry) => {
    if (!project) return;

    try {
      if (editingEntry) {
        await window.electronAPI.localization.updateEntry(
          project.basePath,
          entry.key,
          entry.values,
          entry.comment
        );
      } else {
        await window.electronAPI.localization.addEntry(project.basePath, entry);
      }
      // Reload project
      await loadProject(projectPath!);
      setEditingEntry(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry');
    }
  };

  const handleUpdateEntry = async (
    key: string,
    values: Record<string, string>,
    comment?: string
  ) => {
    if (!project) return;

    try {
      await window.electronAPI.localization.updateEntry(
        project.basePath,
        key,
        values,
        comment
      );
      // Reload project
      await loadProject(projectPath!);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update entry');
    }
  };

  const handleDeleteEntry = async (key: string) => {
    if (!project) return;

    try {
      await window.electronAPI.localization.deleteEntry(project.basePath, key);
      // Reload project
      await loadProject(projectPath!);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
    }
  };

  const handleAddLanguage = async (languageCode: string, copyFromLanguage?: string) => {
    if (!project) return;

    try {
      await window.electronAPI.localization.addLanguage(
        project.basePath,
        languageCode,
        copyFromLanguage
      );
      // Reload project
      await loadProject(projectPath!);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add language');
    }
  };

  const handleExportCsv = async () => {
    if (!project) return;

    const result = await window.electronAPI.fs.saveDialog({
      title: 'Export Translations',
      defaultPath: 'translations.csv',
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
    });

    if (result) {
      try {
        await window.electronAPI.localization.exportCsv(project.basePath, result, {
          format: 'csv',
          includeComments: true,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to export');
      }
    }
  };

  const handleEditEntry = (entry: LocalizationEntry) => {
    setEditingEntry(entry);
    setAddEntryDialogOpen(true);
  };

  const totalMissing = missingTranslations.reduce(
    (sum, m) => sum + m.missingLanguages.length,
    0
  );

  if (!project && !isLoading) {
    return (
      <div className={styles.container}>
        <PageHeader
          title="Localization Helper"
          subtitle="Manage translations for your PCF control"
        />
        <div className={styles.emptyState}>
          <Globe24Regular className={styles.emptyIcon} />
          <Text size={500} weight="semibold" block>
            No Project Loaded
          </Text>
          <Text
            size={300}
            style={{ color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalL }}
          >
            Select a PCF control folder to manage its localization files
          </Text>
          <Button appearance="primary" icon={<FolderOpen24Regular />} onClick={handleSelectFolder}>
            Select PCF Project
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Localization Helper"
        subtitle={projectPath ? `Project: ${projectPath}` : 'Manage translations for your PCF control'}
        actions={
          <Button appearance="subtle" icon={<FolderOpen24Regular />} onClick={handleSelectFolder}>
            Change Project
          </Button>
        }
      />

      {error && (
        <MessageBar intent="error" style={{ marginBottom: tokens.spacingVerticalM }}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM, padding: tokens.spacingVerticalXXL, justifyContent: 'center' }}>
          <Spinner size="medium" />
          <Text>Loading localization files...</Text>
        </div>
      ) : project ? (
        <>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <Badge appearance="tint" color="brand">
                {project.entries.length} entries
              </Badge>
            </div>
            <div className={styles.statItem}>
              <Badge appearance="tint" color="informative">
                {project.languages.length} languages
              </Badge>
            </div>
            {totalMissing > 0 && (
              <div className={styles.statItem}>
                <Tooltip content="Missing translations" relationship="label">
                  <Badge appearance="tint" color="warning" icon={<Warning24Regular />}>
                    {totalMissing} missing
                  </Badge>
                </Tooltip>
              </div>
            )}
          </div>

          <div className={styles.toolbar}>
            <div className={styles.toolbarGroup}>
              <Button
                appearance="primary"
                icon={<Add24Regular />}
                onClick={() => {
                  setEditingEntry(null);
                  setAddEntryDialogOpen(true);
                }}
              >
                Add Entry
              </Button>
              <Button icon={<Globe24Regular />} onClick={() => setAddLanguageDialogOpen(true)}>
                Add Language
              </Button>
            </div>
            <div className={styles.spacer} />
            <div className={styles.toolbarGroup}>
              <Tooltip content="Export to CSV" relationship="label">
                <Button icon={<ArrowDownload24Regular />} onClick={handleExportCsv}>
                  Export
                </Button>
              </Tooltip>
            </div>
          </div>

          <div className={styles.content}>
            {project.entries.length === 0 ? (
              <div className={styles.emptyState}>
                <Text size={400} weight="medium">
                  No translation entries yet
                </Text>
                <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                  Add your first entry to get started
                </Text>
              </div>
            ) : (
              <LocalizationGrid
                entries={project.entries}
                languages={project.languages}
                onUpdateEntry={handleUpdateEntry}
                onDeleteEntry={handleDeleteEntry}
                onEditEntry={handleEditEntry}
                missingTranslations={missingTranslations}
              />
            )}
          </div>
        </>
      ) : null}

      <AddEntryDialog
        open={addEntryDialogOpen}
        onOpenChange={(open) => {
          setAddEntryDialogOpen(open);
          if (!open) setEditingEntry(null);
        }}
        onSave={handleAddEntry}
        editEntry={editingEntry}
        languages={project?.languages || []}
      />

      <AddLanguageDialog
        open={addLanguageDialogOpen}
        onOpenChange={setAddLanguageDialogOpen}
        onAdd={handleAddLanguage}
        existingLanguages={project?.languages || []}
      />
    </div>
  );
}
