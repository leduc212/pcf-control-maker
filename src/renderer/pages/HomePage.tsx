import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  Button,
  Badge,
  Spinner,
  Tooltip,
} from '@fluentui/react-components';
import {
  Add24Regular,
  FolderOpen24Regular,
  History24Regular,
  Folder24Regular,
  Dismiss16Regular,
} from '@fluentui/react-icons';
import { PageHeader } from '../components/common';
import { useProjectStore } from '../stores/project.store';

const useStyles = makeStyles({
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalXXL,
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
      gap: tokens.spacingHorizontalM,
    },
  },
  actionCard: {
    cursor: 'pointer',
    transition: 'transform 0.1s, box-shadow 0.1s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow8,
    },
  },
  actionIcon: {
    fontSize: '32px',
    color: tokens.colorBrandForeground1,
  },
  section: {
    marginTop: tokens.spacingVerticalXXL,
    '@media (max-width: 600px)': {
      marginTop: tokens.spacingVerticalL,
    },
  },
  sectionTitle: {
    marginBottom: tokens.spacingVerticalM,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  recentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  recentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    minWidth: 0,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  recentIcon: {
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
  },
  recentInfo: {
    minWidth: 0,
    flex: 1,
  },
  recentPath: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  removeButton: {
    flexShrink: 0,
  },
  emptyState: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
  },
});

export default function HomePage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { recentProjects, isLoading, loadRecentProjects, openProject } =
    useProjectStore();

  useEffect(() => {
    loadRecentProjects();
  }, [loadRecentProjects]);

  const handleOpenProject = async () => {
    const folderPath = await window.electronAPI.project.selectFolder();
    if (folderPath) {
      await openProject(folderPath);
      navigate('/project');
    }
  };

  const handleOpenRecent = async (path: string) => {
    await openProject(path);
    navigate('/project');
  };

  const handleRemoveRecent = async (e: React.MouseEvent, projectPath: string) => {
    e.stopPropagation();
    await window.electronAPI.project.removeRecent(projectPath);
    await loadRecentProjects();
  };

  return (
    <div className={styles.container}>
      <PageHeader
        title="Welcome to PCF Maker"
        subtitle="Create, build, and manage PowerApps Component Framework controls"
      />

      <div className={styles.grid}>
        <Card className={styles.actionCard} onClick={() => navigate('/project')}>
          <CardHeader
            image={<Add24Regular className={styles.actionIcon} />}
            header={<Text weight="semibold">Create New PCF</Text>}
            description="Start a new PCF component project from scratch"
          />
        </Card>

        <Card className={styles.actionCard} onClick={handleOpenProject}>
          <CardHeader
            image={<FolderOpen24Regular className={styles.actionIcon} />}
            header={<Text weight="semibold">Open Project</Text>}
            description="Open an existing PCF project folder"
          />
        </Card>

        <Card className={styles.actionCard} onClick={() => navigate('/designer')}>
          <CardHeader
            image={
              <span className={styles.actionIcon} style={{ display: 'flex' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm8-2h8v8h-8v-8zm2 2v4h4v-4h-4z" />
                </svg>
              </span>
            }
            header={
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text weight="semibold">Visual Designer</Text>
                <Badge appearance="tint" color="informative" size="small">
                  Preview
                </Badge>
              </span>
            }
            description="Design PCF controls with drag and drop"
          />
        </Card>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <History24Regular />
          <Text size={500} weight="semibold">
            Recent Projects
          </Text>
        </div>

        {isLoading ? (
          <Spinner size="small" label="Loading recent projects..." />
        ) : recentProjects.length > 0 ? (
          <div className={styles.recentList}>
            {recentProjects.map((projectPath) => (
              <div
                key={projectPath}
                className={styles.recentItem}
                onClick={() => handleOpenRecent(projectPath)}
              >
                <Folder24Regular className={styles.recentIcon} />
                <div className={styles.recentInfo}>
                  <Text weight="medium">
                    {projectPath.split(/[/\\]/).pop()}
                  </Text>
                  <Text className={styles.recentPath}>{projectPath}</Text>
                </div>
                <Tooltip content="Remove from recent" relationship="label">
                  <Button
                    className={styles.removeButton}
                    appearance="subtle"
                    size="small"
                    icon={<Dismiss16Regular />}
                    onClick={(e) => handleRemoveRecent(e, projectPath)}
                  />
                </Tooltip>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Text>No recent projects</Text>
          </div>
        )}
      </div>
    </div>
  );
}
