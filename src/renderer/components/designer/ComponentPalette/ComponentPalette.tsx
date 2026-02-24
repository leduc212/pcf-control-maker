import { makeStyles, tokens, Text, Input } from '@fluentui/react-components';
import { Search20Regular } from '@fluentui/react-icons';
import { useState, useMemo } from 'react';
import { getSortedCategories } from '../shared';
import { PaletteCategory } from './PaletteCategory';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  header: {
    paddingBottom: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    marginBottom: tokens.spacingVerticalM,
  },
  title: {
    marginBottom: tokens.spacingVerticalS,
  },
  search: {
    width: '100%',
  },
  categories: {
    flex: 1,
    overflow: 'auto',
  },
  emptySearch: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXL,
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
  },
});

export function ComponentPalette() {
  const styles = useStyles();
  const [searchQuery, setSearchQuery] = useState('');

  const sortedCategories = useMemo(() => getSortedCategories(), []);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return sortedCategories;
    }

    const query = searchQuery.toLowerCase();
    return sortedCategories
      .map((category) => ({
        ...category,
        components: category.components.filter(
          (c) =>
            c.displayName.toLowerCase().includes(query) ||
            c.description.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.components.length > 0);
  }, [sortedCategories, searchQuery]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text weight="semibold" className={styles.title} block>
          Components
        </Text>
        <Input
          className={styles.search}
          placeholder="Search components..."
          contentBefore={<Search20Regular />}
          value={searchQuery}
          onChange={(_, data) => setSearchQuery(data.value)}
          size="small"
        />
      </div>

      <div className={styles.categories}>
        {filteredCategories.length === 0 ? (
          <div className={styles.emptySearch}>
            <Text size={200}>No components found</Text>
            <Text size={200}>Try a different search term</Text>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <PaletteCategory
              key={category.category}
              name={category.displayName}
              components={category.components}
            />
          ))
        )}
      </div>
    </div>
  );
}
