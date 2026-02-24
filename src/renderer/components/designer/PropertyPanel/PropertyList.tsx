import {
  makeStyles,
  tokens,
  Text,
  Button,
  Badge,
  Tooltip,
} from '@fluentui/react-components';
import {
  Edit20Regular,
  Delete20Regular,
  ChevronRight20Regular,
} from '@fluentui/react-icons';
import type { DesignerProperty } from '../../../../shared/types/designer.types';
import { propertyTypeLabels, getRecommendedComponent } from '../shared';
import { PropertyFormDialog } from './PropertyFormDialog';

const useStyles = makeStyles({
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalS,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      borderColor: tokens.colorNeutralStroke1Hover,
    },
  },
  itemSelected: {
    borderColor: tokens.colorBrandStroke1,
    backgroundColor: tokens.colorBrandBackground2,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  itemName: {
    fontWeight: tokens.fontWeightSemibold,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXXS,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    opacity: 0,
    transition: 'opacity 0.1s',
  },
  itemHover: {
    ':hover': {
      '& .property-actions': {
        opacity: 1,
      },
    },
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXL,
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
  },
  usageBadge: {
    textTransform: 'capitalize',
  },
});

interface PropertyListProps {
  properties: DesignerProperty[];
  selectedProperty?: string;
  onSelect?: (name: string) => void;
  onUpdate: (name: string, property: DesignerProperty) => void;
  onDelete: (name: string) => void;
}

export function PropertyList({
  properties,
  selectedProperty,
  onSelect,
  onUpdate,
  onDelete,
}: PropertyListProps) {
  const styles = useStyles();

  if (properties.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text size={200}>No properties defined</Text>
        <Text size={200}>Add properties to bind your control to Dataverse fields</Text>
      </div>
    );
  }

  const getUsageColor = (usage: string): 'informative' | 'success' | 'warning' => {
    switch (usage) {
      case 'bound':
        return 'success';
      case 'input':
        return 'informative';
      case 'output':
        return 'warning';
      default:
        return 'informative';
    }
  };

  return (
    <div className={styles.list}>
      {properties.map((property) => {
        const isSelected = selectedProperty === property.name;
        const recommendedComponent = getRecommendedComponent(property.ofType);

        return (
          <div
            key={property.name}
            className={`${styles.item} ${isSelected ? styles.itemSelected : ''} ${styles.itemHover}`}
            onClick={() => onSelect?.(property.name)}
          >
            <div className={styles.itemContent}>
              <div className={styles.itemHeader}>
                <Text className={styles.itemName} size={300}>
                  {property.displayName}
                </Text>
                {property.required && (
                  <Text size={200} style={{ color: tokens.colorPaletteRedForeground1 }}>
                    *
                  </Text>
                )}
              </div>
              <div className={styles.itemMeta}>
                <Badge
                  appearance="outline"
                  size="small"
                  color={getUsageColor(property.usage)}
                  className={styles.usageBadge}
                >
                  {property.usage}
                </Badge>
                <ChevronRight20Regular style={{ color: tokens.colorNeutralForeground4 }} />
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  {propertyTypeLabels[property.ofType]}
                </Text>
              </div>
            </div>

            <div className={`${styles.actions} property-actions`}>
              <PropertyFormDialog
                property={property}
                existingNames={properties.map((p) => p.name)}
                onSave={(updated) => onUpdate(property.name, updated)}
                trigger={
                  <Tooltip content="Edit" relationship="label">
                    <Button
                      appearance="subtle"
                      icon={<Edit20Regular />}
                      size="small"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Tooltip>
                }
              />
              <Tooltip content="Delete" relationship="label">
                <Button
                  appearance="subtle"
                  icon={<Delete20Regular />}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(property.name);
                  }}
                />
              </Tooltip>
            </div>
          </div>
        );
      })}
    </div>
  );
}
