import React, { useRef, useEffect, useState } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Text,
  Tooltip,
} from '@fluentui/react-components';
import {
  Copy24Regular,
  Dismiss24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  Info24Regular,
  ChevronDown24Regular,
  ChevronUp24Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    marginTop: tokens.spacingVerticalL,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground3,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  iconSuccess: {
    color: tokens.colorPaletteGreenForeground1,
  },
  iconError: {
    color: tokens.colorPaletteRedForeground1,
  },
  iconInfo: {
    color: tokens.colorPaletteBlueForeground1,
  },
  content: {
    maxHeight: '300px',
    overflow: 'auto',
    padding: tokens.spacingHorizontalM,
    fontFamily: 'Consolas, "Courier New", monospace',
    fontSize: '12px',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  contentCollapsed: {
    maxHeight: '0px',
    padding: 0,
    overflow: 'hidden',
  },
  copyButton: {
    minWidth: 'auto',
  },
});

interface BuildOutputProps {
  output: string;
  onClear?: () => void;
  title?: string;
  defaultExpanded?: boolean;
}

export default function BuildOutput({
  output,
  onClear,
  title = 'Output',
  defaultExpanded = true,
}: BuildOutputProps) {
  const styles = useStyles();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copySuccess, setCopySuccess] = useState(false);

  // Auto-scroll to bottom when new content is added
  useEffect(() => {
    if (contentRef.current && isExpanded) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [output, isExpanded]);

  // Determine status based on output content
  const getStatus = (): 'success' | 'error' | 'info' => {
    const lowerOutput = output.toLowerCase();
    if (lowerOutput.includes('error') || lowerOutput.includes('failed')) {
      return 'error';
    }
    if (lowerOutput.includes('success') || lowerOutput.includes('completed')) {
      return 'success';
    }
    return 'info';
  };

  const status = getStatus();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const StatusIcon = status === 'success'
    ? CheckmarkCircle24Regular
    : status === 'error'
    ? ErrorCircle24Regular
    : Info24Regular;

  const statusClass = status === 'success'
    ? styles.iconSuccess
    : status === 'error'
    ? styles.iconError
    : styles.iconInfo;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <StatusIcon className={statusClass} />
          <Text weight="medium">{title}</Text>
        </div>
        <div className={styles.headerRight}>
          <Tooltip content={copySuccess ? 'Copied!' : 'Copy to clipboard'} relationship="label">
            <Button
              appearance="subtle"
              size="small"
              icon={<Copy24Regular />}
              className={styles.copyButton}
              onClick={handleCopy}
            />
          </Tooltip>
          <Tooltip content={isExpanded ? 'Collapse' : 'Expand'} relationship="label">
            <Button
              appearance="subtle"
              size="small"
              icon={isExpanded ? <ChevronUp24Regular /> : <ChevronDown24Regular />}
              className={styles.copyButton}
              onClick={() => setIsExpanded(!isExpanded)}
            />
          </Tooltip>
          {onClear && (
            <Tooltip content="Clear output" relationship="label">
              <Button
                appearance="subtle"
                size="small"
                icon={<Dismiss24Regular />}
                className={styles.copyButton}
                onClick={onClear}
              />
            </Tooltip>
          )}
        </div>
      </div>
      <div
        ref={contentRef}
        className={`${styles.content} ${!isExpanded ? styles.contentCollapsed : ''}`}
      >
        {output}
      </div>
    </div>
  );
}
