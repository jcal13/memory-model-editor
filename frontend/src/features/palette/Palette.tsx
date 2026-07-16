import React, { useState, useEffect, useRef } from "react";
import PaletteBox from "./components/PaletteBox";
import CanvasControls from "../canvasControls/CanvasControls";
import HelpIcon from "../shared/components/HelpIcon";
import { useResizable } from "./hooks/useResizable";
import styles from "./Palette.module.css";
import {
  PaletteTab,
  BoxTypeName,
  CanvasElement,
  VisualStyle,
} from "../shared/types";

const BOX_DESCRIPTIONS: Record<BoxTypeName, string> = {
  function: "A stack frame for a function call — shows its name and local variables.",
  class: "An instance of a class — shows its id and its attributes.",
  none: "Python's None value.",
  int: "An integer value.",
  float: "A floating-point (decimal) value.",
  str: "A string value.",
  bool: "A boolean value — True or False.",
  list: "An ordered, mutable collection of values.",
  tuple: "An ordered, immutable collection of values.",
  set: "An unordered collection of unique values.",
  dict: "A collection of key-value pairs.",
  primitive: "A basic value type, such as an int, float, str, or bool.",
};

// Move constants here for better organization
const ALL_TYPES: readonly BoxTypeName[] = [
  "function",
  "class",
  "none",
  "int",
  "float",
  "str",
  "bool",
  "list",
  "tuple",
  "set",
  "dict",
] as const;

const CLASS_FN_TYPES: readonly BoxTypeName[] = ["function", "class"] as const;
const PRIMITIVE_TYPES: readonly BoxTypeName[] = [
  "none",
  "int",
  "float",
  "str",
  "bool",
] as const;
const COLLECTION_TYPES: readonly BoxTypeName[] = [
  "list",
  "tuple",
  "set",
  "dict",
] as const;

const TAB_BOX_MAPPING = {
  all: ALL_TYPES,
  classesFns: CLASS_FN_TYPES,
  primitives: PRIMITIVE_TYPES,
  collections: COLLECTION_TYPES,
} as const;

const TAB_LABELS = {
  all: "All",
  classesFns: "Classes & Functions",
  primitives: "Primitives",
  collections: "Collections",
} as const;

interface PaletteProps {
  activeTab: PaletteTab;
  setActive: (tab: PaletteTab) => void;
  requiredBoxes?: BoxTypeName[];
  isPracticeMode?: boolean;
  // Canvas Controls props
  isSandboxMode?: boolean;
  onModeToggle?: () => void;
  onClear?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  elements?: CanvasElement[];
  scale?: number;
  onScaleChange?: (scale: number) => void;
  editorScale?: number;
  onEditorScaleChange?: (scale: number) => void;
  visualStyle?: VisualStyle;
  onVisualStyleChange?: (style: VisualStyle) => void;
  pythonTutorReferenceArrows?: boolean;
  onPythonTutorReferenceArrowsChange?: (value: boolean) => void;
  pythonTutorStandalonePrimitives?: boolean;
  onPythonTutorStandalonePrimitivesChange?: (value: boolean) => void;
  fontScale?: number;
  onFontScaleChange?: (delta: number) => void;
}

// Extract TabButton component inline
const TabButton: React.FC<{
  tab: PaletteTab;
  label: string;
  isActive: boolean;
  onClick: (tab: PaletteTab) => void;
}> = ({ tab, label, isActive, onClick }) => (
  <button
    type="button"
    className={`${styles.tabBtn} ${isActive ? styles.active : ""}`}
    onClick={() => onClick(tab)}
    aria-pressed={isActive}
  >
    <span className={styles.tabLabel}>{label}</span>
  </button>
);

function filterBoxesByRequired(
  boxes: readonly BoxTypeName[],
  requiredBoxes?: BoxTypeName[]
): BoxTypeName[] {
  if (!requiredBoxes || requiredBoxes.length === 0) {
    return [...boxes];
  }

  return boxes.filter((boxType) => requiredBoxes.includes(boxType));
}

function filterBoxesByVisualStyle(
  boxes: readonly BoxTypeName[],
  visualStyle: VisualStyle,
  pythonTutorStandalonePrimitives: boolean
): BoxTypeName[] {
  if (visualStyle !== "pythonTutor" || pythonTutorStandalonePrimitives) {
    return [...boxes];
  }

  return boxes.filter((boxType) => !PRIMITIVE_TYPES.includes(boxType));
}

