import { useState } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Text,
  Card,
  Badge,
  Tooltip,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  MoreVertical24Regular,
  ArrowUp24Regular,
  ArrowDown24Regular,
  Copy24Regular,
} from '@fluentui/react-icons';
import type { ManifestProperty } from '../../../shared/types/manifest.types';
import { PROPERTY_TYPE_MAP } from '../../../shared/constants/manifest.constants';
import PropertyEditorDialog from './PropertyEditorDialog';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalS,
  },
  emptyState: {
    padding: tokens.spacingVerticalXXL,
    textAlign: 'center',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
  propertyItem: {
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  propertyItemSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    ':hover': {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
  propertyInfo: {
    flex: 1,
    minWidth: 0,
  },
  propertyName: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  propertyMeta: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalXS,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    opacity: 0,
    transition: 'opacity 0.15s ease',
  },
  propertyItemHover: {
    ':hover .property-actions': {
      opacity: 1,
    },
  },
});

interface PropertyListProps {
  properties: ManifestProperty[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (property: ManifestProperty) => void;
  onUpdate: (id: string, updates: Partial<ManifestProperty>) => void;
  onRemove: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export default function PropertyList({
  properties,
  selectedId,
  onSelect,
  onAdd,
  onUpdate,
  onRemove,
  onReorder,
}: PropertyListProps) {
  const styles = useStyles();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<ManifestProperty | null>(null);

  const handleAddNew = () => {
    setEditingProperty(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (property: ManifestProperty) => {
    setEditingProperty(property);
    setIsEditorOpen(true);
  };

  const handleSave = (property: ManifestProperty) => {
    if (editingProperty) {
      onUpdate(property.id, property);
    } else {
      onAdd(property);
    }
    setIsEditorOpen(false);
  };

  const handleDuplicate = (property: ManifestProperty) => {
    const newProperty: ManifestProperty = {
      ...property,
      id: `prop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${property.name}Copy`,
      displayName: `${property.displayName} (Copy)`,
    };
    onAdd(newProperty);
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      onReorder(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < properties.length - 1) {
      onReorder(index, index + 1);
    }
  };

  const existingNames = properties
    .filter((p) => p.id !== editingProperty?.id)
    .map((p) => p.name);

  const getUsageBadgeColor = (usage: string): 'brand' | 'success' | 'warning' => {
    switch (usage) {
      case 'bound':
        return 'brand';
      case 'input':
        return 'success';
      case 'output':
        return 'warning';
      default:
        return 'brand';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={500} weight="semibold">
          Properties ({properties.length})
        </Text>
        <Button appearance="primary" icon={<Add24Regular />} onClick={handleAddNew}>
          Add Property
        </Button>
      </div>

      {properties.length === 0 ? (
        <div className={styles.emptyState}>
          <Text size={400} weight="medium" block style={{ marginBottom: tokens.spacingVerticalS }}>
            No properties defined
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
            Add properties to define the inputs and outputs of your control
          </Text>
        </div>
      ) : (
        properties.map((property, index) => {
          const typeInfo = PROPERTY_TYPE_MAP[property.ofType];
          const isSelected = selectedId === property.id;

          return (
            <Card
              key={property.id}
              className={`${styles.propertyItem} ${isSelected ? styles.propertyItemSelected : ''}`}
              onClick={() => onSelect(isSelected ? null : property.id)}
            >
              <div className={styles.propertyInfo}>
                <div className={styles.propertyName}>
                  <Text weight="semibold">{property.displayName}</Text>
                  {property.required && (
                    <Badge appearance="filled" color="danger" size="small">
                      Required
                    </Badge>
                  )}
                </div>
                <div className={styles.propertyMeta}>
                  <Badge appearance="outline" size="small" color={getUsageBadgeColor(property.usage)}>
                    {property.usage}
                  </Badge>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    {property.name}
                  </Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    • {typeInfo?.displayName || property.ofType}
                  </Text>
                </div>
              </div>

              <div
                className={styles.actions}
                style={{ opacity: isSelected ? 1 : undefined }}
                onClick={(e) => e.stopPropagation()}
              >
                <Tooltip content="Move up" relationship="label">
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<ArrowUp24Regular />}
                    disabled={index === 0}
                    onClick={() => handleMoveUp(index)}
                  />
                </Tooltip>
                <Tooltip content="Move down" relationship="label">
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<ArrowDown24Regular />}
                    disabled={index === properties.length - 1}
                    onClick={() => handleMoveDown(index)}
                  />
                </Tooltip>
                <Tooltip content="Edit" relationship="label">
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<Edit24Regular />}
                    onClick={() => handleEdit(property)}
                  />
                </Tooltip>
                <Menu>
                  <MenuTrigger disableButtonEnhancement>
                    <Button appearance="subtle" size="small" icon={<MoreVertical24Regular />} />
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      <MenuItem icon={<Copy24Regular />} onClick={() => handleDuplicate(property)}>
                        Duplicate
                      </MenuItem>
                      <MenuItem icon={<Delete24Regular />} onClick={() => onRemove(property.id)}>
                        Delete
                      </MenuItem>
                    </MenuList>
                  </MenuPopover>
                </Menu>
              </div>
            </Card>
          );
        })
      )}

      <PropertyEditorDialog
        open={isEditorOpen}
        property={editingProperty}
        existingNames={existingNames}
        onSave={handleSave}
        onClose={() => setIsEditorOpen(false)}
      />
    </div>
  );
}
