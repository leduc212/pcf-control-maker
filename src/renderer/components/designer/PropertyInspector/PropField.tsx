import {
  Input,
  Dropdown,
  Option,
  Checkbox,
  Field,
  SpinButton,
} from '@fluentui/react-components';
import type { PropDefinition } from '../../../../shared/types/designer.types';

interface PropFieldProps {
  definition: PropDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function PropField({ definition, value, onChange }: PropFieldProps) {
  const { name, displayName, type, options, defaultValue } = definition;

  switch (type) {
    case 'string':
      return (
        <Field label={displayName} size="small">
          <Input
            size="small"
            value={(value as string) ?? (defaultValue as string) ?? ''}
            onChange={(_, data) => onChange(data.value)}
          />
        </Field>
      );

    case 'number':
      return (
        <Field label={displayName} size="small">
          <SpinButton
            size="small"
            value={(value as number) ?? (defaultValue as number) ?? 0}
            onChange={(_, data) => onChange(data.value ?? 0)}
          />
        </Field>
      );

    case 'boolean':
      return (
        <Checkbox
          label={displayName}
          checked={(value as boolean) ?? (defaultValue as boolean) ?? false}
          onChange={(_, data) => onChange(data.checked)}
        />
      );

    case 'enum':
      const selectedValue = (value as string) ?? (defaultValue as string) ?? options?.[0] ?? '';
      return (
        <Field label={displayName} size="small">
          <Dropdown
            size="small"
            value={selectedValue}
            selectedOptions={[selectedValue]}
            onOptionSelect={(_, data) => onChange(data.optionValue)}
          >
            {options?.map((opt) => (
              <Option key={opt} value={opt}>
                {opt}
              </Option>
            ))}
          </Dropdown>
        </Field>
      );

    case 'color':
      return (
        <Field label={displayName} size="small">
          <Input
            size="small"
            type="color"
            value={(value as string) ?? (defaultValue as string) ?? '#000000'}
            onChange={(_, data) => onChange(data.value)}
          />
        </Field>
      );

    default:
      return (
        <Field label={displayName} size="small">
          <Input
            size="small"
            value={String(value ?? defaultValue ?? '')}
            onChange={(_, data) => onChange(data.value)}
          />
        </Field>
      );
  }
}
