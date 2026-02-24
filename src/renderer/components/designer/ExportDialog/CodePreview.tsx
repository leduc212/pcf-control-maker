import { makeStyles, tokens, Button, Text } from '@fluentui/react-components';
import { Copy20Regular, Checkmark20Regular } from '@fluentui/react-icons';
import { useState } from 'react';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeContainer: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    overflow: 'hidden',
  },
  code: {
    padding: tokens.spacingVerticalM,
    margin: 0,
    overflow: 'auto',
    maxHeight: '400px',
    fontSize: tokens.fontSizeBase200,
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    whiteSpace: 'pre',
    lineHeight: 1.5,
  },
});

interface CodePreviewProps {
  title: string;
  filename: string;
  code: string;
}

export function CodePreview({ title, filename, code }: CodePreviewProps) {
  const styles = useStyles();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Text weight="semibold">{title}</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginLeft: tokens.spacingHorizontalS }}>
            {filename}
          </Text>
        </div>
        <Button
          appearance="subtle"
          icon={copied ? <Checkmark20Regular /> : <Copy20Regular />}
          onClick={handleCopy}
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <div className={styles.codeContainer}>
        <pre className={styles.code}>{code}</pre>
      </div>
    </div>
  );
}