export default function Palette({
  activeTab,
  setActive,
  requiredBoxes,
  isPracticeMode = false,
  isSandboxMode,
  onModeToggle,
  onClear,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  elements,
  scale,
  onScaleChange,
  editorScale,
  onEditorScaleChange,
  visualStyle = "memoryviz",
  onVisualStyleChange,
  pythonTutorReferenceArrows = false,
  onPythonTutorReferenceArrowsChange,
  pythonTutorStandalonePrimitives = false,
  onPythonTutorStandalonePrimitivesChange,
  fontScale,
  onFontScaleChange,
}: PaletteProps) {
  const allBoxes = TAB_BOX_MAPPING[activeTab];

  const boxes =
    isPracticeMode && requiredBoxes
      ? filterBoxesByRequired(allBoxes, requiredBoxes)
      : allBoxes;
  const visibleBoxes = filterBoxesByVisualStyle(
    boxes,
    visualStyle,
    pythonTutorStandalonePrimitives
  );

  const { topHeight, handleMouseDown, containerRef } = useResizable({
    initialTopPercent: 60,
    minTopPercent: 30,
    maxTopPercent: 80,
  });

  // Track palette width for scaling boxes
  const REFERENCE_WIDTH = 280; // Default palette width
  const [boxScale, setBoxScale] = useState(1);
  const paletteContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!paletteContainerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        // Calculate scale based on ratio, but cap at 1.0 (don't enlarge)
        const calculatedScale = Math.min(1, width / REFERENCE_WIDTH);
        setBoxScale(calculatedScale);
      }
    });

    resizeObserver.observe(paletteContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className={styles.containerWrapper}>
      <div className={styles.outerContainer} ref={containerRef}>
        {/* Palette Section - Resizable */}
        <div
          className={styles.paletteSection}
          style={{ height: `${topHeight}%` }}
          ref={paletteContainerRef}
        >
          <div className={styles.container}>
            <nav className={styles.tabHeaders} role="tablist">
              {(Object.keys(TAB_LABELS) as PaletteTab[]).map((tab) => (
                <TabButton
                  key={tab}
                  tab={tab}
                  label={TAB_LABELS[tab]}
                  isActive={activeTab === tab}
                  onClick={setActive}
                />
              ))}
            </nav>

            <div className={styles.tabBody} role="tabpanel">
              <h3 className={styles.paletteTitle}>
                Palette
                <HelpIcon
                  title="Palette"
                  text="Drag a box onto the canvas to add it to your memory model. Use the tabs on the left to filter by category, and click a box's own ? for what it represents."
                />
              </h3>
              <div
                className={styles.paletteBoxes}
                style={{
                  transform: `scale(${boxScale})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s ease',
                }}
              >
                {visibleBoxes.length > 0 ? (
                  visibleBoxes.map((boxType) => (
                    <div key={boxType} className={styles.paletteBoxItem}>
                      <PaletteBox
                        boxType={boxType}
                        visualStyle={visualStyle}
                      />
                      <span className={styles.paletteBoxHelpSlot}>
                        <HelpIcon
                          title={boxType}
                          text={BOX_DESCRIPTIONS[boxType]}
                        />
                      </span>
                    </div>
                  ))
                ) : (
                  <p className={styles.emptyState}>
                    {visualStyle === "pythonTutor" &&
                    !pythonTutorStandalonePrimitives
                      ? "Primitive values are created inline in Python Tutor mode."
                      : "No boxes available in this tab."}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Resizable Divider */}
        <div
          className={styles.resizeDivider}
          onMouseDown={handleMouseDown}
          role="separator"
          aria-orientation="horizontal"
        />

        {/* Canvas Controls Section - Resizable */}
        <div
          className={styles.controlsSection}
          style={{ height: `${100 - topHeight}%` }}
        >
          <CanvasControls
            isSandboxMode={isSandboxMode}
            onModeToggle={onModeToggle}
            onClear={onClear}
            onUndo={onUndo}
            onRedo={onRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            elements={elements}
            scale={scale}
            onScaleChange={onScaleChange}
            editorScale={editorScale}
            onEditorScaleChange={onEditorScaleChange}
            visualStyle={visualStyle}
            onVisualStyleChange={onVisualStyleChange}
            pythonTutorReferenceArrows={pythonTutorReferenceArrows}
            onPythonTutorReferenceArrowsChange={
              onPythonTutorReferenceArrowsChange
            }
            pythonTutorStandalonePrimitives={pythonTutorStandalonePrimitives}
            onPythonTutorStandalonePrimitivesChange={
              onPythonTutorStandalonePrimitivesChange
            }
            fontScale={fontScale}
            onFontScaleChange={onFontScaleChange}
          />
        </div>
      </div>
    </div>
  );
}
