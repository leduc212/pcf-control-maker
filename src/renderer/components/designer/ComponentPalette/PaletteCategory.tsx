import { makeStyles, tokens, Text } from '@fluentui/react-components';
import type { ComponentDefinition } from '../../../../shared/types/designer.types';
import { PaletteItem } from './PaletteItem';

const useStyles = makeStyles({
  category: {
    marginBottom: tokens.spacingVerticalM,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalXS,
    paddingLeft: tokens.spacingHorizontalS,
  },
  title: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  items: {
    display: 'flex',
    flexDirection: 'column',
  },
});

interface PaletteCategoryProps {
  name: string;
  components: ComponentDefinition[];
}

export function PaletteCategory({ name, components }: PaletteCategoryProps) {
  const styles = useStyles();

  return (
    <div className={styles.category}>
      <div className={styles.header}>
        <Text className={styles.title}>{name}</Text>
      </div>
      <div className={styles.items}>
        {components.map((component) => (
          <PaletteItem key={component.type} definition={component} />
        ))}
      </div>
    </div>
  );
}
