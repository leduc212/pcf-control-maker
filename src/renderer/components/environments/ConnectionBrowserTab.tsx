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
  Link,
} from '@fluentui/react-components';
import { ArrowSync24Regular, Open24Regular } from '@fluentui/react-icons';
import type { DeployedSolution } from '../../../shared/types/connection.types';

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
  versionMatch: {
    color: tokens.colorPaletteGreenForeground1,
  },
  versionMismatch: {
    color: tokens.colorPaletteRedForeground1,
  },
});

interface ConnectionBrowserTabProps {
  localVersion?: string;
  solutionName?: string;
}

export default function ConnectionBrowserTab({ localVersion, solutionName }: ConnectionBrowserTabProps) {
  const styles = useStyles();
  const [isLoading, setIsLoading] = useState(false);
  const [solutions, setSolutions] = useState<DeployedSolution[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const handleFetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.environment.listSolutions();
      setSolutions(result);
      setFetched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch solutions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPowerApps = () => {
    window.electronAPI.fs.openExternal('https://make.powerapps.com');
  };

  const getVersionIndicator = (deployedVersion: string) => {
    if (!localVersion || !solutionName) return null;
    const isMatch = deployedVersion === localVersion;
    return (
      <Text size={200} className={isMatch ? styles.versionMatch : styles.versionMismatch}>
        {isMatch ? ' (matches local)' : ` (local: ${localVersion})`}
      </Text>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.actions}>
        <Button
          appearance="primary"
          icon={<ArrowSync24Regular />}
          onClick={handleFetch}
          disabled={isLoading}
        >
          {isLoading ? 'Fetching...' : 'Fetch Solutions'}
        </Button>
        {isLoading && <Spinner size="tiny" />}
        <Button
          appearance="subtle"
          icon={<Open24Regular />}
          onClick={handleOpenPowerApps}
        >
          Open in Power Apps
        </Button>
      </div>

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      {fetched && solutions.length === 0 && !error && (
        <MessageBar intent="info">
          <MessageBarBody>No solutions found. Make sure you are authenticated to an environment.</MessageBarBody>
        </MessageBar>
      )}

      {solutions.length > 0 && (
        <Card>
          <CardHeader
            header={<Text weight="semibold">Deployed Solutions ({solutions.length})</Text>}
          />
          <Table size="small">
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Version</TableHeaderCell>
                <TableHeaderCell>Publisher</TableHeaderCell>
                <TableHeaderCell>Managed</TableHeaderCell>
                <TableHeaderCell>Installed On</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solutions.map((sol) => (
                <TableRow key={sol.uniqueName}>
                  <TableCell>
                    <div>
                      <Text weight="semibold">{sol.friendlyName || sol.uniqueName}</Text>
                      {sol.friendlyName && (
                        <Text size={200} style={{ display: 'block', color: tokens.colorNeutralForeground3 }}>
                          {sol.uniqueName}
                        </Text>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {sol.version}
                    {solutionName && sol.uniqueName === solutionName && getVersionIndicator(sol.version)}
                  </TableCell>
                  <TableCell>{sol.publisher}</TableCell>
                  <TableCell>
                    <Badge
                      appearance="outline"
                      color={sol.isManaged ? 'informative' : 'warning'}
                      size="small"
                    >
                      {sol.isManaged ? 'Managed' : 'Unmanaged'}
                    </Badge>
                  </TableCell>
                  <TableCell>{sol.installedOn || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
