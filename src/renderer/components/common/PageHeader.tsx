import type { ReactNode } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbButton,
  BreadcrumbDivider,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  header: {
    marginBottom: tokens.spacingVerticalL,
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  title: {
    marginBottom: '0',
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    display: 'block',
  },
  breadcrumb: {
    marginBottom: tokens.spacingVerticalS,
  },
});

interface BreadcrumbItemData {
  label: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItemData[];
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  const styles = useStyles();

  return (
    <header className={styles.header}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb className={styles.breadcrumb}>
          {breadcrumbs.map((item, index) => (
            <span key={index}>
              {index > 0 && <BreadcrumbDivider />}
              <BreadcrumbItem>
                <BreadcrumbButton onClick={item.onClick}>
                  {item.label}
                </BreadcrumbButton>
              </BreadcrumbItem>
            </span>
          ))}
        </Breadcrumb>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className={styles.titleContainer}>
          <Text as="h1" size={800} weight="semibold" className={styles.title}>
            {title}
          </Text>
          {subtitle && (
            <Text className={styles.subtitle} size={300}>
              {subtitle}
            </Text>
          )}
        </div>
        {actions && <div>{actions}</div>}
      </div>
    </header>
  );
}
