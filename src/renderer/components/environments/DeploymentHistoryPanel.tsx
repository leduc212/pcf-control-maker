import {
  makeStyles,
  tokens,
  Card,
  Text,
  Button,
  Badge,
  Tooltip,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from '@fluentui/react-components';
import {
  History24Regular,
  CloudArrowUp24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
  Clock24Regular,
  MoreVertical24Regular,
  Delete24Regular,
  ArrowRepeatAll24Regular,
} from '@fluentui/react-icons';
import type { DeploymentRecord } from '../../../shared/types/environment.types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  historyItem: {
    padding: tokens.spacingHorizontalM,
  },
  historyHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  historyInfo: {
    flex: 1,
    minWidth: 0,
  },
  statusIcon: {
    fontSize: '20px',
  },
  success: {
    color: tokens.colorPaletteGreenForeground1,
  },
  failed: {
    color: tokens.colorPaletteRedForeground1,
  },
  pending: {
    color: tokens.colorPaletteYellowForeground1,
  },
  timestamp: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  emptyState: {
    padding: tokens.spacingVerticalXXL,
    textAlign: 'center',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
  errorMessage: {
    marginTop: tokens.spacingVerticalXS,
    padding: tokens.spacingHorizontalS,
    backgroundColor: tokens.colorPaletteRedBackground1,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorPaletteRedForeground1,
  },
});

interface DeploymentHistoryPanelProps {
  deployments: DeploymentRecord[];
  onRedeploy: (deployment: DeploymentRecord) => void;
  onClearHistory: () => void;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function formatDuration(startedAt: number, completedAt?: number): string {
  if (!completedAt) return 'In progress...';
  const durationMs = completedAt - startedAt;
  const seconds = Math.floor(durationMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export default function DeploymentHistoryPanel({
  deployments,
  onRedeploy,
  onClearHistory,
}: DeploymentHistoryPanelProps) {
  const styles = useStyles();

  const getStatusIcon = (status: DeploymentRecord['status']) => {
    switch (status) {
      case 'success':
        return <Checkmark24Regular className={`${styles.statusIcon} ${styles.success}`} />;
      case 'failed':
        return <Dismiss24Regular className={`${styles.statusIcon} ${styles.failed}`} />;
      case 'in_progress':
        return <Clock24Regular className={`${styles.statusIcon} ${styles.pending}`} />;
      default:
        return <CloudArrowUp24Regular className={styles.statusIcon} />;
    }
  };

  const getStatusBadge = (status: DeploymentRecord['status']) => {
    switch (status) {
      case 'success':
        return <Badge appearance="filled" color="success">Success</Badge>;
      case 'failed':
        return <Badge appearance="filled" color="danger">Failed</Badge>;
      case 'in_progress':
        return <Badge appearance="filled" color="warning">In Progress</Badge>;
      default:
        return <Badge appearance="outline">Unknown</Badge>;
    }
  };

  // Sort deployments by most recent first
  const sortedDeployments = [...deployments].sort((a, b) => b.startedAt - a.startedAt);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={500} weight="semibold">
          Deployment History ({deployments.length})
        </Text>
        {deployments.length > 0 && (
          <Button
            appearance="subtle"
            size="small"
            icon={<Delete24Regular />}
            onClick={onClearHistory}
          >
            Clear History
          </Button>
        )}
      </div>

      {deployments.length === 0 ? (
        <div className={styles.emptyState}>
          <History24Regular
            style={{
              fontSize: '48px',
              color: tokens.colorNeutralForeground3,
              marginBottom: tokens.spacingVerticalM,
            }}
          />
          <Text size={400} weight="medium" block style={{ marginBottom: tokens.spacingVerticalS }}>
            No deployment history
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
            Deployments will appear here after you deploy a solution
          </Text>
        </div>
      ) : (
        <div className={styles.historyList}>
          {sortedDeployments.map((deployment) => (
            <Card key={deployment.id} className={styles.historyItem}>
              <div className={styles.historyHeader}>
                {getStatusIcon(deployment.status)}
                <div className={styles.historyInfo}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                    <Text weight="semibold">{deployment.solutionName}</Text>
                    {getStatusBadge(deployment.status)}
                  </div>
                  <Text
                    size={200}
                    block
                    style={{
                      color: tokens.colorNeutralForeground3,
                      marginTop: tokens.spacingVerticalXXS,
                    }}
                  >
                    {deployment.environmentUrl}
                  </Text>
                  <div
                    style={{
                      display: 'flex',
                      gap: tokens.spacingHorizontalM,
                      marginTop: tokens.spacingVerticalXS,
                    }}
                  >
                    <Text className={styles.timestamp}>
                      {formatTimestamp(deployment.startedAt)}
                    </Text>
                    <Text className={styles.timestamp}>
                      Duration: {formatDuration(deployment.startedAt, deployment.completedAt)}
                    </Text>
                  </div>
                  {deployment.status === 'failed' && deployment.error && (
                    <div className={styles.errorMessage}>{deployment.error}</div>
                  )}
                </div>
                <Menu>
                  <MenuTrigger disableButtonEnhancement>
                    <Button appearance="subtle" size="small" icon={<MoreVertical24Regular />} />
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      <Tooltip content="Redeploy with same settings" relationship="label">
                        <MenuItem
                          icon={<ArrowRepeatAll24Regular />}
                          onClick={() => onRedeploy(deployment)}
                        >
                          Redeploy
                        </MenuItem>
                      </Tooltip>
                    </MenuList>
                  </MenuPopover>
                </Menu>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
