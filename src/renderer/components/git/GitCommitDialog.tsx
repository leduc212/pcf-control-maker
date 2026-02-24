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
  Input,
  Field,
  Textarea,
  Checkbox,
  Text,
  Spinner,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { Sparkle24Regular } from '@fluentui/react-icons';
import type { GitStatus } from '../../../shared/types/git.types';

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  filesList: {
    maxHeight: '200px',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingHorizontalS,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  generateButton: {
    marginLeft: 'auto',
  },
});

interface GitCommitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectPath: string;
  status: GitStatus;
  onCommitComplete: () => void;
}

export default function GitCommitDialog({
  open,
  onOpenChange,
  projectPath,
  status,
  onCommitComplete,
}: GitCommitDialogProps) {
  const styles = useStyles();
  const [message, setMessage] = useState('');
  const [stageAll, setStageAll] = useState(true);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMessage('');
      setError(null);
      // Auto-generate message when opening
      generateMessage();
    }
  }, [open]);

  const generateMessage = async () => {
    setIsGenerating(true);
    try {
      const msg = await window.electronAPI.git.generateMessage(projectPath);
      setMessage(msg);
    } catch (err) {
      // Ignore errors, use empty message
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCommit = async () => {
    if (!message.trim()) {
      setError('Commit message is required');
      return;
    }

    setIsCommitting(true);
    setError(null);

    try {
      // Stage all changes if selected
      if (stageAll) {
        await window.electronAPI.git.stage(projectPath);
      }

      // Commit
      const result = await window.electronAPI.git.commit(projectPath, {
        message: message.trim(),
      });

      if (result.success) {
        onCommitComplete();
        onOpenChange(false);
      } else {
        setError(result.error || 'Commit failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Commit failed');
    } finally {
      setIsCommitting(false);
    }
  };

  const allFiles = [
    ...status.staged.map((f) => ({ ...f, staged: true })),
    ...status.unstaged.map((f) => ({ ...f, staged: false })),
    ...status.untracked.map((path) => ({ path, status: 'added', staged: false })),
  ];

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface style={{ maxWidth: '500px' }}>
        <DialogBody>
          <DialogTitle>Commit Changes</DialogTitle>
          <DialogContent>
            {error && (
              <MessageBar intent="error" style={{ marginBottom: tokens.spacingVerticalM }}>
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            )}

            <div className={styles.form}>
              <Field
                label={
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <span>Commit Message</span>
                    <Button
                      className={styles.generateButton}
                      appearance="subtle"
                      size="small"
                      icon={isGenerating ? <Spinner size="tiny" /> : <Sparkle24Regular />}
                      onClick={generateMessage}
                      disabled={isGenerating}
                    >
                      Auto-generate
                    </Button>
                  </div>
                }
                required
              >
                <Textarea
                  value={message}
                  onChange={(_, data) => setMessage(data.value)}
                  placeholder="Describe your changes..."
                  rows={3}
                  disabled={isCommitting}
                />
              </Field>

              <Field label={`Files to commit (${allFiles.length})`}>
                <div className={styles.filesList}>
                  {allFiles.map((file, index) => (
                    <div key={index} className={styles.fileItem}>
                      <Text size={200}>
                        {file.path}
                        {!file.staged && (
                          <Text
                            size={100}
                            style={{
                              color: tokens.colorNeutralForeground3,
                              marginLeft: tokens.spacingHorizontalXS,
                            }}
                          >
                            (not staged)
                          </Text>
                        )}
                      </Text>
                    </div>
                  ))}
                </div>
              </Field>

              {(status.unstaged.length > 0 || status.untracked.length > 0) && (
                <Checkbox
                  checked={stageAll}
                  onChange={(_, data) => setStageAll(data.checked === true)}
                  label="Stage all changes before committing"
                />
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => onOpenChange(false)} disabled={isCommitting}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={handleCommit}
              disabled={isCommitting || !message.trim()}
              icon={isCommitting ? <Spinner size="tiny" /> : undefined}
            >
              {isCommitting ? 'Committing...' : 'Commit'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
