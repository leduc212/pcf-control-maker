import { useState } from 'react';
import {
  makeStyles,
  tokens,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Badge,
  Tooltip,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from '@fluentui/react-components';
import {
  Edit24Regular,
  Delete24Regular,
  MoreVertical24Regular,
  Warning24Regular,
} from '@fluentui/react-icons';
import type { LocalizationEntry } from '../../../shared/types/localization.types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    overflow: 'auto',
  },
  table: {
    minWidth: '100%',
  },
  keyCell: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
  },
  valueCell: {
    minWidth: '150px',
  },
  valueInput: {
    width: '100%',
  },
  emptyValue: {
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
  },
  missingBadge: {
    marginLeft: tokens.spacingHorizontalXS,
  },
  actionsCell: {
    width: '80px',
  },
});

interface LocalizationGridProps {
  entries: LocalizationEntry[];
  languages: string[];
  onUpdateEntry: (key: string, values: Record<string, string>, comment?: string) => void;
  onDeleteEntry: (key: string) => void;
  onEditEntry: (entry: LocalizationEntry) => void;
  missingTranslations: { key: string; missingLanguages: string[] }[];
}

export default function LocalizationGrid({
  entries,
  languages,
  onUpdateEntry,
  onDeleteEntry,
  onEditEntry,
  missingTranslations,
}: LocalizationGridProps) {
  const styles = useStyles();
  const [editingCell, setEditingCell] = useState<{ key: string; lang: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const getMissingLanguages = (key: string): string[] => {
    const missing = missingTranslations.find((m) => m.key === key);
    return missing?.missingLanguages || [];
  };

  const handleStartEdit = (key: string, lang: string, value: string) => {
    setEditingCell({ key, lang });
    setEditValue(value);
  };

  const handleSaveEdit = (entry: LocalizationEntry) => {
    if (!editingCell) return;

    const newValues = {
      ...entry.values,
      [editingCell.lang]: editValue,
    };
    onUpdateEntry(entry.key, newValues, entry.comment);
    setEditingCell(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const getLanguageDisplayName = (code: string): string => {
    const names: Record<string, string> = {
      en: 'English',
      de: 'German',
      es: 'Spanish',
      fr: 'French',
      it: 'Italian',
      ja: 'Japanese',
      ko: 'Korean',
      nl: 'Dutch',
      pl: 'Polish',
      'pt-BR': 'Portuguese (BR)',
      'pt-PT': 'Portuguese (PT)',
      ru: 'Russian',
      'zh-CN': 'Chinese (Simp)',
      'zh-TW': 'Chinese (Trad)',
    };
    return names[code] || code.toUpperCase();
  };

  return (
    <div className={styles.container}>
      <Table className={styles.table} size="small">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Key</TableHeaderCell>
            {languages.map((lang) => (
              <TableHeaderCell key={lang}>{getLanguageDisplayName(lang)}</TableHeaderCell>
            ))}
            <TableHeaderCell className={styles.actionsCell}>Actions</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const missingLangs = getMissingLanguages(entry.key);

            return (
              <TableRow key={entry.key}>
                <TableCell className={styles.keyCell}>
                  {entry.key}
                  {missingLangs.length > 0 && (
                    <Tooltip
                      content={`Missing: ${missingLangs.join(', ')}`}
                      relationship="label"
                    >
                      <Badge
                        className={styles.missingBadge}
                        appearance="tint"
                        color="warning"
                        size="small"
                        icon={<Warning24Regular />}
                      >
                        {missingLangs.length}
                      </Badge>
                    </Tooltip>
                  )}
                </TableCell>
                {languages.map((lang) => {
                  const isEditing =
                    editingCell?.key === entry.key && editingCell?.lang === lang;
                  const value = entry.values[lang] || '';
                  const isMissing = missingLangs.includes(lang);

                  return (
                    <TableCell key={lang} className={styles.valueCell}>
                      {isEditing ? (
                        <Input
                          className={styles.valueInput}
                          value={editValue}
                          onChange={(_, data) => setEditValue(data.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(entry);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          onBlur={() => handleSaveEdit(entry)}
                          autoFocus
                        />
                      ) : (
                        <span
                          className={isMissing || !value ? styles.emptyValue : undefined}
                          onClick={() => handleStartEdit(entry.key, lang, value)}
                          style={{ cursor: 'pointer', display: 'block', minHeight: '20px' }}
                        >
                          {value || '(empty)'}
                        </span>
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className={styles.actionsCell}>
                  <Menu>
                    <MenuTrigger disableButtonEnhancement>
                      <Button appearance="subtle" size="small" icon={<MoreVertical24Regular />} />
                    </MenuTrigger>
                    <MenuPopover>
                      <MenuList>
                        <MenuItem icon={<Edit24Regular />} onClick={() => onEditEntry(entry)}>
                          Edit Details
                        </MenuItem>
                        <MenuItem icon={<Delete24Regular />} onClick={() => onDeleteEntry(entry.key)}>
                          Delete
                        </MenuItem>
                      </MenuList>
                    </MenuPopover>
                  </Menu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
