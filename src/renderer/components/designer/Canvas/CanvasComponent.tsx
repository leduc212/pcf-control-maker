import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { makeStyles, tokens, Text } from '@fluentui/react-components';
import { Delete20Regular } from '@fluentui/react-icons';
import type { DesignerComponent } from '../../../../shared/types/designer.types';
import { componentDefinitions } from '../shared/componentDefinitions';
import { ComponentRenderer } from './ComponentRenderer';

const useStyles = makeStyles({
  wrapper: {
    position: 'relative',
    borderRadius: tokens.borderRadiusMedium,
    transition: 'all 0.1s ease',
    cursor: 'pointer',
  },
  wrapperHovered: {
    outline: `1px dashed ${tokens.colorNeutralStroke1}`,
    outlineOffset: '2px',
  },
  wrapperSelected: {
    outline: `2px solid ${tokens.colorBrandStroke1}`,
    outlineOffset: '2px',
  },
  wrapperDragging: {
    opacity: 0.5,
  },
  label: {
    position: 'absolute',
    top: '-20px',
    left: '0',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorBrandForeground1,
    backgroundColor: tokens.colorBrandBackground2,
    padding: '2px 6px',
    borderRadius: tokens.borderRadiusSmall,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    zIndex: 10,
  },
  deleteButton: {
    position: 'absolute',
    top: '-20px',
    right: '0',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusSmall,
    cursor: 'pointer',
    zIndex: 10,
    ':hover': {
      backgroundColor: tokens.colorPaletteRedBackground2,
      borderColor: tokens.colorPaletteRedBorder2,
      color: tokens.colorPaletteRedForeground2,
    },
  },
  childrenContainer: {
    minHeight: '40px',
    padding: tokens.spacingVerticalS,
  },
  emptyContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60px',
    border: `2px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorNeutralForeground3,
    margin: tokens.spacingVerticalXS,
  },
});

interface CanvasComponentProps {
  component: DesignerComponent;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onDelete: (id: string) => void;
  renderChildren: (children: DesignerComponent[]) => React.ReactNode;
  parentId?: string;
}

export function CanvasComponent({
  component,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onDelete,
  renderChildren,
  parentId,
}: CanvasComponentProps) {
  const styles = useStyles();
  const definition = componentDefinitions[component.type];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: component.id,
    data: {
      type: 'canvas-component',
      component,
      parentId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(component.id);
  };

  const handleMouseEnter = () => {
    if (!isDragging) {
      onHover(component.id);
    }
  };

  const handleMouseLeave = () => {
    if (!isDragging) {
      onHover(null);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(component.id);
  };

  const wrapperClasses = [
    styles.wrapper,
    isHovered && !isSelected ? styles.wrapperHovered : '',
    isSelected ? styles.wrapperSelected : '',
    isDragging ? styles.wrapperDragging : '',
  ]
    .filter(Boolean)
    .join(' ');

  // For container components, we need to handle children specially
  const supportsChildren = definition?.supportsChildren ?? false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={wrapperClasses}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...attributes}
      {...listeners}
    >
      {isSelected && (
        <>
          <span className={styles.label}>{definition?.displayName ?? component.type}</span>
          <button className={styles.deleteButton} onClick={handleDelete}>
            <Delete20Regular />
          </button>
        </>
      )}

      <ComponentRenderer
        component={component}
        renderChildren={
          supportsChildren
            ? (children) => {
                if (!children || children.length === 0) {
                  return (
                    <div className={styles.emptyContainer}>
                      <Text size={200}>Drop components here</Text>
                    </div>
                  );
                }
                return <div className={styles.childrenContainer}>{renderChildren(children)}</div>;
              }
            : undefined
        }
      />
    </div>
  );
}
