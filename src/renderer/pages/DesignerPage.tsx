import { useState } from 'react';
import { makeStyles, tokens, Button, Badge, Tooltip } from '@fluentui/react-components';
import {
  ArrowUndo24Regular,
  ArrowRedo24Regular,
  Save24Regular,
  Delete24Regular,
  PanelLeft24Regular,
  PanelRight24Regular,
} from '@fluentui/react-icons';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  closestCenter,
} from '@dnd-kit/core';
import { PageHeader } from '../components/common';
import { useDesignerStore } from '../stores/designer.store';
import {
  PropertyPanel,
  ComponentPalette,
  Canvas,
  PropertyInspector,
  ExportDialog,
  generateAllCode,
  PaletteItemOverlay,
  componentDefinitions,
} from '../components/designer';
import type { DesignerComponent, FluentComponentType } from '../../shared/types/designer.types';

const useStyles = makeStyles({
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    flexWrap: 'wrap',
  },
  toolbarSpacer: {
    flex: 1,
    minWidth: tokens.spacingHorizontalL,
  },
  toolbarGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  toolbarDivider: {
    width: '1px',
    height: '24px',
    backgroundColor: tokens.colorNeutralStroke1,
    marginLeft: tokens.spacingHorizontalS,
    marginRight: tokens.spacingHorizontalS,
  },
  workspace: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '280px 1fr 280px',
    overflow: 'hidden',
    '@media (max-width: 1100px)': {
      gridTemplateColumns: '240px 1fr 240px',
    },
  },
  workspaceLeftCollapsed: {
    gridTemplateColumns: '0px 1fr 280px',
    '@media (max-width: 1100px)': {
      gridTemplateColumns: '0px 1fr 240px',
    },
  },
  workspaceRightCollapsed: {
    gridTemplateColumns: '280px 1fr 0px',
    '@media (max-width: 1100px)': {
      gridTemplateColumns: '240px 1fr 0px',
    },
  },
  workspaceBothCollapsed: {
    gridTemplateColumns: '0px 1fr 0px',
  },
  panel: {
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'auto',
    padding: tokens.spacingVerticalM,
    transition: 'width 0.2s ease, padding 0.2s ease, opacity 0.2s ease',
    '@media (max-width: 1100px)': {
      padding: tokens.spacingVerticalS,
    },
  },
  panelCollapsed: {
    padding: 0,
    overflow: 'hidden',
    borderRight: 'none',
  },
  panelRight: {
    borderLeft: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRight: 'none',
  },
  panelRightCollapsed: {
    borderLeft: 'none',
  },
  centerArea: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
  },
  palette: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: tokens.spacingVerticalM,
    maxHeight: '50%',
    overflow: 'auto',
    backgroundColor: tokens.colorNeutralBackground1,
    '@media (max-width: 900px)': {
      maxHeight: '40%',
    },
  },
  previewBadge: {
    marginLeft: tokens.spacingHorizontalS,
  },
  panelToggleActive: {
    backgroundColor: tokens.colorBrandBackground2,
  },
});

