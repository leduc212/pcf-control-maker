import {
  makeStyles,
  tokens,
  Card,
  Text,
  Input,
  Field,
  Select,
  Textarea,
} from '@fluentui/react-components';
import type { PCFManifest } from '../../../shared/types/manifest.types';
import { CONTROL_TYPE_OPTIONS } from '../../../shared/constants/manifest.constants';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  card: {
    padding: tokens.spacingHorizontalL,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

interface ControlInfoPanelProps {
  control: PCFManifest['control'];
  onChange: (updates: Partial<PCFManifest['control']>) => void;
}

export default function ControlInfoPanel({ control, onChange }: ControlInfoPanelProps) {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <Text size={500} weight="semibold">
        Control Information
      </Text>
      <Card className={styles.card}>
        <div className={styles.container}>
          <div className={styles.row}>
            <Field
              label="Namespace"
              required
              hint="Groups your controls (e.g., Contoso.Controls)"
            >
              <Input
                value={control.namespace}
                onChange={(_, data) => onChange({ namespace: data.value })}
                placeholder="MyNamespace"
              />
            </Field>
            <Field
              label="Constructor"
              required
              hint="Class name for the control"
            >
              <Input
                value={control.constructor}
                onChange={(_, data) => onChange({ constructor: data.value })}
                placeholder="MyControl"
              />
            </Field>
          </div>

          <div className={styles.row}>
            <Field
              label="Display Name Key"
              required
              hint="Localization key for display name"
            >
              <Input
                value={control.displayNameKey}
                onChange={(_, data) => onChange({ displayNameKey: data.value })}
                placeholder="MyControl_DisplayName"
              />
            </Field>
            <Field
              label="Version"
              required
              hint="Semantic version (e.g., 1.0.0)"
            >
              <Input
                value={control.version}
                onChange={(_, data) => onChange({ version: data.value })}
                placeholder="1.0.0"
              />
            </Field>
          </div>

          <Field
            label="Description Key"
            hint="Localization key for description"
          >
            <Textarea
              value={control.descriptionKey}
              onChange={(_, data) => onChange({ descriptionKey: data.value })}
              placeholder="A description of your control"
              resize="vertical"
              rows={2}
            />
          </Field>

          <Field
            label="Control Type"
            hint="Type of PCF control"
          >
            <Select
              value={control.controlType}
              onChange={(_, data) => onChange({ controlType: data.value as 'standard' | 'virtual' | 'react' })}
            >
              {CONTROL_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} - {opt.description}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>
    </div>
  );
}
