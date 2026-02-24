import { useCallback } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { makeStyles, tokens, Text } from '@fluentui/react-components';
import { Info24Regular } from '@fluentui/react-icons';
import type { DesignerComponent } from '../../../../shared/types/designer.types';
import { CanvasComponent } from './CanvasComponent';

const useStyles = makeStyles({
  container: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground3,
    overflow: 'auto',
  },
  canvas: {
    width: '400px',
    minHeight: '300px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4,
    padding: tokens.spacingVerticalL,
  },
  dropZone: {
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  dropZoneActive: {
    backgroundColor: tokens.colorBrandBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    border: `2px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorNeutralForeground3,
    gap: tokens.spacingVerticalS,
  },
  emptyStateActive: {
    borderColor: tokens.colorBrandStroke1,
    backgroundColor: tokens.colorBrandBackground2,
  },
});

interface CanvasProps {
  components: DesignerComponent[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  onRemoveComponent: (id: string) => void;
}

function DropZone({
  components,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onDelete,
}: {
  components: DesignerComponent[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onDelete: (id: string) => void;
}) {
  const styles = useStyles();
  const { isOver, setNodeRef } = useDroppable({ id: 'canvas-root' });

  const renderComponents = useCallback(
    (comps: DesignerComponent[], parentId?: string): React.ReactNode => {
      return comps.map((component) => (
        <CanvasComponent
          key={component.id}
          component={component}
          isSelected={selectedId === component.id}
          isHovered={hoveredId === component.id}
          onSelect={onSelect}
          onHover={onHover}
          onDelete={onDelete}
          renderChildren={(children) => renderComponents(children, component.id)}
          parentId={parentId}
        />
      ));
    },
    [selectedId, hoveredId, onSelect, onHover, onDelete]
  );

  if (components.length === 0) {
    return (
      <div
        ref={setNodeRef}
        className={`${styles.emptyState} ${isOver ? styles.emptyStateActive : ''}`}
      >
        <Info24Regular style={{ fontSize: '32px' }} />
        <Text>Drag components here</Text>
        <Text size={200}>Drop Fluent UI components to start designing</Text>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`${styles.dropZone} ${isOver ? styles.dropZoneActive : ''}`}
    >
      <SortableContext items={components.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        {renderComponents(components)}
      </SortableContext>
    </div>
  );
}

export function Canvas({
  components,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onRemoveComponent,
}: CanvasProps) {
  const styles = useStyles();

  const handleCanvasClick = () => {
    onSelect(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
      onRemoveComponent(selectedId);
    }
  };

  return (
    <div
      className={styles.container}
      onClick={handleCanvasClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className={styles.canvas}>
        <DropZone
          components={components}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelect={onSelect}
          onHover={onHover}
          onDelete={onRemoveComponent}
        />
      </div>
    </div>
  );
}
