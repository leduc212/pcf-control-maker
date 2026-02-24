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
} from '@fluentui/react-components';
import {
  PersonCircle24Regular,
  CheckmarkCircle24Regular,
  DismissCircle24Regular,
  ArrowSync24Regular,
  MoreVertical24Regular,
  Delete24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';
import type { AuthStatus, PacAuthProfile } from '../../../shared/types/environment.types';

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
  card: {
    padding: tokens.spacingHorizontalL,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  statusIcon: {
    fontSize: '24px',
  },
  connected: {
    color: tokens.colorPaletteGreenForeground1,
  },
  disconnected: {
    color: tokens.colorNeutralForeground3,
  },
  profileList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    marginTop: tokens.spacingVerticalM,
  },
  profileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
  },
  profileItemActive: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileUrl: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  emptyState: {
    padding: tokens.spacingVerticalL,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
});

interface AuthStatusPanelProps {
  authStatus: AuthStatus;
  isLoading: boolean;
  onRefresh: () => void;
  onSelectProfile: (index: number) => void;
  onDeleteProfile: (index: number) => void;
}

export default function AuthStatusPanel({
  authStatus,
  isLoading,
  onRefresh,
  onSelectProfile,
  onDeleteProfile,
}: AuthStatusPanelProps) {
  const styles = useStyles();

  const currentProfile = authStatus.currentProfile;
  const isConnected = authStatus.isAuthenticated;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={500} weight="semibold">
          Authentication Status
        </Text>
        <Tooltip content="Refresh auth status" relationship="label">
          <Button
            appearance="subtle"
            icon={isLoading ? <Spinner size="tiny" /> : <ArrowSync24Regular />}
            onClick={onRefresh}
            disabled={isLoading}
          />
        </Tooltip>
      </div>

      <Card className={styles.card}>
        <div className={styles.statusRow}>
          {isConnected ? (
            <CheckmarkCircle24Regular className={`${styles.statusIcon} ${styles.connected}`} />
          ) : (
            <DismissCircle24Regular className={`${styles.statusIcon} ${styles.disconnected}`} />
          )}
          <div>
            <Text weight="semibold">
              {isConnected ? 'Connected' : 'Not Connected'}
            </Text>
            {currentProfile && (
              <Text size={200} block style={{ color: tokens.colorNeutralForeground3 }}>
                {currentProfile.url}
              </Text>
            )}
          </div>
          {isConnected && currentProfile && (
            <Badge appearance="filled" color="success" style={{ marginLeft: 'auto' }}>
              Active
            </Badge>
          )}
        </div>

        {authStatus.profiles.length > 0 && (
          <div className={styles.profileList}>
            <Text weight="medium" size={300}>
              Saved Auth Profiles ({authStatus.profiles.length})
            </Text>
            {authStatus.profiles.map((profile) => (
              <div
                key={profile.index}
                className={`${styles.profileItem} ${profile.active ? styles.profileItemActive : ''}`}
              >
                <PersonCircle24Regular />
                <div className={styles.profileInfo}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                    <Text weight="medium">{profile.name}</Text>
                    {profile.active && (
                      <Checkmark24Regular style={{ color: tokens.colorPaletteGreenForeground1, fontSize: '16px' }} />
                    )}
                  </div>
                  <Text className={styles.profileUrl}>{profile.url}</Text>
                  {profile.user && (
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      {profile.user}
                    </Text>
                  )}
                </div>
                <Menu>
                  <MenuTrigger disableButtonEnhancement>
                    <Button appearance="subtle" size="small" icon={<MoreVertical24Regular />} />
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      {!profile.active && (
                        <MenuItem onClick={() => onSelectProfile(profile.index)}>
                          Set as Active
                        </MenuItem>
                      )}
                      <MenuItem icon={<Delete24Regular />} onClick={() => onDeleteProfile(profile.index)}>
                        Remove
                      </MenuItem>
                    </MenuList>
                  </MenuPopover>
                </Menu>
              </div>
            ))}
          </div>
        )}

        {authStatus.profiles.length === 0 && !isLoading && (
          <div className={styles.emptyState}>
            <Text>No saved authentication profiles.</Text>
            <Text size={200} block style={{ marginTop: tokens.spacingVerticalXS }}>
              Add an environment and authenticate to get started.
            </Text>
          </div>
        )}
      </Card>
    </div>
  );
}
