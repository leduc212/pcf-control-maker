import { useNavigate, useLocation } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Button,
  Tooltip,
  Divider,
  Text,
} from '@fluentui/react-components';
import {
  Home24Regular,
  Home24Filled,
  Folder24Regular,
  Folder24Filled,
  DesignIdeas24Regular,
  DesignIdeas24Filled,
  Apps24Regular,
  Apps24Filled,
  Archive24Regular,
  Archive24Filled,
  Cloud24Regular,
  Cloud24Filled,
  Globe24Regular,
  Globe24Filled,
  Settings24Regular,
  Settings24Filled,
  ChevronLeft20Regular,
  ChevronRight20Regular,
  DocumentBulletList24Regular,
  DocumentBulletList24Filled,
  Wrench24Regular,
  Wrench24Filled,
  bundleIcon,
} from '@fluentui/react-icons';
import { useUiStore } from '../../stores/ui.store';

const HomeIcon = bundleIcon(Home24Filled, Home24Regular);
const FolderIcon = bundleIcon(Folder24Filled, Folder24Regular);
const SolutionsIcon = bundleIcon(Archive24Filled, Archive24Regular);
const DesignerIcon = bundleIcon(DesignIdeas24Filled, DesignIdeas24Regular);
const ManifestIcon = bundleIcon(DocumentBulletList24Filled, DocumentBulletList24Regular);
const EnvironmentsIcon = bundleIcon(Cloud24Filled, Cloud24Regular);
const LocalizationIcon = bundleIcon(Globe24Filled, Globe24Regular);
const GalleryIcon = bundleIcon(Apps24Filled, Apps24Regular);
const ToolsIcon = bundleIcon(Wrench24Filled, Wrench24Regular);
const SettingsIcon = bundleIcon(Settings24Filled, Settings24Regular);

const useStyles = makeStyles({
  sidebar: {
    width: '180px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    transition: 'width 0.2s ease',
    flexShrink: 0,
    overflow: 'hidden',
  },
  sidebarCollapsed: {
    width: '48px',
    alignItems: 'center',
  },
  logo: {
    marginBottom: tokens.spacingVerticalL,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    transition: 'font-size 0.2s ease',
    textAlign: 'center',
  },
  logoCollapsed: {
    fontSize: tokens.fontSizeBase300,
  },
  navSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
  },
  navSectionCollapsed: {
    alignItems: 'center',
    paddingLeft: '0',
    paddingRight: '0',
  },
  navButton: {
    justifyContent: 'flex-start',
    minWidth: '0',
    transition: 'width 0.2s ease, min-width 0.2s ease',
  },
  navButtonCollapsed: {
    width: '36px',
    height: '36px',
    minWidth: '36px',
    justifyContent: 'center',
  },
  navButtonActive: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  navLabel: {
    fontSize: tokens.fontSizeBase200,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  spacer: {
    flex: 1,
  },
  divider: {
    marginTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM,
    marginLeft: tokens.spacingHorizontalM,
    marginRight: tokens.spacingHorizontalM,
    transition: 'margin 0.2s ease',
  },
  dividerCollapsed: {
    marginLeft: tokens.spacingHorizontalS,
    marginRight: tokens.spacingHorizontalS,
  },
  collapseButton: {
    width: '32px',
    height: '32px',
    minWidth: '32px',
    marginTop: tokens.spacingVerticalS,
    alignSelf: 'center',
  },
});

interface NavItem {
  path: string;
  icon: React.FC;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: HomeIcon, label: 'Home' },
  { path: '/project', icon: FolderIcon, label: 'Project' },
  { path: '/solutions', icon: SolutionsIcon, label: 'Solutions' },
  { path: '/manifest', icon: ManifestIcon, label: 'Manifest' },
  { path: '/localization', icon: LocalizationIcon, label: 'Localization' },
  { path: '/environments', icon: EnvironmentsIcon, label: 'Environments' },
  { path: '/gallery', icon: GalleryIcon, label: 'Templates' },
  { path: '/tools', icon: ToolsIcon, label: 'Tools' },
];

export default function Sidebar() {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  return (
    <nav className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
      <Text className={`${styles.logo} ${sidebarCollapsed ? styles.logoCollapsed : ''}`} size={sidebarCollapsed ? 300 : 500}>
        PCF
      </Text>

      <Divider className={`${styles.divider} ${sidebarCollapsed ? styles.dividerCollapsed : ''}`} />

      <div className={`${styles.navSection} ${sidebarCollapsed ? styles.navSectionCollapsed : ''}`}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Tooltip
              key={item.path}
              content={item.label}
              relationship="label"
              positioning="after"
              visible={sidebarCollapsed ? undefined : false}
            >
              <Button
                className={`${styles.navButton} ${sidebarCollapsed ? styles.navButtonCollapsed : ''} ${isActive ? styles.navButtonActive : ''}`}
                appearance={isActive ? 'primary' : 'subtle'}
                icon={<Icon />}
                onClick={() => navigate(item.path)}
              >
                {!sidebarCollapsed && <span className={styles.navLabel}>{item.label}</span>}
              </Button>
            </Tooltip>
          );
        })}
      </div>

      <div className={styles.spacer} />

      <div style={{ paddingLeft: sidebarCollapsed ? 0 : tokens.spacingHorizontalS, paddingRight: sidebarCollapsed ? 0 : tokens.spacingHorizontalS, alignSelf: sidebarCollapsed ? 'center' : 'stretch' }}>
        <Tooltip content="Settings" relationship="label" positioning="after" visible={sidebarCollapsed ? undefined : false}>
          <Button
            className={`${styles.navButton} ${sidebarCollapsed ? styles.navButtonCollapsed : ''} ${location.pathname === '/settings' ? styles.navButtonActive : ''}`}
            appearance={location.pathname === '/settings' ? 'primary' : 'subtle'}
            icon={<SettingsIcon />}
            onClick={() => navigate('/settings')}
          >
            {!sidebarCollapsed && <span className={styles.navLabel}>Settings</span>}
          </Button>
        </Tooltip>
      </div>

      <Tooltip content={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} relationship="label" positioning="after">
        <Button
          className={styles.collapseButton}
          appearance="subtle"
          icon={sidebarCollapsed ? <ChevronRight20Regular /> : <ChevronLeft20Regular />}
          onClick={toggleSidebar}
        />
      </Tooltip>
    </nav>
  );
}
