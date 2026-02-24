import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { makeStyles, tokens } from '@fluentui/react-components';
import Sidebar from './components/common/Sidebar';
import { WarningBanner } from './components/common';
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';
import SolutionsPage from './pages/SolutionsPage';
import DesignerPage from './pages/DesignerPage';
import ManifestBuilderPage from './pages/ManifestBuilderPage';
import EnvironmentsPage from './pages/EnvironmentsPage';
import LocalizationPage from './pages/LocalizationPage';
import GalleryPage from './pages/GalleryPage';
import SettingsPage from './pages/SettingsPage';
import ToolsPage from './pages/ToolsPage';
import { useUiStore } from './stores/ui.store';
import { useGlobalKeyboardShortcuts } from './hooks';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: tokens.spacingHorizontalL,
    '@media (max-width: 900px)': {
      padding: tokens.spacingHorizontalM,
    },
    '@media (max-width: 600px)': {
      padding: tokens.spacingHorizontalS,
    },
  },
});

function App() {
  const styles = useStyles();
  const { checkPacCli } = useUiStore();

  // Enable global keyboard shortcuts
  useGlobalKeyboardShortcuts();

  useEffect(() => {
    checkPacCli();
  }, [checkPacCli]);

  return (
    <div className={styles.root}>
      <Sidebar />
      <main className={styles.main}>
        <WarningBanner />
        <div className={styles.content}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/project" element={<ProjectPage />} />
            <Route path="/solutions" element={<SolutionsPage />} />
            <Route path="/designer" element={<DesignerPage />} />
            <Route path="/manifest" element={<ManifestBuilderPage />} />
            <Route path="/localization" element={<LocalizationPage />} />
            <Route path="/environments" element={<EnvironmentsPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
