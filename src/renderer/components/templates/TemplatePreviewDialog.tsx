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
  Badge,
  Tab,
  TabList,
  Divider,
} from '@fluentui/react-components';
import { useState } from 'react';
import type { ControlTemplate } from '../../../shared/types/template.types';

const useStyles = makeStyles({
  surface: {
    maxWidth: '700px',
    maxHeight: '80vh',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalM,
  },
  iconContainer: {
    width: '64px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: '32px',
  },
  headerInfo: {
    flex: 1,
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalS,
  },
  content: {
    marginTop: tokens.spacingVerticalM,
  },
  section: {
    marginBottom: tokens.spacingVerticalL,
  },
  sectionTitle: {
    marginBottom: tokens.spacingVerticalS,
  },
  propertyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  propertyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalXS,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
  },
  codePreview: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    backgroundColor: tokens.colorNeutralBackground3,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'auto',
    maxHeight: '300px',
    whiteSpace: 'pre-wrap',
  },
});

interface TemplatePreviewDialogProps {
  template: ControlTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateClick: () => void;
}

export default function TemplatePreviewDialog({
  template,
  open,
  onOpenChange,
  onCreateClick,
}: TemplatePreviewDialogProps) {
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'code'>('overview');

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>Template Details</DialogTitle>
          <DialogContent>
            <div className={styles.header}>
              <div className={styles.iconContainer}>📦</div>
              <div className={styles.headerInfo}>
                <Text size={500} weight="semibold" block>
                  {template.name}
                </Text>
                <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                  {template.description}
                </Text>
                <div className={styles.tags}>
                  <Badge appearance="tint" color="brand">
                    {template.category}
                  </Badge>
                  <Badge appearance="outline">v{template.version}</Badge>
                  <Badge appearance="outline">{template.controlType}</Badge>
                  {template.tags.map((tag) => (
                    <Badge key={tag} appearance="outline" size="small">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Divider />

            <TabList
              selectedValue={activeTab}
              onTabSelect={(_, data) => setActiveTab(data.value as typeof activeTab)}
              style={{ marginTop: tokens.spacingVerticalM }}
            >
              <Tab value="overview">Overview</Tab>
              <Tab value="properties">Properties ({template.properties.length})</Tab>
              <Tab value="code">Starter Code</Tab>
            </TabList>

            <div className={styles.content}>
              {activeTab === 'overview' && (
                <>
                  <div className={styles.section}>
                    <Text weight="semibold" className={styles.sectionTitle} block>
                      Resources
                    </Text>
                    <div className={styles.propertyList}>
                      {template.resources.map((res, i) => (
                        <div key={i} className={styles.propertyItem}>
                          <Badge appearance="outline" size="small">
                            {res.type}
                          </Badge>
                          <Text size={200}>{res.path}</Text>
                        </div>
                      ))}
                    </div>
                  </div>

                  {template.platformLibraries.length > 0 && (
                    <div className={styles.section}>
                      <Text weight="semibold" className={styles.sectionTitle} block>
                        Platform Libraries
                      </Text>
                      <div className={styles.propertyList}>
                        {template.platformLibraries.map((lib, i) => (
                          <div key={i} className={styles.propertyItem}>
                            <Text size={200}>{lib.name}</Text>
                            <Badge appearance="outline" size="small">
                              v{lib.version}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {Object.keys(template.featureUsage).length > 0 && (
                    <div className={styles.section}>
                      <Text weight="semibold" className={styles.sectionTitle} block>
                        Feature Usage
                      </Text>
                      <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
                        {template.featureUsage.webAPI && (
                          <Badge appearance="tint" color="informative">
                            WebAPI
                          </Badge>
                        )}
                        {template.featureUsage.device && (
                          <Badge appearance="tint" color="informative">
                            Device
                          </Badge>
                        )}
                        {template.featureUsage.utility && (
                          <Badge appearance="tint" color="informative">
                            Utility
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'properties' && (
                <div className={styles.propertyList}>
                  {template.properties.map((prop) => (
                    <div key={prop.name} className={styles.propertyItem}>
                      <div style={{ flex: 1 }}>
                        <Text weight="medium" block>
                          {prop.displayName}
                        </Text>
                        <Text
                          size={200}
                          style={{ color: tokens.colorNeutralForeground3 }}
                        >
                          {prop.name} • {prop.ofType}
                        </Text>
                      </div>
                      <Badge
                        appearance="outline"
                        size="small"
                        color={prop.usage === 'bound' ? 'brand' : 'subtle'}
                      >
                        {prop.usage}
                      </Badge>
                      {prop.required && (
                        <Badge appearance="tint" color="danger" size="small">
                          Required
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'code' && (
                <div className={styles.codePreview}>
                  {template.indexTs.slice(0, 2000)}
                  {template.indexTs.length > 2000 && '\n\n... (truncated)'}
                </div>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button appearance="primary" onClick={onCreateClick}>
              Use This Template
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
