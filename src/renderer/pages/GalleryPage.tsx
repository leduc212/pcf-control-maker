import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Text,
  Input,
  Button,
  Spinner,
  MessageBar,
  MessageBarBody,
  Tab,
  TabList,
} from '@fluentui/react-components';
import { Search24Regular, Filter24Regular } from '@fluentui/react-icons';
import { PageHeader } from '../components/common';
import {
  TemplateCard,
  TemplatePreviewDialog,
  CreateFromTemplateDialog,
} from '../components/templates';
import type { ControlTemplate, TemplateCategory } from '../../shared/types/template.types';
import { TEMPLATE_CATEGORIES } from '../../shared/constants/templates.constants';

const useStyles = makeStyles({
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
    flexWrap: 'wrap',
  },
  searchBar: {
    minWidth: '300px',
    flex: 1,
    maxWidth: '400px',
  },
  categoryTabs: {
    marginBottom: tokens.spacingVerticalL,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: tokens.spacingHorizontalL,
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL,
    gap: tokens.spacingHorizontalM,
  },
  emptyState: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
  stats: {
    display: 'flex',
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground3,
  },
});

export default function GalleryPage() {
  const styles = useStyles();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<ControlTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<ControlTemplate | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.template.getAll();
      setTemplates(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === 'all' || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleTemplateClick = (template: ControlTemplate) => {
    setSelectedTemplate(template);
    setPreviewDialogOpen(true);
  };

  const handleCreateClick = (template: ControlTemplate) => {
    setSelectedTemplate(template);
    setCreateDialogOpen(true);
    setPreviewDialogOpen(false);
  };

  const handleCreateSuccess = (projectPath: string) => {
    // Navigate to project page with the new project
    navigate('/project', { state: { projectPath } });
  };

  const categoryCounts = templates.reduce(
    (acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (isLoading) {
    return (
      <div className={styles.container}>
        <PageHeader
          title="Template Gallery"
          subtitle="Browse and create from PCF control templates"
        />
        <div className={styles.loadingContainer}>
          <Spinner size="medium" />
          <Text>Loading templates...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Template Gallery"
        subtitle="Browse and create from PCF control templates"
      />

      {error && (
        <MessageBar intent="error" style={{ marginBottom: tokens.spacingVerticalM }}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.toolbar}>
        <Input
          className={styles.searchBar}
          contentBefore={<Search24Regular />}
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(_, data) => setSearchQuery(data.value)}
        />
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          {filteredTemplates.length} of {templates.length} templates
        </Text>
      </div>

      <TabList
        className={styles.categoryTabs}
        selectedValue={selectedCategory}
        onTabSelect={(_, data) => setSelectedCategory(data.value as string)}
      >
        {TEMPLATE_CATEGORIES.filter(
          (cat) => cat.id === 'all' || categoryCounts[cat.id]
        ).map((category) => (
          <Tab key={category.id} value={category.id}>
            {category.label}
            {category.id !== 'all' && categoryCounts[category.id] && (
              <span style={{ marginLeft: '4px', opacity: 0.6 }}>
                ({categoryCounts[category.id]})
              </span>
            )}
          </Tab>
        ))}
      </TabList>

      {filteredTemplates.length === 0 ? (
        <div className={styles.emptyState}>
          <Filter24Regular
            style={{
              fontSize: '48px',
              color: tokens.colorNeutralForeground3,
              marginBottom: tokens.spacingVerticalM,
            }}
          />
          <Text size={400} weight="medium" block>
            No templates found
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
            {searchQuery
              ? `No templates match "${searchQuery}"`
              : 'No templates available in this category'}
          </Text>
          {searchQuery && (
            <Button
              appearance="subtle"
              onClick={() => setSearchQuery('')}
              style={{ marginTop: tokens.spacingVerticalM }}
            >
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplate?.id === template.id}
              onClick={() => handleTemplateClick(template)}
              onCreateClick={() => handleCreateClick(template)}
            />
          ))}
        </div>
      )}

      <TemplatePreviewDialog
        template={selectedTemplate}
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        onCreateClick={() => handleCreateClick(selectedTemplate!)}
      />

      <CreateFromTemplateDialog
        template={selectedTemplate}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
