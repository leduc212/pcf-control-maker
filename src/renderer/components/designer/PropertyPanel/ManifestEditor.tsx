import {
  makeStyles,
  tokens,
  Input,
  Label,
  Textarea,
  Field,
} from '@fluentui/react-components';
import { useDesignerStore } from '../../../stores/designer.store';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalL,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    marginBottom: tokens.spacingVerticalM,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
});

export function ManifestEditor() {
  const styles = useStyles();
  const { manifest, setManifest } = useDesignerStore();

  return (
    <div className={styles.container}>
      <Field label="Namespace" required>
        <Input
          value={manifest.namespace}
          onChange={(_, data) => setManifest({ namespace: data.value })}
          placeholder="e.g., Contoso.Controls"
        />
      </Field>

      <Field label="Constructor Name" required>
        <Input
          value={manifest.constructor}
          onChange={(_, data) => setManifest({ constructor: data.value })}
          placeholder="e.g., MyCustomControl"
        />
      </Field>

      <Field label="Display Name" required>
        <Input
          value={manifest.displayName}
          onChange={(_, data) => setManifest({ displayName: data.value })}
          placeholder="e.g., My Custom Control"
        />
      </Field>

      <Field label="Description">
        <Textarea
          value={manifest.description}
          onChange={(_, data) => setManifest({ description: data.value })}
          placeholder="Describe what this control does..."
          resize="vertical"
          rows={2}
        />
      </Field>
    </div>
  );
}
