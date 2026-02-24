import { makeStyles, tokens, Text } from '@fluentui/react-components';
import type { DesignerComponent } from '../../../../shared/types/designer.types';
import { componentDefinitions } from '../shared/componentDefinitions';
import { PropField } from './PropField';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  emptyState: {
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
    padding: tokens.spacingVerticalL,
  },
});

interface PropsEditorProps {
  component: DesignerComponent;
  onUpdateProps: (props: Record<string, unknown>) => void;
}

export function PropsEditor({ component, onUpdateProps }: PropsEditorProps) {
  const styles = useStyles();
  const definition = componentDefinitions[component.type];

  if (!definition || definition.editableProps.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text size={200}>No editable properties</Text>
      </div>
    );
  }

  const handlePropChange = (propName: string, value: unknown) => {
    onUpdateProps({
      ...component.props,
      [propName]: value,
    });
  };

  return (
    <div className={styles.container}>
      {definition.editableProps.map((prop) => (
        <PropField
          key={prop.name}
          definition={prop}
          value={component.props[prop.name]}
          onChange={(value) => handlePropChange(prop.name, value)}
        />
      ))}
    </div>
  );
}
