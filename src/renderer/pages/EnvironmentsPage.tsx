import { useEffect, useState } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Spinner,
  MessageBar,
  MessageBarBody,
  Tab,
  TabList,
} from '@fluentui/react-components';
import {
  AuthStatusPanel,
  EnvironmentProfileList,
  DeploymentDialog,
  DeploymentHistoryPanel,
  ConnectionBrowserTab,
} from '../components/environments';
import { PageHeader } from '../components/common';
import { useEnvironmentStore } from '../stores/environment.store';
import type { EnvironmentProfile, DeploymentRecord, DeploymentOptions, ImportResult } from '../../shared/types/environment.types';
import { v4 as uuidv4 } from 'uuid';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: tokens.spacingHorizontalL,
    overflow: 'auto',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalXXL,
    flex: 1,
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: tokens.spacingHorizontalM,
  },
  tabs: {
    marginBottom: tokens.spacingVerticalM,
  },
});

export default function EnvironmentsPage() {
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState<'environments' | 'history' | 'connections'>('environments');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Environment store
  const {
    profiles,
    selectedProfileId,
    authStatus,
    isAuthLoading,
    deployments,
    setProfiles,
    setSelectedProfileId,
    setAuthStatus,
    setAuthLoading,
    addDeployment,
    clearDeployments,
  } = useEnvironmentStore();

  // Deployment dialog state
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [deploymentTarget, setDeploymentTarget] = useState<{
    solutionName: string;
    solutionPath: string;
  } | null>(null);

  // Load profiles and auth status on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [loadedProfiles, loadedAuthStatus, loadedDeployments] = await Promise.all([
          window.electronAPI.environment.getProfiles(),
          window.electronAPI.environment.getAuthStatus(),
          window.electronAPI.environment.getDeployments(),
        ]);

        setProfiles(loadedProfiles);
        setAuthStatus({
          isAuthenticated: loadedAuthStatus.profiles.some((p) => p.active),
          currentProfile: loadedAuthStatus.profiles.find((p) => p.active) || null,
          profiles: loadedAuthStatus.profiles,
        });

        // Load deployments into store
        loadedDeployments.forEach((d) => addDeployment(d));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load environment data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const refreshAuthStatus = async () => {
    setAuthLoading(true);
    try {
      const authResult = await window.electronAPI.environment.getAuthStatus();
      setAuthStatus({
        isAuthenticated: authResult.profiles.some((p) => p.active),
        currentProfile: authResult.profiles.find((p) => p.active) || null,
        profiles: authResult.profiles,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh auth status');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSelectAuthProfile = async (index: number) => {
    try {
      await window.electronAPI.environment.selectAuth(index);
      await refreshAuthStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select auth profile');
    }
  };

  const handleDeleteAuthProfile = async (index: number) => {
    try {
      await window.electronAPI.environment.clearAuth(index);
      await refreshAuthStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete auth profile');
    }
  };

  const handleAddProfile = async (profile: Omit<EnvironmentProfile, 'id' | 'createdAt'>) => {
    const newProfile: EnvironmentProfile = {
      ...profile,
      id: uuidv4(),
      createdAt: Date.now(),
    };

    // If this is set as default, update other profiles
    if (newProfile.isDefault) {
      const updatedProfiles = profiles.map((p) => ({ ...p, isDefault: false }));
      for (const p of updatedProfiles) {
        await window.electronAPI.environment.saveProfile(p);
      }
    }

    await window.electronAPI.environment.saveProfile(newProfile);
    setProfiles([...profiles.map((p) => (newProfile.isDefault ? { ...p, isDefault: false } : p)), newProfile]);
  };

  const handleUpdateProfile = async (id: string, updates: Partial<EnvironmentProfile>) => {
    const profile = profiles.find((p) => p.id === id);
    if (!profile) return;

    const updatedProfile = { ...profile, ...updates };

    // If setting as default, update other profiles
    if (updates.isDefault) {
      for (const p of profiles) {
        if (p.id !== id && p.isDefault) {
          await window.electronAPI.environment.saveProfile({ ...p, isDefault: false });
        }
      }
    }

    await window.electronAPI.environment.saveProfile(updatedProfile);
    setProfiles(
      profiles.map((p) => {
        if (p.id === id) return updatedProfile;
        if (updates.isDefault && p.isDefault) return { ...p, isDefault: false };
        return p;
      })
    );
  };

  const handleRemoveProfile = async (id: string) => {
    await window.electronAPI.environment.deleteProfile(id);
    setProfiles(profiles.filter((p) => p.id !== id));
    if (selectedProfileId === id) {
      setSelectedProfileId(null);
    }
  };

  const handleSetDefaultProfile = async (id: string) => {
    await handleUpdateProfile(id, { isDefault: true });
  };

  const handleAuthenticate = async (profileId: string): Promise<{ success: boolean; error?: string }> => {
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) return { success: false, error: 'Profile not found' };

    try {
      const result = await window.electronAPI.environment.authenticate({
        url: profile.url,
        authenticationType: profile.authenticationType,
        tenantId: profile.tenantId,
        clientId: profile.clientId,
      });

      if (result.success) {
        await refreshAuthStatus();
        // Update last used timestamp
        await handleUpdateProfile(profileId, { lastUsedAt: Date.now() });
      }

      return result;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Authentication failed' };
    }
  };

  const handleDeploy = async (options: DeploymentOptions): Promise<ImportResult> => {
    return window.electronAPI.environment.deploy(options);
  };

  const handleDeploymentComplete = async (result: ImportResult) => {
    if (!deploymentTarget) return;

    const deployment: DeploymentRecord = {
      id: uuidv4(),
      solutionName: deploymentTarget.solutionName,
      solutionPath: deploymentTarget.solutionPath,
      environmentId: selectedProfileId || '',
      environmentUrl: profiles.find((p) => p.id === selectedProfileId)?.url || '',
      status: result.success ? 'success' : 'failed',
      startedAt: Date.now() - 5000, // Approximate start time
      completedAt: Date.now(),
      error: result.error,
    };

    await window.electronAPI.environment.saveDeployment(deployment);
    addDeployment(deployment);
  };

  const handleRedeploy = (deployment: DeploymentRecord) => {
    setDeploymentTarget({
      solutionName: deployment.solutionName,
      solutionPath: deployment.solutionPath,
    });
    setSelectedProfileId(deployment.environmentId);
    setDeployDialogOpen(true);
  };

  const handleClearHistory = async () => {
    await window.electronAPI.environment.clearDeployments();
    clearDeployments();
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="medium" />
        <Text>Loading environments...</Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Environments"
        subtitle="Manage Power Platform environments and deployments"
      />

      {error && (
        <MessageBar intent="error" style={{ marginBottom: tokens.spacingVerticalM }}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      <TabList
        className={styles.tabs}
        selectedValue={activeTab}
        onTabSelect={(_, data) => setActiveTab(data.value as 'environments' | 'history' | 'connections')}
      >
        <Tab value="environments">Environments</Tab>
        <Tab value="history">Deployment History</Tab>
        <Tab value="connections">Connections</Tab>
      </TabList>

      {activeTab === 'environments' && (
        <div className={styles.content}>
          <div className={styles.column}>
            <EnvironmentProfileList
              profiles={profiles}
              selectedId={selectedProfileId}
              onSelect={setSelectedProfileId}
              onAdd={handleAddProfile}
              onUpdate={handleUpdateProfile}
              onRemove={handleRemoveProfile}
              onSetDefault={handleSetDefaultProfile}
              onAuthenticate={handleAuthenticate}
            />
          </div>
          <div className={styles.column}>
            <AuthStatusPanel
              authStatus={authStatus}
              isLoading={isAuthLoading}
              onRefresh={refreshAuthStatus}
              onSelectProfile={handleSelectAuthProfile}
              onDeleteProfile={handleDeleteAuthProfile}
            />
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <DeploymentHistoryPanel
          deployments={deployments}
          onRedeploy={handleRedeploy}
          onClearHistory={handleClearHistory}
        />
      )}

      {activeTab === 'connections' && (
        <ConnectionBrowserTab />
      )}

      {deploymentTarget && (
        <DeploymentDialog
          open={deployDialogOpen}
          onOpenChange={setDeployDialogOpen}
          solutionName={deploymentTarget.solutionName}
          solutionPath={deploymentTarget.solutionPath}
          profiles={profiles}
          defaultProfileId={selectedProfileId || undefined}
          onDeploy={handleDeploy}
          onDeploymentComplete={handleDeploymentComplete}
        />
      )}
    </div>
  );
}
