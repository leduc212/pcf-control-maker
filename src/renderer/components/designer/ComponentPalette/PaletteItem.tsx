import { useDraggable } from '@dnd-kit/core';
import { makeStyles, tokens, Text } from '@fluentui/react-components';
import type { ComponentDefinition } from '../../../../shared/types/designer.types';

const useStyles = makeStyles({
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalXS,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    borderRadius: tokens.borderRadiusSmall,
    cursor: 'grab',
    userSelect: 'none',
    border: `1px solid transparent`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      borderColor: tokens.colorNeutralStroke2,
    },
  },
  itemDragging: {
    opacity: 0.5,
  },
  dragOverlay: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorBrandStroke1}`,
    boxShadow: tokens.shadow16,
    cursor: 'grabbing',
  },
});

interface PaletteItemProps {
  definition: ComponentDefinition;
}

export function PaletteItem({ definition }: PaletteItemProps) {
  const styles = useStyles();

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${definition.type}`,
    data: {
      type: 'palette-item',
      componentType: definition.type,
      definition,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.item} ${isDragging ? styles.itemDragging : ''}`}
      {...listeners}
      {...attributes}
    >
      <Text size={300}>{definition.displayName}</Text>
    </div>
  );
}

interface PaletteItemOverlayProps {
  definition: ComponentDefinition;
}

export function PaletteItemOverlay({ definition }: PaletteItemOverlayProps) {
  const styles = useStyles();

  return (
    <div className={styles.dragOverlay}>
      <Text size={300} weight="semibold">
        {definition.displayName}
      </Text>
    </div>
  );
}
