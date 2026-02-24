import { useState } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Spinner,
  Text,
  MessageBar,
  MessageBarBody,
  Card,
  CardHeader,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Badge,
  Input,
} from '@fluentui/react-components';
import { ArrowSwap24Regular, Folder24Regular, Save24Regular } from '@fluentui/react-icons';
import { useToolsStore } from '../../stores/tools.store';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  filePickers: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
  },
  filePickerGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  fileInput: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  metadataGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: tokens.spacingHorizontalS,
  },
  diffContainer: {
    maxHeight: '400px',
    overflow: 'auto',
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  diffLine: {
    whiteSpace: 'pre',
    lineHeight: '1.6',
  },
  diffAdded: {
    backgroundColor: '#e6ffed',
    color: '#22863a',
  },
  diffRemoved: {
    backgroundColor: '#ffeef0',
    color: '#cb2431',
  },
  diffContext: {
    color: tokens.colorNeutralForeground3,
  },
});

export default function DiffTab() {
  const styles = useStyles();
  const [zipPathA, setZipPathA] = useState('');
  const [zipPathB, setZipPathB] = useState('');

  const {
    diffLoading,
    diffResult,
    diffError,
    diffSolutions,
    selectZip,
    getDiffReport,
  } = useToolsStore();

  const handleSelectA = async () => {
    const path = await selectZip();
    if (path) setZipPathA(path);
  };

  const handleSelectB = async () => {
    const path = await selectZip();
    if (path) setZipPathB(path);
  };

  const handleCompare = async () => {
    if (!zipPathA || !zipPathB) return;
    await diffSolutions(zipPathA, zipPathB);
  };

  const handleExportReport = async () => {
    const report = await getDiffReport();
    if (!report) return;

    const savePath = await window.electronAPI.fs.saveDialog({
      title: 'Save Diff Report',
      defaultPath: 'solution-diff-report.md',
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    });
    if (savePath) {
      await window.electronAPI.fs.writeFile(savePath, report);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'added': return 'success';
      case 'removed': return 'danger';
      case 'modified': return 'warning';
      default: return 'informative';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.filePickers}>
        <div className={styles.filePickerGroup}>
          <Text weight="semibold" size={200}>File A (Base)</Text>
          <div className={styles.fileInput}>
            <Input
              value={zipPathA}
              readOnly
              placeholder="Select a solution zip..."
              style={{ flex: 1 }}
            />
            <Button
              appearance="subtle"
              icon={<Folder24Regular />}
              onClick={handleSelectA}
            />
          </div>
        </div>
        <div className={styles.filePickerGroup}>
          <Text weight="semibold" size={200}>File B (Compare)</Text>
          <div className={styles.fileInput}>
            <Input
              value={zipPathB}
              readOnly
              placeholder="Select a solution zip..."
              style={{ flex: 1 }}
            />
            <Button
              appearance="subtle"
              icon={<Folder24Regular />}
              onClick={handleSelectB}
            />
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          appearance="primary"
          icon={<ArrowSwap24Regular />}
          onClick={handleCompare}
          disabled={diffLoading || !zipPathA || !zipPathB}
        >
          {diffLoading ? 'Comparing...' : 'Compare'}
        </Button>
        {diffLoading && <Spinner size="tiny" />}
        {diffResult && (
          <Button
            appearance="subtle"
            icon={<Save24Regular />}
            onClick={handleExportReport}
            size="small"
          >
            Export Report
          </Button>
        )}
      </div>

      {diffError && (
        <MessageBar intent="error">
          <MessageBarBody>{diffError}</MessageBarBody>
        </MessageBar>
      )}

      {diffResult && (
        <>
          <Card>
            <CardHeader header={<Text weight="semibold">Metadata Comparison</Text>} />
            <Table size="small">
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Property</TableHeaderCell>
                  <TableHeaderCell>File A</TableHeaderCell>
                  <TableHeaderCell>File B</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell><Text weight="semibold">Unique Name</Text></TableCell>
                  <TableCell>{diffResult.uniqueNameA}</TableCell>
                  <TableCell>{diffResult.uniqueNameB}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><Text weight="semibold">Version</Text></TableCell>
                  <TableCell>{diffResult.versionA}</TableCell>
                  <TableCell>
                    {diffResult.versionB}
                    {diffResult.versionA !== diffResult.versionB && (
                      <Badge appearance="filled" color="warning" size="small" style={{ marginLeft: 8 }}>
                        changed
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><Text weight="semibold">Publisher</Text></TableCell>
                  <TableCell>{diffResult.publisherA}</TableCell>
                  <TableCell>{diffResult.publisherB}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>

          {diffResult.componentDiffs.length > 0 && (
            <Card>
              <CardHeader header={<Text weight="semibold">Component Differences</Text>} />
              <Table size="small">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Component</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diffResult.componentDiffs
                    .filter(c => c.status !== 'unchanged')
                    .map((comp, i) => (
                      <TableRow key={i}>
                        <TableCell>{comp.name}</TableCell>
                        <TableCell>{comp.type}</TableCell>
                        <TableCell>
                          <Badge
                            appearance="filled"
                            color={statusColor(comp.status)}
                            size="small"
                          >
                            {comp.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {diffResult.xmlDiffLines.some(l => l.type !== 'context') && (
            <Card>
              <CardHeader header={<Text weight="semibold">XML Diff</Text>} />
              <div className={styles.diffContainer}>
                {diffResult.xmlDiffLines.map((line, i) => (
                  <div
                    key={i}
                    className={`${styles.diffLine} ${
                      line.type === 'added'
                        ? styles.diffAdded
                        : line.type === 'removed'
                        ? styles.diffRemoved
                        : styles.diffContext
                    }`}
                  >
                    {line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  '}
                    {line.content}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <MessageBar intent="info">
            <MessageBarBody>{diffResult.summary}</MessageBarBody>
          </MessageBar>
        </>
      )}
    </div>
  );
}
