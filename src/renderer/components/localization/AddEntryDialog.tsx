import { useState, useEffect } from 'react';
import {
  makeStyles,
  tokens,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Field,
  Textarea,
} from '@fluentui/react-components';
import type { LocalizationEntry } from '../../../shared/types/localization.types';

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  languageValues: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    maxHeight: '300px',
    overflow: 'auto',
  },
});

interface AddEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: LocalizationEntry) => void;
  editEntry?: LocalizationEntry | null;
  languages: string[];
}

export default function AddEntryDialog({
  open,
  onOpenChange,
  onSave,
  editEntry,
  languages,
}: AddEntryDialogProps) {
  const styles = useStyles();
  const [key, setKey] = useState('');
  const [comment, setComment] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editEntry) {
      setKey(editEntry.key);
      setComment(editEntry.comment || '');
      setValues(editEntry.values);
    } else {
      setKey('');
      setComment('');
      setValues(languages.reduce((acc, lang) => ({ ...acc, [lang]: '' }), {}));
    }
  }, [editEntry, languages, open]);

  const handleSave = () => {
    if (!key.trim()) return;

    onSave({
      key: key.trim(),
      values,
      comment: comment.trim() || undefined,
    });
    onOpenChange(false);
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
      'pt-BR': 'Portuguese (Brazil)',
      'pt-PT': 'Portuguese (Portugal)',
      ru: 'Russian',
      'zh-CN': 'Chinese (Simplified)',
      'zh-TW': 'Chinese (Traditional)',
    };
    return names[code] || code.toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface style={{ maxWidth: '500px' }}>
        <DialogBody>
          <DialogTitle>{editEntry ? 'Edit Entry' : 'Add Entry'}</DialogTitle>
          <DialogContent>
            <div className={styles.form}>
              <Field label="Key" required hint="Unique identifier for this translation">
                <Input
                  value={key}
                  onChange={(_, data) => setKey(data.value)}
                  placeholder="e.g., Control_DisplayName_Key"
                  disabled={!!editEntry}
                />
              </Field>

              <Field label="Comment" hint="Optional description for translators">
                <Textarea
                  value={comment}
                  onChange={(_, data) => setComment(data.value)}
                  placeholder="Describe the context for this text..."
                  rows={2}
                />
              </Field>

              <Field label="Values by Language">
                <div className={styles.languageValues}>
                  {languages.map((lang) => (
                    <Field key={lang} label={getLanguageDisplayName(lang)} size="small">
                      <Input
                        value={values[lang] || ''}
                        onChange={(_, data) =>
                          setValues((prev) => ({ ...prev, [lang]: data.value }))
                        }
                        placeholder={`Value in ${getLanguageDisplayName(lang)}`}
                      />
                    </Field>
                  ))}
                </div>
              </Field>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleSave} disabled={!key.trim()}>
              {editEntry ? 'Save Changes' : 'Add Entry'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
