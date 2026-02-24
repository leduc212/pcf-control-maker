import { useState } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Checkbox,
  Spinner,
  Text,
  MessageBar,
  MessageBarBody,
  Textarea,
  Card,
  CardHeader,
} from '@fluentui/react-components';
import { DocumentText24Regular, Copy24Regular, Save24Regular } from '@fluentui/react-icons';
import { useToolsStore } from '../../stores/tools.store';
import { useProjectStore } from '../../stores/project.store';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  options: {
    display: 'flex',
    gap: tokens.spacingHorizontalL,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  preview: {
    minHeight: '300px',
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
  },
  copyActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'flex-end',
  },
});

export default function DocsTab() {
  const styles = useStyles();
  const [includeChangelog, setIncludeChangelog] = useState(false);
  const [includeUsageExamples, setIncludeUsageExamples] = useState(true);
  const [copied, setCopied] = useState(false);

  const { currentProject } = useProjectStore();
  const { docsLoading, docsResult, docsError, generateDocs } = useToolsStore();

  const handleGenerate = async () => {
    if (!currentProject?.path || !currentProject.manifestPath) return;
    await generateDocs(
      currentProject.path,
      currentProject.manifestPath,
      includeChangelog,
      includeUsageExamples
    );
  };

  const handleCopy = async () => {
    if (!docsResult?.readme) return;
    await navigator.clipboard.writeText(docsResult.readme);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!docsResult?.readme || !currentProject?.path) return;
    const savePath = await window.electronAPI.fs.saveDialog({
      title: 'Save README',
      defaultPath: `${currentProject.path}/README.md`,
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    });
    if (savePath) {
      await window.electronAPI.fs.writeFile(savePath, docsResult.readme);
    }
  };

  if (!currentProject) {
    return (
      <MessageBar intent="warning">
        <MessageBarBody>Open a project to generate documentation.</MessageBarBody>
      </MessageBar>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.options}>
        <Checkbox
          label="Include changelog (from git history)"
          checked={includeChangelog}
          onChange={(_, data) => setIncludeChangelog(data.checked === true)}
        />
        <Checkbox
          label="Include usage examples"
          checked={includeUsageExamples}
          onChange={(_, data) => setIncludeUsageExamples(data.checked === true)}
        />
      </div>

      <div className={styles.actions}>
        <Button
          appearance="primary"
          icon={<DocumentText24Regular />}
          onClick={handleGenerate}
          disabled={docsLoading || !currentProject.manifestPath}
        >
          {docsLoading ? 'Generating...' : 'Generate README'}
        </Button>
        {docsLoading && <Spinner size="tiny" />}
      </div>

      {docsError && (
        <MessageBar intent="error">
          <MessageBarBody>{docsError}</MessageBarBody>
        </MessageBar>
      )}

      {docsResult && (
        <Card>
          <CardHeader
            header={<Text weight="semibold">Generated README</Text>}
            action={
              <div className={styles.copyActions}>
                <Button
                  appearance="subtle"
                  icon={<Copy24Regular />}
                  onClick={handleCopy}
                  size="small"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  appearance="subtle"
                  icon={<Save24Regular />}
                  onClick={handleSave}
                  size="small"
                >
                  Save
                </Button>
              </div>
            }
          />
          <Textarea
            className={styles.preview}
            value={docsResult.readme}
            readOnly
            resize="vertical"
            style={{ width: '100%' }}
          />
        </Card>
      )}
    </div>
  );
}
