import { useState, useEffect } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  Text,
  Button,
  Badge,
  Spinner,
  Tooltip,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Divider,
} from '@fluentui/react-components';
import {
  Branch24Regular,
  ArrowSync24Regular,
  ArrowUp24Regular,
  ArrowDown24Regular,
  Checkmark24Regular,
  Document24Regular,
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  ChevronDown24Regular,
} from '@fluentui/react-icons';
import type { GitStatus, GitBranch } from '../../../shared/types/git.types';
import GitCommitDialog from './GitCommitDialog';

const useStyles = makeStyles({
  card: {
    padding: tokens.spacingHorizontalM,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingVerticalM,
  },
  branchInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  syncInfo: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
  },
  changesSection: {
    marginTop: tokens.spacingVerticalM,
  },
  changesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    maxHeight: '200px',
    overflow: 'auto',
  },
  changeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalXXS,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    borderRadius: tokens.borderRadiusSmall,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  changeIcon: {
    flexShrink: 0,
  },
  changePath: {
    flex: 1,
    fontSize: tokens.fontSizeBase200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  emptyState: {
    padding: tokens.spacingVerticalM,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
  notRepo: {
    padding: tokens.spacingVerticalL,
    textAlign: 'center',
  },
});

interface GitStatusPanelProps {
  projectPath: string;
}

