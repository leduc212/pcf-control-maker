import { useState } from 'react';
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
  Select,
  Field,
  Switch,
  Text,
} from '@fluentui/react-components';
import { SUPPORTED_LANGUAGES } from '../../../shared/types/localization.types';

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  switchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
});

interface AddLanguageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (languageCode: string, copyFromLanguage?: string) => void;
  existingLanguages: string[];
}

export default function AddLanguageDialog({
  open,
  onOpenChange,
  onAdd,
  existingLanguages,
}: AddLanguageDialogProps) {
  const styles = useStyles();
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [copyValues, setCopyValues] = useState(false);
  const [copyFromLanguage, setCopyFromLanguage] = useState('');

  const availableLanguages = SUPPORTED_LANGUAGES.filter(
    (lang) => !existingLanguages.includes(lang.code)
  );

  const handleAdd = () => {
    if (!selectedLanguage) return;
    onAdd(selectedLanguage, copyValues ? copyFromLanguage : undefined);
    onOpenChange(false);
    setSelectedLanguage('');
    setCopyValues(false);
    setCopyFromLanguage('');
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface style={{ maxWidth: '400px' }}>
        <DialogBody>
          <DialogTitle>Add Language</DialogTitle>
          <DialogContent>
            <div className={styles.form}>
              <Field label="Language" required>
                <Select
                  value={selectedLanguage}
                  onChange={(_, data) => setSelectedLanguage(data.value)}
                >
                  <option value="">Select a language...</option>
                  {availableLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name} ({lang.code})
                    </option>
                  ))}
                </Select>
              </Field>

              {existingLanguages.length > 0 && (
                <>
                  <div className={styles.switchRow}>
                    <Switch
                      checked={copyValues}
                      onChange={(_, data) => setCopyValues(data.checked)}
                    />
                    <div>
                      <Text weight="medium">Copy values from existing language</Text>
                      <Text size={200} block style={{ color: tokens.colorNeutralForeground3 }}>
                        Start with existing translations as a base
                      </Text>
                    </div>
                  </div>

                  {copyValues && (
                    <Field label="Copy from">
                      <Select
                        value={copyFromLanguage}
                        onChange={(_, data) => setCopyFromLanguage(data.value)}
                      >
                        <option value="">Select source language...</option>
                        {existingLanguages.map((lang) => (
                          <option key={lang} value={lang}>
                            {SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.name || lang}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  )}
                </>
              )}

              {availableLanguages.length === 0 && (
                <Text style={{ color: tokens.colorNeutralForeground3 }}>
                  All supported languages have been added.
                </Text>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={handleAdd}
              disabled={!selectedLanguage || (copyValues && !copyFromLanguage)}
            >
              Add Language
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
