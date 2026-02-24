import {
  makeStyles,
  tokens,
  Input,
  Field,
  Dropdown,
  Option,
} from '@fluentui/react-components';
import type { DesignerComponent, LayoutConfig } from '../../../../shared/types/designer.types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalS,
  },
});

interface StyleEditorProps {
  component: DesignerComponent;
  onUpdateLayout: (layout: LayoutConfig) => void;
}

export function StyleEditor({ component, onUpdateLayout }: StyleEditorProps) {
  const styles = useStyles();
  const layout = component.layout ?? {};

  const handleChange = (key: keyof LayoutConfig, value: string | number | undefined) => {
    onUpdateLayout({
      ...layout,
      [key]: value || undefined,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <Field label="Width" size="small">
          <Input
            size="small"
            value={(layout.width as string) ?? ''}
            onChange={(_, data) => handleChange('width', data.value)}
            placeholder="e.g., 100%, 200px"
          />
        </Field>

        <Field label="Height" size="small">
          <Input
            size="small"
            value={(layout.height as string) ?? ''}
            onChange={(_, data) => handleChange('height', data.value)}
            placeholder="e.g., auto, 100px"
          />
        </Field>
      </div>

      <div className={styles.row}>
        <Field label="Margin" size="small">
          <Input
            size="small"
            value={(layout.margin as string) ?? ''}
            onChange={(_, data) => handleChange('margin', data.value)}
            placeholder="e.g., 8px, 0 16px"
          />
        </Field>

        <Field label="Padding" size="small">
          <Input
            size="small"
            value={(layout.padding as string) ?? ''}
            onChange={(_, data) => handleChange('padding', data.value)}
            placeholder="e.g., 8px, 0 16px"
          />
        </Field>
      </div>

      <Field label="Display" size="small">
        <Dropdown
          size="small"
          value={layout.display ?? 'block'}
          selectedOptions={[layout.display ?? 'block']}
          onOptionSelect={(_, data) =>
            handleChange('display', data.optionValue as LayoutConfig['display'])
          }
        >
          <Option value="block">Block</Option>
          <Option value="flex">Flex</Option>
          <Option value="grid">Grid</Option>
        </Dropdown>
      </Field>

      {layout.display === 'flex' && (
        <>
          <div className={styles.row}>
            <Field label="Direction" size="small">
              <Dropdown
                size="small"
                value={layout.flexDirection ?? 'row'}
                selectedOptions={[layout.flexDirection ?? 'row']}
                onOptionSelect={(_, data) =>
                  handleChange('flexDirection', data.optionValue as LayoutConfig['flexDirection'])
                }
              >
                <Option value="row">Row</Option>
                <Option value="column">Column</Option>
              </Dropdown>
            </Field>

            <Field label="Gap" size="small">
              <Input
                size="small"
                value={(layout.gap as string) ?? ''}
                onChange={(_, data) => handleChange('gap', data.value)}
                placeholder="e.g., 8px"
              />
            </Field>
          </div>

          <div className={styles.row}>
            <Field label="Align Items" size="small">
              <Dropdown
                size="small"
                value={layout.alignItems ?? 'stretch'}
                selectedOptions={[layout.alignItems ?? 'stretch']}
                onOptionSelect={(_, data) => handleChange('alignItems', data.optionValue)}
              >
                <Option value="stretch">Stretch</Option>
                <Option value="flex-start">Start</Option>
                <Option value="center">Center</Option>
                <Option value="flex-end">End</Option>
              </Dropdown>
            </Field>

            <Field label="Justify Content" size="small">
              <Dropdown
                size="small"
                value={layout.justifyContent ?? 'flex-start'}
                selectedOptions={[layout.justifyContent ?? 'flex-start']}
                onOptionSelect={(_, data) => handleChange('justifyContent', data.optionValue)}
              >
                <Option value="flex-start">Start</Option>
                <Option value="center">Center</Option>
                <Option value="flex-end">End</Option>
                <Option value="space-between">Space Between</Option>
                <Option value="space-around">Space Around</Option>
              </Dropdown>
            </Field>
          </div>
        </>
      )}
    </div>
  );
}