export default function GitStatusPanel({ projectPath }: GitStatusPanelProps) {
  const styles = useStyles();
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [commitDialogOpen, setCommitDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const [statusResult, branchesResult] = await Promise.all([
        window.electronAPI.git.status(projectPath),
        window.electronAPI.git.branches(projectPath),
      ]);
      setStatus(statusResult);
      setBranches(branchesResult);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load git status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectPath) {
      loadStatus();
    }
  }, [projectPath]);

  const handlePush = async () => {
    setIsPushing(true);
    try {
      const result = await window.electronAPI.git.push(projectPath);
      if (!result.success) {
        setError(result.error || 'Push failed');
      }
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Push failed');
    } finally {
      setIsPushing(false);
    }
  };

  const handlePull = async () => {
    setIsPulling(true);
    try {
      const result = await window.electronAPI.git.pull(projectPath);
      if (!result.success) {
        setError(result.error || 'Pull failed');
      }
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pull failed');
    } finally {
      setIsPulling(false);
    }
  };

  const handleCheckout = async (branch: string) => {
    try {
      const result = await window.electronAPI.git.checkout(projectPath, branch);
      if (!result.success) {
        setError(result.error || 'Checkout failed');
      }
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    }
  };

  const handleCommitComplete = () => {
    loadStatus();
  };

  const handleInit = async () => {
    try {
      const result = await window.electronAPI.git.init(projectPath);
      if (result.success) {
        await loadStatus();
      } else {
        setError(result.error || 'Failed to initialize repository');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize');
    }
  };

  const getStatusIcon = (changeStatus: string) => {
    switch (changeStatus) {
      case 'added':
        return <Add24Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />;
      case 'modified':
        return <Edit24Regular style={{ color: tokens.colorPaletteYellowForeground1 }} />;
      case 'deleted':
        return <Delete24Regular style={{ color: tokens.colorPaletteRedForeground1 }} />;
      default:
        return <Document24Regular />;
    }
  };

  if (isLoading) {
    return (
      <Card className={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
          <Spinner size="tiny" />
          <Text>Loading git status...</Text>
        </div>
      </Card>
    );
  }

  if (!status?.isRepo) {
    return (
      <Card className={styles.card}>
        <div className={styles.notRepo}>
          <Branch24Regular
            style={{
              fontSize: '32px',
              color: tokens.colorNeutralForeground3,
              marginBottom: tokens.spacingVerticalS,
            }}
          />
          <Text block weight="medium">
            Not a Git Repository
          </Text>
          <Text
            size={200}
            block
            style={{ color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalM }}
          >
            Initialize git to track changes
          </Text>
          <Button appearance="primary" onClick={handleInit}>
            Initialize Repository
          </Button>
        </div>
      </Card>
    );
  }

  const localBranches = branches.filter((b) => !b.isRemote);
  const totalChanges =
    status.staged.length + status.unstaged.length + status.untracked.length;

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div className={styles.branchInfo}>
          <Branch24Regular />
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button
                appearance="subtle"
                size="small"
                icon={<ChevronDown24Regular />}
                iconPosition="after"
              >
                {status.branch || 'main'}
              </Button>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                {localBranches.map((branch) => (
                  <MenuItem
                    key={branch.name}
                    icon={branch.isCurrent ? <Checkmark24Regular /> : undefined}
                    onClick={() => !branch.isCurrent && handleCheckout(branch.name)}
                  >
                    {branch.name}
                  </MenuItem>
                ))}
              </MenuList>
            </MenuPopover>
          </Menu>
          <div className={styles.syncInfo}>
            {status.ahead > 0 && (
              <Tooltip content={`${status.ahead} commit(s) ahead`} relationship="label">
                <Badge appearance="outline" size="small" icon={<ArrowUp24Regular />}>
                  {status.ahead}
                </Badge>
              </Tooltip>
            )}
            {status.behind > 0 && (
              <Tooltip content={`${status.behind} commit(s) behind`} relationship="label">
                <Badge appearance="outline" size="small" icon={<ArrowDown24Regular />}>
                  {status.behind}
                </Badge>
              </Tooltip>
            )}
          </div>
        </div>
        <div className={styles.actions}>
          <Tooltip content="Refresh" relationship="label">
            <Button
              appearance="subtle"
              size="small"
              icon={<ArrowSync24Regular />}
              onClick={loadStatus}
            />
          </Tooltip>
          <Tooltip content="Pull" relationship="label">
            <Button
              appearance="subtle"
              size="small"
              icon={isPulling ? <Spinner size="tiny" /> : <ArrowDown24Regular />}
              onClick={handlePull}
              disabled={isPulling}
            />
          </Tooltip>
          <Tooltip content="Push" relationship="label">
            <Button
              appearance="subtle"
              size="small"
              icon={isPushing ? <Spinner size="tiny" /> : <ArrowUp24Regular />}
              onClick={handlePush}
              disabled={isPushing || status.ahead === 0}
            />
          </Tooltip>
        </div>
      </div>

      {error && (
        <Text
          size={200}
          style={{ color: tokens.colorPaletteRedForeground1, marginBottom: tokens.spacingVerticalS }}
          block
        >
          {error}
        </Text>
      )}

      {totalChanges === 0 ? (
        <div className={styles.emptyState}>
          <Checkmark24Regular
            style={{ color: tokens.colorPaletteGreenForeground1, marginBottom: tokens.spacingVerticalXS }}
          />
          <Text size={200}>Working tree clean</Text>
        </div>
      ) : (
        <div className={styles.changesSection}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: tokens.spacingVerticalS,
            }}
          >
            <Text weight="medium" size={200}>
              Changes ({totalChanges})
            </Text>
            <Button
              appearance="primary"
              size="small"
              onClick={() => setCommitDialogOpen(true)}
            >
              Commit
            </Button>
          </div>

          <div className={styles.changesList}>
            {status.staged.map((file) => (
              <div key={`staged-${file.path}`} className={styles.changeItem}>
                <span className={styles.changeIcon}>{getStatusIcon(file.status)}</span>
                <span className={styles.changePath}>{file.path}</span>
                <Badge appearance="tint" color="success" size="small">
                  Staged
                </Badge>
              </div>
            ))}
            {status.unstaged.map((file) => (
              <div key={`unstaged-${file.path}`} className={styles.changeItem}>
                <span className={styles.changeIcon}>{getStatusIcon(file.status)}</span>
                <span className={styles.changePath}>{file.path}</span>
              </div>
            ))}
            {status.untracked.map((file) => (
              <div key={`untracked-${file}`} className={styles.changeItem}>
                <span className={styles.changeIcon}>
                  <Add24Regular style={{ color: tokens.colorNeutralForeground3 }} />
                </span>
                <span className={styles.changePath}>{file}</span>
                <Badge appearance="outline" size="small">
                  Untracked
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <GitCommitDialog
        open={commitDialogOpen}
        onOpenChange={setCommitDialogOpen}
        projectPath={projectPath}
        status={status}
        onCommitComplete={handleCommitComplete}
      />
    </Card>
  );
}
