import { makeStyles, tokens, Text, Badge } from '@fluentui/react-components';
import { useProjectStore } from '../../stores/project.store';

const useStyles = makeStyles({
  statusBar: {
    height: '24px',
    backgroundColor: tokens.colorBrandBackground,
    display: 'flex',
    alignItems: 'center',
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    gap: tokens.spacingHorizontalM,
  },
  text: {
    color: tokens.colorNeutralForegroundOnBrand,
    fontSize: tokens.fontSizeBase200,
  },
  spacer: {
    flex: 1,
  },
});

export default function StatusBar() {
  const styles = useStyles();
  const currentProject = useProjectStore((state) => state.currentProject);

  return (
    <div className={styles.statusBar}>
      {currentProject ? (
        <>
          <Text className={styles.text}>{currentProject.name}</Text>
          <Badge appearance="filled" color="success" size="small">
            Open
          </Badge>
        </>
      ) : (
        <Text className={styles.text}>No project open</Text>
      )}

      <div className={styles.spacer} />

      <Text className={styles.text}>PCF Maker v0.1.0</Text>
    </div>
  );
}