function generateId(): string {
  return `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createComponentFromType(type: FluentComponentType): DesignerComponent {
  const definition = componentDefinitions[type];
  return {
    id: generateId(),
    type,
    props: { ...definition.defaultProps },
    children: definition.supportsChildren ? [] : undefined,
  };
}

export default function DesignerPage() {
  const styles = useStyles();
  const {
    manifest,
    properties,
    components,
    selectedId,
    hoveredId,
    historyIndex,
    history,
    setSelectedId,
    setHoveredId,
    addComponent,
    updateComponent,
    removeComponent,
    moveComponent,
    undo,
    redo,
    reset,
  } = useDesignerStore();

  const [activePaletteItem, setActivePaletteItem] = useState<FluentComponentType | null>(null);
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Find the selected component
  const findComponent = (
    comps: typeof components,
    id: string
  ): typeof components[0] | null => {
    for (const comp of comps) {
      if (comp.id === id) return comp;
      if (comp.children) {
        const found = findComponent(comp.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedComponent = selectedId ? findComponent(components, selectedId) : null;

  // Generate code for export
  const generatedCode = generateAllCode({
    manifest,
    properties,
    components,
  });

  const handleExport = async (targetPath: string) => {
    // Write files to the target path
    await window.electronAPI.fs.writeFile(
      `${targetPath}/ControlManifest.Input.xml`,
      generatedCode.manifest
    );
    await window.electronAPI.fs.writeFile(
      `${targetPath}/${manifest.constructor}.tsx`,
      generatedCode.component
    );
    await window.electronAPI.fs.writeFile(
      `${targetPath}/index.ts`,
      generatedCode.index
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;

    if (data?.type === 'palette-item') {
      setActivePaletteItem(data.componentType);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActivePaletteItem(null);

    if (!over) return;

    const activeData = active.data.current;

    // Dropping from palette
    if (activeData?.type === 'palette-item') {
      const componentType = activeData.componentType as FluentComponentType;
      const newComponent = createComponentFromType(componentType);

      // Check if dropping onto a container component
      const overData = over.data.current;
      if (overData?.type === 'canvas-component') {
        const targetComponent = overData.component as DesignerComponent;
        const targetDef = componentDefinitions[targetComponent.type];
        if (targetDef.supportsChildren) {
          addComponent(newComponent, targetComponent.id);
          setSelectedId(newComponent.id);
          return;
        }
      }

      // Otherwise, add to root
      addComponent(newComponent);
      setSelectedId(newComponent.id);
      return;
    }

    // Reordering within canvas
    if (activeData?.type === 'canvas-component') {
      const activeComponent = activeData.component as DesignerComponent;

      if (active.id !== over.id) {
        const overData = over.data.current;

        // Dropping onto canvas root
        if (over.id === 'canvas-root') {
          moveComponent(activeComponent.id, null, components.length);
          return;
        }

        // Dropping onto another component
        if (overData?.type === 'canvas-component') {
          const targetComponent = overData.component as DesignerComponent;
          const targetDef = componentDefinitions[targetComponent.type];

          // If target supports children, add as child
          if (targetDef.supportsChildren && activeComponent.id !== targetComponent.id) {
            moveComponent(activeComponent.id, targetComponent.id, 0);
            return;
          }

          // Otherwise, reorder at same level
          const oldIndex = components.findIndex((c) => c.id === activeComponent.id);
          const newIndex = components.findIndex((c) => c.id === targetComponent.id);
          if (oldIndex !== -1 && newIndex !== -1) {
            moveComponent(activeComponent.id, null, newIndex);
          }
        }
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.container}>
        <PageHeader
          title="Visual Designer"
          subtitle="Design PCF controls with drag and drop"
          actions={
            <Badge appearance="tint" color="informative" className={styles.previewBadge}>
              Beta
            </Badge>
          }
        />

        <div className={styles.toolbar}>
          <div className={styles.toolbarGroup}>
            <Tooltip content={leftPanelVisible ? 'Hide left panel' : 'Show left panel'} relationship="label">
              <Button
                appearance="subtle"
                icon={<PanelLeft24Regular />}
                onClick={() => setLeftPanelVisible(!leftPanelVisible)}
                className={leftPanelVisible ? styles.panelToggleActive : undefined}
              />
            </Tooltip>
            <Tooltip content={rightPanelVisible ? 'Hide right panel' : 'Show right panel'} relationship="label">
              <Button
                appearance="subtle"
                icon={<PanelRight24Regular />}
                onClick={() => setRightPanelVisible(!rightPanelVisible)}
                className={rightPanelVisible ? styles.panelToggleActive : undefined}
              />
            </Tooltip>
          </div>

          <div className={styles.toolbarDivider} />

          <div className={styles.toolbarGroup}>
            <Tooltip content="Undo" relationship="label">
              <Button
                appearance="subtle"
                icon={<ArrowUndo24Regular />}
                disabled={!canUndo}
                onClick={undo}
              />
            </Tooltip>
            <Tooltip content="Redo" relationship="label">
              <Button
                appearance="subtle"
                icon={<ArrowRedo24Regular />}
                disabled={!canRedo}
                onClick={redo}
              />
            </Tooltip>
          </div>

          <div className={styles.toolbarGroup}>
            <Button
              appearance="subtle"
              icon={<Delete24Regular />}
              onClick={reset}
              title="Reset designer"
            >
              Reset
            </Button>
          </div>

          <div className={styles.toolbarSpacer} />

          <div className={styles.toolbarGroup}>
            <ExportDialog
              generatedCode={generatedCode}
              constructorName={manifest.constructor}
              onExport={handleExport}
              trigger={
                <Button appearance="primary" icon={<Save24Regular />}>
                  Generate Code
                </Button>
              }
            />
          </div>
        </div>

        <div className={`${styles.workspace} ${
          !leftPanelVisible && !rightPanelVisible ? styles.workspaceBothCollapsed :
          !leftPanelVisible ? styles.workspaceLeftCollapsed :
          !rightPanelVisible ? styles.workspaceRightCollapsed : ''
        }`}>
          {/* Left Panel - Properties & Manifest */}
          <div className={`${styles.panel} ${!leftPanelVisible ? styles.panelCollapsed : ''}`}>
            {leftPanelVisible && <PropertyPanel />}
          </div>

          {/* Center - Palette & Canvas */}
          <div className={styles.centerArea}>
            <div className={styles.palette}>
              <ComponentPalette />
            </div>
            <Canvas
              components={components}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={setSelectedId}
              onHover={setHoveredId}
              onRemoveComponent={removeComponent}
            />
          </div>

          {/* Right Panel - Property Inspector */}
          <div className={`${styles.panel} ${styles.panelRight} ${!rightPanelVisible ? `${styles.panelCollapsed} ${styles.panelRightCollapsed}` : ''}`}>
            {rightPanelVisible && (
              <PropertyInspector
                component={selectedComponent}
                properties={properties}
                onUpdateComponent={updateComponent}
              />
            )}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activePaletteItem && (
          <PaletteItemOverlay definition={componentDefinitions[activePaletteItem]} />
        )}
      </DragOverlay>
    </DndContext>
  );
}
