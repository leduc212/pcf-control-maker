import {
  makeStyles,
  tokens,
  Text,
  Dropdown,
  Option,
  Field,
  Badge,
  Checkbox,
  Button,
} from '@fluentui/react-components';
import { Add20Regular, Delete20Regular } from '@fluentui/react-icons';
import type {
  DesignerComponent,
  DesignerProperty,
  ComponentBinding,
} from '../../../../shared/types/designer.types';
import { componentDefinitions } from '../shared/componentDefinitions';
import { isComponentCompatible, propertyTypeLabels } from '../shared';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  binding: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  bindingHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyState: {
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
    padding: tokens.spacingVerticalM,
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  propertyOption: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  noBindable: {
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
    padding: tokens.spacingVerticalL,
  },
});

interface BindingEditorProps {
  component: DesignerComponent;
  properties: DesignerProperty[];
  onUpdateBindings: (bindings: ComponentBinding[]) => void;
}

export function BindingEditor({
  component,
  properties,
  onUpdateBindings,
}: BindingEditorProps) {
  const styles = useStyles();
  const definition = componentDefinitions[component.type];
  const bindings = component.bindings ?? [];

  // Get bindable props for this component
  const bindableProps = definition?.bindableProps ?? [];

  if (bindableProps.length === 0) {
    return (
      <div className={styles.noBindable}>
        <Text size={200}>This component has no bindable properties</Text>
      </div>
    );
  }

  // Get properties that are compatible with this component
  const getCompatibleProperties = (bindableProp: string) => {
    return properties.filter((prop) => isComponentCompatible(component.type, prop.ofType));
  };

  const handleAddBinding = (bindableProp: string) => {
    const compatibleProps = getCompatibleProperties(bindableProp);
    if (compatibleProps.length === 0) return;

    const newBinding: ComponentBinding = {
      property: bindableProp,
      source: compatibleProps[0].usage,
      field: compatibleProps[0].name,
    };

    onUpdateBindings([...bindings, newBinding]);
  };

  const handleRemoveBinding = (index: number) => {
    const newBindings = [...bindings];
    newBindings.splice(index, 1);
    onUpdateBindings(newBindings);
  };

  const handleUpdateBinding = (index: number, updates: Partial<ComponentBinding>) => {
    const newBindings = [...bindings];
    newBindings[index] = { ...newBindings[index], ...updates };
    onUpdateBindings(newBindings);
  };

  // Find which bindable props don't have bindings yet
  const unboundProps = bindableProps.filter(
    (prop) => !bindings.some((b) => b.property === prop)
  );

  return (
    <div className={styles.container}>
      {bindings.map((binding, index) => {
        const compatibleProps = getCompatibleProperties(binding.property);
        const boundProperty = properties.find((p) => p.name === binding.field);

        return (
          <div key={index} className={styles.binding}>
            <div className={styles.bindingHeader}>
              <Text weight="semibold" size={200}>
                {binding.property}
              </Text>
              <Button
                appearance="subtle"
                size="small"
                icon={<Delete20Regular />}
                onClick={() => handleRemoveBinding(index)}
              />
            </div>

            <Field label="Bind to property" size="small">
              <Dropdown
                size="small"
                value={boundProperty?.displayName ?? 'Select...'}
                selectedOptions={binding.field ? [binding.field] : []}
                onOptionSelect={(_, data) => {
                  const prop = properties.find((p) => p.name === data.optionValue);
                  if (prop) {
                    handleUpdateBinding(index, {
                      field: prop.name,
                      source: prop.usage,
                    });
                  }
                }}
              >
                {compatibleProps.length === 0 ? (
                  <Option value="" disabled>
                    No compatible properties
                  </Option>
                ) : (
                  compatibleProps.map((prop) => (
                    <Option key={prop.name} value={prop.name}>
                      <div className={styles.propertyOption}>
                        <span>{prop.displayName}</span>
                        <Badge appearance="outline" size="tiny">
                          {propertyTypeLabels[prop.ofType]}
                        </Badge>
                      </div>
                    </Option>
                  ))
                )}
              </Dropdown>
            </Field>
          </div>
        );
      })}

      {unboundProps.length > 0 && (
        <div>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Available bindings:
          </Text>
          {unboundProps.map((prop) => {
            const compatibleProps = getCompatibleProperties(prop);
            const hasCompatible = compatibleProps.length > 0;

            return (
              <Button
                key={prop}
                appearance="subtle"
                size="small"
                icon={<Add20Regular />}
                disabled={!hasCompatible}
                onClick={() => handleAddBinding(prop)}
                style={{ marginTop: tokens.spacingVerticalXS }}
              >
                Bind "{prop}"
                {!hasCompatible && ' (no compatible properties)'}
              </Button>
            );
          })}
        </div>
      )}

      {properties.length === 0 && (
        <div className={styles.emptyState}>
          <Text size={200}>
            Add PCF properties in the left panel to create bindings
          </Text>
        </div>
      )}
    </div>
  );
}
