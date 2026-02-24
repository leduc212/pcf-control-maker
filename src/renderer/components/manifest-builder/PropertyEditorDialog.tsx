import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Field,
  Select,
  Switch,
  Textarea,
  Text,
  tokens,
  Divider,
  makeStyles,
} from '@fluentui/react-components';
import type { ManifestProperty, PCFPropertyType, PCFPropertyUsage, EnumValue } from '../../../shared/types/manifest.types';
import {
  MANIFEST_PROPERTY_TYPES,
  PROPERTY_TYPE_MAP,
  PROPERTY_USAGE_OPTIONS,
  PROPERTY_TYPES_BY_CATEGORY,
} from '../../../shared/constants/manifest.constants';

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
  typeSection: {
    backgroundColor: tokens.colorNeutralBackground3,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    marginTop: tokens.spacingVerticalS,
  },
  enumSection: {
    marginTop: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
  enumItem: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 80px auto',
    gap: tokens.spacingHorizontalS,
    alignItems: 'end',
    marginBottom: tokens.spacingVerticalS,
  },
  hint: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

interface PropertyEditorDialogProps {
  open: boolean;
  property?: ManifestProperty | null;
  existingNames: string[];
  onSave: (property: ManifestProperty) => void;
  onClose: () => void;
}

const generateId = () => `prop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function PropertyEditorDialog({
  open,
  property,
  existingNames,
  onSave,
  onClose,
}: PropertyEditorDialogProps) {
  const styles = useStyles();
  const isEditing = !!property;

  const [formData, setFormData] = useState<ManifestProperty>({
    id: '',
    name: '',
    displayName: '',
    description: '',
    ofType: 'SingleLine.Text',
    usage: 'bound',
    required: false,
    defaultValue: '',
    enumValues: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (property) {
      setFormData({ ...property });
    } else {
      setFormData({
        id: generateId(),
        name: '',
        displayName: '',
        description: '',
        ofType: 'SingleLine.Text',
        usage: 'bound',
        required: false,
        defaultValue: '',
        enumValues: [],
      });
    }
    setErrors({});
  }, [property, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = 'Name is required';
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(formData.name)) {
      newErrors.name = 'Name must start with a letter and contain only letters, numbers, and underscores';
    } else if (!isEditing && existingNames.includes(formData.name)) {
      newErrors.name = 'A property with this name already exists';
    }

    if (!formData.displayName) {
      newErrors.displayName = 'Display name is required';
    }

    if (formData.ofType === 'Enum' && (!formData.enumValues || formData.enumValues.length === 0)) {
      newErrors.enumValues = 'At least one enum value is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  const updateField = <K extends keyof ManifestProperty>(field: K, value: ManifestProperty[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const typeInfo = PROPERTY_TYPE_MAP[formData.ofType];

  const addEnumValue = () => {
    const newEnum: EnumValue = {
      name: `value${(formData.enumValues?.length || 0) + 1}`,
      displayName: `Value ${(formData.enumValues?.length || 0) + 1}`,
      value: String((formData.enumValues?.length || 0) + 1),
    };
    updateField('enumValues', [...(formData.enumValues || []), newEnum]);
  };

  const updateEnumValue = (index: number, updates: Partial<EnumValue>) => {
    const newEnums = [...(formData.enumValues || [])];
    newEnums[index] = { ...newEnums[index], ...updates };
    updateField('enumValues', newEnums);
  };

  const removeEnumValue = (index: number) => {
    const newEnums = (formData.enumValues || []).filter((_, i) => i !== index);
    updateField('enumValues', newEnums);
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface style={{ maxWidth: '600px', width: '100%' }}>
        <DialogBody>
          <DialogTitle>{isEditing ? 'Edit Property' : 'Add Property'}</DialogTitle>
          <DialogContent>
            <div className={styles.form}>
              <div className={styles.row}>
                <Field
                  label="Property Name"
                  required
                  validationMessage={errors.name}
                  validationState={errors.name ? 'error' : undefined}
                  hint="Internal name used in code"
                >
                  <Input
                    value={formData.name}
                    onChange={(_, data) => updateField('name', data.value)}
                    placeholder="myProperty"
                    disabled={isEditing}
                  />
                </Field>

                <Field
                  label="Display Name"
                  required
                  validationMessage={errors.displayName}
                  validationState={errors.displayName ? 'error' : undefined}
                  hint="Shown in the form editor"
                >
                  <Input
                    value={formData.displayName}
                    onChange={(_, data) => updateField('displayName', data.value)}
                    placeholder="My Property"
                  />
                </Field>
              </div>

              <Field label="Description" hint="Describes the property's purpose">
                <Textarea
                  value={formData.description}
                  onChange={(_, data) => updateField('description', data.value)}
                  placeholder="Enter a description..."
                  resize="vertical"
                  rows={2}
                />
              </Field>

              <Divider />

              <div className={styles.row}>
                <Field label="Property Type" required>
                  <Select
                    value={formData.ofType}
                    onChange={(_, data) => updateField('ofType', data.value as PCFPropertyType)}
                  >
                    <optgroup label="String Types">
                      {PROPERTY_TYPES_BY_CATEGORY.string.map((t) => (
                        <option key={t.type} value={t.type}>
                          {t.displayName}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Number Types">
                      {PROPERTY_TYPES_BY_CATEGORY.number.map((t) => (
                        <option key={t.type} value={t.type}>
                          {t.displayName}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Date Types">
                      {PROPERTY_TYPES_BY_CATEGORY.date.map((t) => (
                        <option key={t.type} value={t.type}>
                          {t.displayName}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Choice Types">
                      {PROPERTY_TYPES_BY_CATEGORY.choice.map((t) => (
                        <option key={t.type} value={t.type}>
                          {t.displayName}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Other Types">
                      {PROPERTY_TYPES_BY_CATEGORY.other.map((t) => (
                        <option key={t.type} value={t.type}>
                          {t.displayName}
                        </option>
                      ))}
                    </optgroup>
                  </Select>
                </Field>

                <Field label="Usage" required hint="How the property is used">
                  <Select
                    value={formData.usage}
                    onChange={(_, data) => updateField('usage', data.value as PCFPropertyUsage)}
                  >
                    {PROPERTY_USAGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              {typeInfo && (
                <div className={styles.typeSection}>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    {typeInfo.description}
                  </Text>
                </div>
              )}

              <div className={styles.row}>
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                  <Switch
                    checked={formData.required}
                    onChange={(_, data) => updateField('required', data.checked)}
                  />
                  <Text>Required property</Text>
                </div>

                {typeInfo?.supportsDefaultValue && (
                  <Field label="Default Value">
                    {typeInfo.defaultValueType === 'boolean' ? (
                      <Select
                        value={formData.defaultValue || 'false'}
                        onChange={(_, data) => updateField('defaultValue', data.value)}
                      >
                        <option value="true">Yes / True</option>
                        <option value="false">No / False</option>
                      </Select>
                    ) : (
                      <Input
                        type={typeInfo.defaultValueType === 'number' ? 'number' : 'text'}
                        value={formData.defaultValue || ''}
                        onChange={(_, data) => updateField('defaultValue', data.value)}
                        placeholder="Enter default value"
                      />
                    )}
                  </Field>
                )}
              </div>

              {formData.ofType === 'Enum' && (
                <div className={styles.enumSection}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacingVerticalS }}>
                    <Text weight="semibold">Enum Values</Text>
                    <Button size="small" onClick={addEnumValue}>
                      Add Value
                    </Button>
                  </div>
                  {errors.enumValues && (
                    <Text size={200} style={{ color: tokens.colorPaletteRedForeground1, marginBottom: tokens.spacingVerticalS, display: 'block' }}>
                      {errors.enumValues}
                    </Text>
                  )}
                  {(formData.enumValues || []).map((enumVal, index) => (
                    <div key={index} className={styles.enumItem}>
                      <Field label={index === 0 ? 'Name' : undefined}>
                        <Input
                          size="small"
                          value={enumVal.name}
                          onChange={(_, data) => updateEnumValue(index, { name: data.value })}
                          placeholder="valueName"
                        />
                      </Field>
                      <Field label={index === 0 ? 'Display Name' : undefined}>
                        <Input
                          size="small"
                          value={enumVal.displayName}
                          onChange={(_, data) => updateEnumValue(index, { displayName: data.value })}
                          placeholder="Value Name"
                        />
                      </Field>
                      <Field label={index === 0 ? 'Value' : undefined}>
                        <Input
                          size="small"
                          value={enumVal.value}
                          onChange={(_, data) => updateEnumValue(index, { value: data.value })}
                          placeholder="1"
                        />
                      </Field>
                      <Button
                        size="small"
                        appearance="subtle"
                        onClick={() => removeEnumValue(index)}
                        style={{ marginTop: index === 0 ? '22px' : 0 }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleSave}>
              {isEditing ? 'Save Changes' : 'Add Property'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
