import { useState, useEffect } from 'react';
import {
  makeStyles,
  tokens,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Text,
  Select,
  Field,
  Switch,
  Spinner,
  MessageBar,
  MessageBarBody,
  ProgressBar,
} from '@fluentui/react-components';
import {
  CloudArrowUp24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import type { EnvironmentProfile, DeploymentOptions, ImportResult } from '../../../shared/types/environment.types';

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  solutionInfo: {
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalL,
  },
  progressHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  resultContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
  },
  resultIcon: {
    fontSize: '48px',
    textAlign: 'center',
  },
  successIcon: {
    color: tokens.colorPaletteGreenForeground1,
  },
  errorIcon: {
    color: tokens.colorPaletteRedForeground1,
  },
});

type DeploymentStage = 'configure' | 'deploying' | 'result';

interface DeploymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  solutionName: string;
  solutionPath: string;
  profiles: EnvironmentProfile[];
  defaultProfileId?: string;
  onDeploy: (options: DeploymentOptions) => Promise<ImportResult>;
  onDeploymentComplete: (result: ImportResult) => void;
}

export default function DeploymentDialog({
  open,
  onOpenChange,
  solutionName,
  solutionPath,
  profiles,
  defaultProfileId,
  onDeploy,
  onDeploymentComplete,
}: DeploymentDialogProps) {
  const styles = useStyles();
  const [stage, setStage] = useState<DeploymentStage>('configure');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [publishOnImport, setPublishOnImport] = useState(true);
  const [overwriteUnmanaged, setOverwriteUnmanaged] = useState(false);
  const [deployResult, setDeployResult] = useState<ImportResult | null>(null);
  const [deploymentProgress, setDeploymentProgress] = useState(0);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStage('configure');
      setSelectedProfileId(defaultProfileId || profiles.find(p => p.isDefault)?.id || profiles[0]?.id || '');
      setPublishOnImport(true);
      setOverwriteUnmanaged(false);
      setDeployResult(null);
      setDeploymentProgress(0);
    }
  }, [open, defaultProfileId, profiles]);

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  const handleDeploy = async () => {
    if (!selectedProfile) return;

    setStage('deploying');
    setDeploymentProgress(0);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setDeploymentProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      const options: DeploymentOptions = {
        solutionPath,
        environmentUrl: selectedProfile.url,
        publishOnImport,
        overwriteUnmanaged,
      };

      const result = await onDeploy(options);

      clearInterval(progressInterval);
      setDeploymentProgress(100);
      setDeployResult(result);
      setStage('result');
      onDeploymentComplete(result);
    } catch (error) {
      clearInterval(progressInterval);
      setDeployResult({
        success: false,
        error: error instanceof Error ? error.message : 'Deployment failed',
      });
      setStage('result');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const renderConfigureStage = () => (
    <>
      <DialogContent>
        <div className={styles.form}>
          <div className={styles.solutionInfo}>
            <Text weight="semibold" block>
              Solution to Deploy
            </Text>
            <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
              {solutionName}
            </Text>
            <Text
              size={200}
              block
              style={{
                color: tokens.colorNeutralForeground3,
                marginTop: tokens.spacingVerticalXS,
                wordBreak: 'break-all',
              }}
            >
              {solutionPath}
            </Text>
          </div>

          <Field label="Target Environment" required>
            <Select
              value={selectedProfileId}
              onChange={(_, data) => setSelectedProfileId(data.value)}
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} ({profile.url})
                </option>
              ))}
            </Select>
          </Field>

          {profiles.length === 0 && (
            <MessageBar intent="warning">
              <MessageBarBody>
                No environments configured. Add an environment first before deploying.
              </MessageBarBody>
            </MessageBar>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
              <Switch
                checked={publishOnImport}
                onChange={(_, data) => setPublishOnImport(data.checked)}
              />
              <div>
                <Text weight="medium">Publish after import</Text>
                <Text size={200} block style={{ color: tokens.colorNeutralForeground3 }}>
                  Automatically publish all customizations after importing
                </Text>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
              <Switch
                checked={overwriteUnmanaged}
                onChange={(_, data) => setOverwriteUnmanaged(data.checked)}
              />
              <div>
                <Text weight="medium">Overwrite unmanaged customizations</Text>
                <Text size={200} block style={{ color: tokens.colorNeutralForeground3 }}>
                  Replace any existing unmanaged customizations
                </Text>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button appearance="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          appearance="primary"
          icon={<CloudArrowUp24Regular />}
          onClick={handleDeploy}
          disabled={!selectedProfileId || profiles.length === 0}
        >
          Deploy
        </Button>
      </DialogActions>
    </>
  );

  const renderDeployingStage = () => (
    <DialogContent>
      <div className={styles.progressContainer}>
        <div className={styles.progressHeader}>
          <Spinner size="small" />
          <Text weight="semibold">Deploying Solution...</Text>
        </div>
        <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
          Importing {solutionName} to {selectedProfile?.name}
        </Text>
        <ProgressBar value={deploymentProgress / 100} />
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          {deploymentProgress}% complete
        </Text>
      </div>
    </DialogContent>
  );

  const renderResultStage = () => (
    <>
      <DialogContent>
        <div className={styles.resultContainer}>
          <div className={styles.resultIcon}>
            {deployResult?.success ? (
              <Checkmark24Regular className={styles.successIcon} style={{ fontSize: '48px' }} />
            ) : (
              <Dismiss24Regular className={styles.errorIcon} style={{ fontSize: '48px' }} />
            )}
          </div>
          <Text
            align="center"
            size={500}
            weight="semibold"
            style={{
              color: deployResult?.success
                ? tokens.colorPaletteGreenForeground1
                : tokens.colorPaletteRedForeground1,
            }}
          >
            {deployResult?.success ? 'Deployment Successful' : 'Deployment Failed'}
          </Text>
          {deployResult?.success ? (
            <Text align="center" size={300} style={{ color: tokens.colorNeutralForeground3 }}>
              {solutionName} has been deployed to {selectedProfile?.name}
            </Text>
          ) : (
            <MessageBar intent="error">
              <MessageBarBody>{deployResult?.error || 'Unknown error occurred'}</MessageBarBody>
            </MessageBar>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button appearance="primary" onClick={handleClose}>
          Close
        </Button>
      </DialogActions>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface style={{ maxWidth: '500px' }}>
        <DialogBody>
          <DialogTitle>
            {stage === 'configure' && 'Deploy Solution'}
            {stage === 'deploying' && 'Deploying...'}
            {stage === 'result' && (deployResult?.success ? 'Success' : 'Failed')}
          </DialogTitle>
          {stage === 'configure' && renderConfigureStage()}
          {stage === 'deploying' && renderDeployingStage()}
          {stage === 'result' && renderResultStage()}
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
