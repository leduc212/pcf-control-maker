import {
  makeStyles,
  tokens,
  Text,
  TabList,
  Tab,
  Card,
  Badge,
} from '@fluentui/react-components';
import { useState } from 'react';
import type {
  DesignerComponent,
  DesignerProperty,
  ComponentBinding,
  LayoutConfig,
} from '../../../../shared/types/designer.types';
import { componentDefinitions } from '../shared/componentDefinitions';
import { PropsEditor } from './PropsEditor';
import { BindingEditor } from './BindingEditor';
import { StyleEditor } from './StyleEditor';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  header: {
    paddingBottom: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    marginBottom: tokens.spacingVerticalM,
  },
  componentInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
  },
  tabContent: {
    flex: 1,
    overflow: 'auto',
    paddingTop: tokens.spacingVerticalM,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
    padding: tokens.spacingVerticalL,
  },
});

type TabValue = 'props' | 'binding' | 'style';

interface PropertyInspectorProps {
  component: DesignerComponent | null;
  properties: DesignerProperty[];
  onUpdateComponent: (id: string, updates: Partial<DesignerComponent>) => void;
}

export function PropertyInspector({
  component,
  properties,
  onUpdateComponent,
}: PropertyInspectorProps) {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<TabValue>('props');

  if (!component) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Text weight="semibold" block>
            Properties
          </Text>
        </div>
        <Card className={styles.emptyState}>
          <Text size={200}>Select a component on the canvas to edit its properties</Text>
        </Card>
      </div>
    );
  }

  const definition = componentDefinitions[component.type];
  const hasBindableProps = (definition?.bindableProps?.length ?? 0) > 0;

  const handleUpdateProps = (props: Record<string, unknown>) => {
    onUpdateComponent(component.id, { props });
  };

  const handleUpdateBindings = (bindings: ComponentBinding[]) => {
    onUpdateComponent(component.id, { bindings });
  };

  const handleUpdateLayout = (layout: LayoutConfig) => {
    onUpdateComponent(component.id, { layout });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text weight="semibold" block>
          Properties
        </Text>
        <div className={styles.componentInfo}>
          <Badge appearance="filled" color="brand">
            {definition?.displayName ?? component.type}
          </Badge>
          {component.bindings && component.bindings.length > 0 && (
            <Badge appearance="tint" color="success" size="small">
              {component.bindings.length} binding{component.bindings.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      <TabList
        selectedValue={selectedTab}
        onTabSelect={(_, data) => setSelectedTab(data.value as TabValue)}
        size="small"
      >
        <Tab value="props">Props</Tab>
        <Tab value="binding" disabled={!hasBindableProps}>
          Binding
        </Tab>
        <Tab value="style">Style</Tab>
      </TabList>

      <div className={styles.tabContent}>
        {selectedTab === 'props' && (
          <PropsEditor component={component} onUpdateProps={handleUpdateProps} />
        )}
        {selectedTab === 'binding' && (
          <BindingEditor
            component={component}
            properties={properties}
            onUpdateBindings={handleUpdateBindings}
          />
        )}
        {selectedTab === 'style' && (
          <StyleEditor component={component} onUpdateLayout={handleUpdateLayout} />
        )}
      </div>
    </div>
  );
}
