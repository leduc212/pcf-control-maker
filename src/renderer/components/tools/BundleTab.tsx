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
} from '@fluentui/react-components';
import { Search24Regular, Save24Regular } from '@fluentui/react-icons';
import { useToolsStore } from '../../stores/tools.store';
import { useProjectStore } from '../../stores/project.store';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  statCard: {
    padding: tokens.spacingVerticalM,
    textAlign: 'center',
  },
  statValue: {
    display: 'block',
    marginBottom: tokens.spacingVerticalXS,
  },
  historyEntry: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

export default function BundleTab() {
  const styles = useStyles();
  const { currentProject } = useProjectStore();
  const {
    bundleLoading,
    bundleResult,
    bundleHistory,
    bundleError,
    analyzeBundle,
    loadBundleHistory,
    recordBundleSize,
  } = useToolsStore();

  const handleAnalyze = async () => {
    if (!currentProject?.path) return;
    await analyzeBundle(currentProject.path);
    await loadBundleHistory(currentProject.path);
  };

  const handleRecord = async () => {
    if (!currentProject?.path) return;
    await recordBundleSize(currentProject.path);
  };

  if (!currentProject) {
    return (
      <MessageBar intent="warning">
        <MessageBarBody>Open a project to analyze the bundle.</MessageBarBody>
      </MessageBar>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.actions}>
        <Button
          appearance="primary"
          icon={<Search24Regular />}
          onClick={handleAnalyze}
          disabled={bundleLoading}
        >
          {bundleLoading ? 'Analyzing...' : 'Analyze Bundle'}
        </Button>
        {bundleLoading && <Spinner size="tiny" />}
        {bundleResult && bundleResult.bundleSizeBytes > 0 && (
          <Button
            appearance="subtle"
            icon={<Save24Regular />}
            onClick={handleRecord}
            size="small"
          >
            Record Size
          </Button>
        )}
      </div>

      {bundleError && (
        <MessageBar intent="error">
          <MessageBarBody>{bundleError}</MessageBarBody>
        </MessageBar>
      )}

      {bundleResult && (
        <>
          <div className={styles.statsGrid}>
            <Card className={styles.statCard}>
              <Text className={styles.statValue} size={800} weight="semibold">
                {bundleResult.bundleSizeFormatted}
              </Text>
              <Text size={200}>Bundle Size</Text>
            </Card>
            <Card className={styles.statCard}>
              <Text className={styles.statValue} size={800} weight="semibold">
                {bundleResult.dependencyCount}
              </Text>
              <Text size={200}>Dependencies</Text>
            </Card>
          </div>

          {bundleResult.recommendations.length > 0 && (
            <div>
              {bundleResult.recommendations.map((rec, i) => (
                <MessageBar
                  key={i}
                  intent={rec.includes('exceeds') ? 'warning' : 'info'}
                  style={{ marginBottom: tokens.spacingVerticalXS }}
                >
                  <MessageBarBody>{rec}</MessageBarBody>
                </MessageBar>
              ))}
            </div>
          )}

          {bundleResult.dependencies.length > 0 && (
            <Card>
              <CardHeader header={<Text weight="semibold">Dependencies</Text>} />
              <Table size="small">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Version</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bundleResult.dependencies.map((dep) => (
                    <TableRow key={dep.name}>
                      <TableCell>{dep.name}</TableCell>
                      <TableCell>{dep.version}</TableCell>
                      <TableCell>
                        <Badge
                          appearance="outline"
                          color={dep.isDev ? 'informative' : 'success'}
                          size="small"
                        >
                          {dep.isDev ? 'dev' : 'prod'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}

      {bundleHistory && bundleHistory.entries.length > 0 && (
        <Card>
          <CardHeader header={<Text weight="semibold">Size History</Text>} />
          <Table size="small">
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Size</TableHeaderCell>
                <TableHeaderCell>Dependencies</TableHeaderCell>
                <TableHeaderCell>Label</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundleHistory.entries.map((entry, i) => (
                <TableRow key={i}>
                  <TableCell className={styles.historyEntry}>
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{formatBytes(entry.sizeBytes)}</TableCell>
                  <TableCell>{entry.dependencyCount}</TableCell>
                  <TableCell className={styles.historyEntry}>
                    {entry.label || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}
