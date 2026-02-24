import {
  Button,
  Input,
  Textarea,
  Checkbox,
  Switch,
  Dropdown,
  Option,
  Combobox,
  SpinButton,
  Slider,
  Text,
  Label,
  Badge,
  Image,
  Divider,
  Card,
  Spinner,
  ProgressBar,
  MessageBar,
  MessageBarBody,
  Link,
} from '@fluentui/react-components';
import type { DesignerComponent } from '../../../../shared/types/designer.types';

interface ComponentRendererProps {
  component: DesignerComponent;
  renderChildren?: (children: DesignerComponent[]) => React.ReactNode;
}

/**
 * Renders a Fluent UI component based on the designer component definition.
 * This is used both in the canvas and in preview mode.
 */
export function ComponentRenderer({ component, renderChildren }: ComponentRendererProps) {
  const { type, props, children } = component;

  // Helper to render children for container components
  const childrenContent = children && renderChildren ? renderChildren(children) : null;

  switch (type) {
    // ============ INPUTS ============
    case 'Input':
      return (
        <Input
          placeholder={props.placeholder as string}
          appearance={props.appearance as 'outline' | 'underline' | 'filled-darker' | 'filled-lighter'}
          size={props.size as 'small' | 'medium' | 'large'}
          disabled={props.disabled as boolean}
          type={props.type as 'text' | 'password' | 'email' | 'number' | 'tel' | 'url'}
          value={props.value as string ?? ''}
          style={{ width: '100%' }}
        />
      );

    case 'Textarea':
      return (
        <Textarea
          placeholder={props.placeholder as string}
          resize={props.resize as 'none' | 'horizontal' | 'vertical' | 'both'}
          size={props.size as 'small' | 'medium' | 'large'}
          disabled={props.disabled as boolean}
          value={props.value as string ?? ''}
          style={{ width: '100%' }}
        />
      );

    case 'Checkbox':
      return (
        <Checkbox
          label={props.label as string}
          size={props.size as 'medium' | 'large'}
          disabled={props.disabled as boolean}
          checked={props.checked as boolean ?? false}
        />
      );

    case 'Switch':
      return (
        <Switch
          label={props.label as string}
          labelPosition={props.labelPosition as 'above' | 'after' | 'before'}
          disabled={props.disabled as boolean}
          checked={props.checked as boolean ?? false}
        />
      );

    case 'Dropdown':
      return (
        <Dropdown
          placeholder={props.placeholder as string}
          appearance={props.appearance as 'outline' | 'underline' | 'filled-darker' | 'filled-lighter'}
          disabled={props.disabled as boolean}
          multiselect={props.multiselect as boolean}
          style={{ width: '100%' }}
        >
          <Option value="1">Option 1</Option>
          <Option value="2">Option 2</Option>
          <Option value="3">Option 3</Option>
        </Dropdown>
      );

    case 'Combobox':
      return (
        <Combobox
          placeholder={props.placeholder as string}
          appearance={props.appearance as 'outline' | 'underline' | 'filled-darker' | 'filled-lighter'}
          disabled={props.disabled as boolean}
          freeform={props.freeform as boolean}
          style={{ width: '100%' }}
        >
          <Option value="1">Option 1</Option>
          <Option value="2">Option 2</Option>
          <Option value="3">Option 3</Option>
        </Combobox>
      );

    case 'SpinButton':
      return (
        <SpinButton
          min={props.min as number}
          max={props.max as number}
          step={props.step as number}
          disabled={props.disabled as boolean}
          value={props.value as number ?? props.defaultValue as number ?? 0}
          style={{ width: '100%' }}
        />
      );

    case 'Slider':
      return (
        <Slider
          min={props.min as number}
          max={props.max as number}
          step={props.step as number}
          disabled={props.disabled as boolean}
          vertical={props.vertical as boolean}
          value={props.value as number ?? 50}
          style={{ width: props.vertical ? 'auto' : '100%' }}
        />
      );

    // ============ DISPLAY ============
    case 'Text':
      return (
        <Text
          size={props.size as '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '1000' ?? '300'}
          weight={props.weight as 'regular' | 'medium' | 'semibold' | 'bold'}
          align={props.align as 'start' | 'center' | 'end' | 'justify'}
        >
          {props.children as string ?? 'Text'}
        </Text>
      );

    case 'Label':
      return (
        <Label
          size={props.size as 'small' | 'medium' | 'large'}
          weight={props.weight as 'regular' | 'semibold'}
          required={props.required as boolean}
        >
          {props.children as string ?? 'Label'}
        </Label>
      );

    case 'Badge':
      return (
        <Badge
          appearance={props.appearance as 'filled' | 'ghost' | 'outline' | 'tint'}
          color={props.color as 'brand' | 'danger' | 'important' | 'informative' | 'severe' | 'subtle' | 'success' | 'warning'}
          size={props.size as 'tiny' | 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large'}
          shape={props.shape as 'circular' | 'rounded' | 'square'}
        >
          {props.children as string ?? 'Badge'}
        </Badge>
      );

    case 'Image':
      return (
        <Image
          src={props.src as string || 'https://via.placeholder.com/150'}
          alt={props.alt as string}
          fit={props.fit as 'none' | 'center' | 'contain' | 'cover' | 'default'}
          shape={props.shape as 'circular' | 'rounded' | 'square'}
          bordered={props.bordered as boolean}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      );

    case 'Divider':
      return (
        <Divider
          vertical={props.vertical as boolean}
          appearance={props.appearance as 'default' | 'subtle' | 'brand' | 'strong'}
          inset={props.inset as boolean}
          style={{ width: props.vertical ? 'auto' : '100%' }}
        />
      );

    // ============ LAYOUT ============
    case 'Stack':
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: (props.direction as 'row' | 'column') ?? 'column',
            gap: props.gap as string ?? '8px',
            flexWrap: props.wrap ? 'wrap' : 'nowrap',
            alignItems: props.alignItems as string ?? 'stretch',
            justifyContent: props.justifyContent as string ?? 'flex-start',
            width: '100%',
            minHeight: '40px',
          }}
        >
          {childrenContent}
        </div>
      );

    case 'Card':
      return (
        <Card
          appearance={props.appearance as 'filled' | 'filled-alternative' | 'outline' | 'subtle'}
          orientation={props.orientation as 'horizontal' | 'vertical'}
          size={props.size as 'small' | 'medium' | 'large'}
          style={{ width: '100%' }}
        >
          {childrenContent}
        </Card>
      );

    // ============ FEEDBACK ============
    case 'Spinner':
      return (
        <Spinner
          size={props.size as 'extra-tiny' | 'tiny' | 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large' | 'huge'}
          label={props.label as string}
          labelPosition={props.labelPosition as 'above' | 'below' | 'before' | 'after'}
        />
      );

    case 'ProgressBar':
      return (
        <ProgressBar
          value={props.value as number ?? 0.5}
          max={props.max as number ?? 1}
          thickness={props.thickness as 'medium' | 'large'}
          color={props.color as 'brand' | 'error' | 'warning' | 'success'}
          style={{ width: '100%' }}
        />
      );

    case 'MessageBar':
      return (
        <MessageBar
          intent={props.intent as 'info' | 'warning' | 'error' | 'success'}
          shape={props.shape as 'rounded' | 'square'}
          style={{ width: '100%' }}
        >
          <MessageBarBody>{props.children as string ?? 'Message'}</MessageBarBody>
        </MessageBar>
      );

    // ============ ACTIONS ============
    case 'Button':
      return (
        <Button
          appearance={props.appearance as 'secondary' | 'primary' | 'outline' | 'subtle' | 'transparent'}
          size={props.size as 'small' | 'medium' | 'large'}
          shape={props.shape as 'rounded' | 'circular' | 'square'}
          disabled={props.disabled as boolean}
        >
          {props.children as string ?? 'Button'}
        </Button>
      );

    case 'Link':
      return (
        <Link
          href={props.href as string ?? '#'}
          appearance={props.appearance as 'default' | 'subtle'}
          inline={props.inline as boolean}
        >
          {props.children as string ?? 'Link'}
        </Link>
      );

    default:
      return (
        <Text style={{ color: 'red' }}>
          Unknown component: {type}
        </Text>
      );
  }
}
