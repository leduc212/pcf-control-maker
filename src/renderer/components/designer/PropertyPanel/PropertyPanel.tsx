import { useState } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from '@fluentui/react-components';
import { useDesignerStore } from '../../../stores/designer.store';
import { ManifestEditor } from './ManifestEditor';
import { PropertyList } from './PropertyList';
import { PropertyFormDialog } from './PropertyFormDialog';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'auto',
  },
  section: {
    marginBottom: tokens.spacingVerticalM,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingVerticalS,
  },
  sectionTitle: {
    fontWeight: tokens.fontWeightSemibold,
  },
  accordion: {
    '& .fui-AccordionHeader__button': {
      paddingLeft: 0,
      paddingRight: 0,
    },
  },
  accordionPanel: {
    paddingLeft: 0,
    paddingRight: 0,
  },
});

interface PropertyPanelProps {
  selectedPropertyName?: string;
  onPropertySelect?: (name: string) => void;
}

export function PropertyPanel({
  selectedPropertyName,
  onPropertySelect,
}: PropertyPanelProps) {
  const styles = useStyles();
  const { properties, addProperty, updateProperty, removeProperty } = useDesignerStore();
  const [openItems, setOpenItems] = useState<string[]>(['manifest', 'properties']);

  const existingNames = properties.map((p) => p.name);

  return (
    <div className={styles.container}>
      <Accordion
        multiple
        collapsible
        openItems={openItems}
        onToggle={(_, data) => setOpenItems(data.openItems as string[])}
        className={styles.accordion}
      >
        <AccordionItem value="manifest">
          <AccordionHeader>
            <Text weight="semibold">Control Manifest</Text>
          </AccordionHeader>
          <AccordionPanel className={styles.accordionPanel}>
            <ManifestEditor />
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem value="properties">
          <AccordionHeader>
            <Text weight="semibold">Properties ({properties.length})</Text>
          </AccordionHeader>
          <AccordionPanel className={styles.accordionPanel}>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <PropertyFormDialog
                  existingNames={existingNames}
                  onSave={addProperty}
                />
              </div>
              <PropertyList
                properties={properties}
                selectedProperty={selectedPropertyName}
                onSelect={onPropertySelect}
                onUpdate={(name, property) => updateProperty(name, property)}
                onDelete={removeProperty}
              />
            </div>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
