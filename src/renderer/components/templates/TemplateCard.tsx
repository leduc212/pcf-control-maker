import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Badge,
  Button,
  Tooltip,
} from '@fluentui/react-components';
import {
  Star24Regular,
  Calendar24Regular,
  ArrowUpload24Regular,
  Pen24Regular,
  TextEditStyle24Regular,
  Eye24Regular,
  Code24Regular,
} from '@fluentui/react-icons';
import type { ControlTemplate } from '../../../shared/types/template.types';

const useStyles = makeStyles({
  card: {
    width: '100%',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow16,
    },
  },
  cardSelected: {
    borderColor: tokens.colorBrandStroke1,
    borderWidth: '2px',
  },
  preview: {
    height: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground3,
    fontSize: '48px',
  },
  header: {
    paddingBottom: 0,
  },
  content: {
    padding: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalXS,
  },
  description: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    minHeight: '32px',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalS,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingHorizontalM,
    paddingTop: 0,
  },
  badge: {
    textTransform: 'capitalize',
  },
});

interface TemplateCardProps {
  template: ControlTemplate;
  isSelected?: boolean;
  onClick: () => void;
  onCreateClick: () => void;
}

const getTemplateIcon = (iconName: string) => {
  switch (iconName) {
    case 'Star24Regular':
      return <Star24Regular />;
    case 'Calendar24Regular':
      return <Calendar24Regular />;
    case 'ArrowUpload24Regular':
      return <ArrowUpload24Regular />;
    case 'Pen24Regular':
      return <Pen24Regular />;
    case 'TextEditStyle24Regular':
      return <TextEditStyle24Regular />;
    case 'Eye24Regular':
      return <Eye24Regular />;
    default:
      return <Code24Regular />;
  }
};

const getCategoryColor = (category: string): 'brand' | 'informative' | 'success' | 'warning' | 'danger' | 'important' | 'subtle' => {
  switch (category) {
    case 'input':
      return 'brand';
    case 'display':
      return 'informative';
    case 'media':
      return 'success';
    case 'data':
      return 'warning';
    case 'utility':
      return 'important';
    default:
      return 'subtle';
  }
};

export default function TemplateCard({
  template,
  isSelected,
  onClick,
  onCreateClick,
}: TemplateCardProps) {
  const styles = useStyles();

  return (
    <Card
      className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
      onClick={onClick}
    >
      <CardPreview className={styles.preview}>
        {getTemplateIcon(template.icon)}
      </CardPreview>
      <CardHeader
        className={styles.header}
        header={
          <Text weight="semibold" size={400}>
            {template.name}
          </Text>
        }
        action={
          <Badge
            className={styles.badge}
            appearance="tint"
            color={getCategoryColor(template.category)}
            size="small"
          >
            {template.category}
          </Badge>
        }
      />
      <div className={styles.content}>
        <Text className={styles.description}>{template.description}</Text>
        <div className={styles.tags}>
          {template.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} appearance="outline" size="small">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge appearance="outline" size="small">
              +{template.tags.length - 3}
            </Badge>
          )}
        </div>
      </div>
      <div className={styles.footer}>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          v{template.version}
        </Text>
        <Tooltip content="Create project from template" relationship="label">
          <Button
            appearance="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onCreateClick();
            }}
          >
            Use Template
          </Button>
        </Tooltip>
      </div>
    </Card>
  );
}
