import { useState } from 'react';
import {
  makeStyles,
  tokens,
  Tab,
  TabList,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { PageHeader } from '../components/common';
import { DocsTab, BundleTab, DiffTab, DepsTab } from '../components/tools';
import { useProjectStore } from '../stores/project.store';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: tokens.spacingHorizontalL,
    overflow: 'auto',
  },
  tabs: {
    marginBottom: tokens.spacingVerticalM,
  },
  tabContent: {
    flex: 1,
  },
});

type ToolsTab = 'docs' | 'bundle' | 'diff' | 'deps';

export default function ToolsPage() {
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState<ToolsTab>('docs');
  const { currentProject } = useProjectStore();

  const needsProject = activeTab !== 'diff';
  const showProjectWarning = needsProject && !currentProject;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Tools"
        subtitle="Advanced development utilities for PCF projects"
      />

      <TabList
        className={styles.tabs}
        selectedValue={activeTab}
        onTabSelect={(_, data) => setActiveTab(data.value as ToolsTab)}
      >
        <Tab value="docs">Documentation</Tab>
        <Tab value="bundle">Bundle Analyzer</Tab>
        <Tab value="diff">Solution Diff</Tab>
        <Tab value="deps">Dependencies</Tab>
      </TabList>

      {showProjectWarning && (
        <MessageBar intent="warning" style={{ marginBottom: tokens.spacingVerticalM }}>
          <MessageBarBody>
            Open a project first to use this tool.
          </MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.tabContent}>
        {activeTab === 'docs' && <DocsTab />}
        {activeTab === 'bundle' && <BundleTab />}
        {activeTab === 'diff' && <DiffTab />}
        {activeTab === 'deps' && <DepsTab />}
      </div>
    </div>
  );
}
