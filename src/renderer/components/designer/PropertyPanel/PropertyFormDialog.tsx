import { useState, useEffect } from 'react';
import {
  makeStyles,
  tokens,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Input,
  Textarea,
  Field,
  Dropdown,
  Option,
  Checkbox,
  Text,
  Badge,
} from '@fluentui/react-components';
import { Add24Regular } from '@fluentui/react-icons';
import type { DesignerProperty, PropertyType } from '../../../../shared/types/designer.types';
import { propertyTypeLabels, propertyTypeCategories, getRecommendedComponent } from '../shared';
import { componentDefinitions } from '../shared/componentDefinitions';

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
  },
  suggestion: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
  categoryLabel: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
  },
});

interface PropertyFormDialogProps {
  property?: DesignerProperty;
  existingNames: string[];
  onSave: (property: DesignerProperty) => void;
  trigger?: React.ReactNode;
}

const emptyProperty: DesignerProperty = {
  name: '',
  displayName: '',
  description: '',
  ofType: 'SingleLine.Text',
  usage: 'bound',
  required: false,
  defaultValue: undefined,
};

export function PropertyFormDialog({
  property,
  existingNames,
  onSave,
  trigger,
}: PropertyFormDialogProps) {
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<DesignerProperty>(property ?? emptyProperty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setFormData(property ?? emptyProperty);
      setErrors({});
    }
  }, [open, property]);

  const isEditing = !!property;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(formData.name)) {
      newErrors.name = 'Name must start with a letter and contain only letters and numbers';
    } else if (!isEditing && existingNames.includes(formData.name)) {
      newErrors.name = 'A property with this name already exists';
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(formData);
      setOpen(false);
    }
  };

  const recommendedComponent = getRecommendedComponent(formData.ofType);
  const componentDef = componentDefinitions[recommendedComponent];

  // Group property types by category
  const propertyTypeOptions = Object.entries(propertyTypeCategories).flatMap(([category, types]) => [
    { type: 'category', label: category.charAt(0).toUpperCase() + category.slice(1) },
    ...types.map((type) => ({ type: 'option', value: type, label: propertyTypeLabels[type] })),
  ]);

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        {trigger ?? (
          <Button appearance="primary" icon={<Add24Regular />} size="small">
            Add Property
          </Button>
        )}
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{isEditing ? 'Edit Property' : 'Add Property'}</DialogTitle>
          <DialogContent>
            <div className={styles.form}>
              <div className={styles.row}>
                <Field
                  label="Name"
                  required
                  validationMessage={errors.name}
                  validationState={errors.name ? 'error' : undefined}
                >
                  <Input
                    value={formData.name}
                    onChange={(_, data) =>
                      setFormData({ ...formData, name: data.value })
                    }
                    placeholder="propertyName"
                    disabled={isEditing}
                  />
                </Field>

                <Field
                  label="Display Name"
                  required
                  validationMessage={errors.displayName}
                  validationState={errors.displayName ? 'error' : undefined}
                >
                  <Input
                    value={formData.displayName}
                    onChange={(_, data) =>
                      setFormData({ ...formData, displayName: data.value })
                    }
                    placeholder="Property Name"
                  />
                </Field>
              </div>

              <Field label="Description">
                <Textarea
                  value={formData.description ?? ''}
                  onChange={(_, data) =>
                    setFormData({ ...formData, description: data.value })
                  }
                  placeholder="Describe this property..."
                  resize="vertical"
                  rows={2}
                />
              </Field>

              <div className={styles.row}>
                <Field label="Type" required>
                  <Dropdown
                    value={propertyTypeLabels[formData.ofType]}
                    selectedOptions={[formData.ofType]}
                    onOptionSelect={(_, data) =>
                      setFormData({
                        ...formData,
                        ofType: data.optionValue as PropertyType,
                      })
                    }
                  >
                    {propertyTypeOptions.map((item, index) =>
                      item.type === 'category' ? (
                        <div key={index} className={styles.categoryLabel}>
                          {item.label}
                        </div>
                      ) : (
                        <Option key={item.value} value={item.value}>
                          {item.label}
                        </Option>
                      )
                    )}
                  </Dropdown>
                </Field>

                <Field label="Usage" required>
                  <Dropdown
                    value={formData.usage.charAt(0).toUpperCase() + formData.usage.slice(1)}
                    selectedOptions={[formData.usage]}
                    onOptionSelect={(_, data) =>
                      setFormData({
                        ...formData,
                        usage: data.optionValue as 'input' | 'output' | 'bound',
                      })
                    }
                  >
                    <Option value="bound">Bound</Option>
                    <Option value="input">Input</Option>
                    <Option value="output">Output</Option>
                  </Dropdown>
                </Field>
              </div>

              <Checkbox
                checked={formData.required ?? false}
                onChange={(_, data) =>
                  setFormData({ ...formData, required: data.checked as boolean })
                }
                label="Required property"
              />

              <div className={styles.suggestion}>
                <Text size={200}>Recommended component:</Text>
                <Badge appearance="tint" color="brand">
                  {componentDef?.displayName ?? recommendedComponent}
                </Badge>
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancel</Button>
            </DialogTrigger>
            <Button appearance="primary" onClick={handleSave}>
              {isEditing ? 'Save Changes' : 'Add Property'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
