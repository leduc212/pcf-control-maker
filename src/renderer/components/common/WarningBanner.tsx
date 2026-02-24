import {
  makeStyles,
  tokens,
  Button,
  Text,
  Link,
} from '@fluentui/react-components';
import {
  Warning24Regular,
  Dismiss20Regular,
} from '@fluentui/react-icons';
import { useUiStore } from '../../stores/ui.store';

const useStyles = makeStyles({
  banner: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalL}`,
    backgroundColor: tokens.colorPaletteYellowBackground2,
    borderBottom: `1px solid ${tokens.colorPaletteYellowBorder1}`,
    minHeight: '44px',
  },
  bannerSuccess: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    borderBottom: `1px solid ${tokens.colorPaletteGreenBorder1}`,
  },
  icon: {
    flexShrink: 0,
    color: tokens.colorPaletteYellowForeground2,
  },
  iconSuccess: {
    color: tokens.colorPaletteGreenForeground2,
  },
  content: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  message: {
    color: tokens.colorNeutralForeground1,
  },
  link: {
    flexShrink: 0,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexShrink: 0,
  },
  dismissButton: {
    minWidth: 'auto',
  },
});

const PAC_CLI_DOCS_URL = 'https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction';

export default function WarningBanner() {
  const styles = useStyles();
  const { pacCliStatus, dismissPacCliWarning, checkPacCli } = useUiStore();

  // Don't show if not checked yet, or if dismissed, or if installed
  if (!pacCliStatus.checked || pacCliStatus.dismissed || pacCliStatus.installed) {
    return null;
  }

  const handleOpenDocs = () => {
    window.electronAPI.fs.openExternal(PAC_CLI_DOCS_URL);
  };

  const handleRecheck = async () => {
    await checkPacCli();
  };

  return (
    <div className={styles.banner}>
      <Warning24Regular className={styles.icon} />
      <div className={styles.content}>
        <Text className={styles.message} size={300} weight="medium">
          PAC CLI is not installed.
        </Text>
        <Text className={styles.message} size={300}>
          Some features like creating, building, and packaging PCF controls require PAC CLI.
        </Text>
        <Link className={styles.link} onClick={handleOpenDocs}>
          Installation guide
        </Link>
      </div>
      <div className={styles.actions}>
        <Button
          appearance="transparent"
          size="small"
          onClick={handleRecheck}
        >
          Recheck
        </Button>
        <Button
          appearance="transparent"
          size="small"
          icon={<Dismiss20Regular />}
          className={styles.dismissButton}
          onClick={dismissPacCliWarning}
          title="Dismiss"
        />
      </div>
    </div>
  );
}
