/**
 * CanvasControls component provides UI controls for the canvas.
 * Includes mode toggle, clear, download, zoom controls, and dark mode.
 */

import React, { useState } from "react";
import { CanvasElement, VisualStyle } from "../shared/types";
import { ClearCanvasButton, DownloadButton, ZoomControls, UndoButton, RedoButton, FeedbackButton } from "../canvas/components/CanvasButtons";
import { useTheme } from "../../contexts/ThemeContext";
import styles from "./CanvasControls.module.css";

interface CanvasControlsProps {
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
  showLinkedListView?: boolean;
  onShowLinkedListViewChange?: (value: boolean) => void;
}

type ControlTab = "actions" | "view" | "settings";

const TAB_LABELS: Record<ControlTab, string> = {
  actions: "Actions",
  view: "View",
  settings: "Settings",
};

const TabButton: React.FC<{
  tab: ControlTab;
  label: string;
  isActive: boolean;
  onClick: (tab: ControlTab) => void;
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

export default function CanvasControls({
  isSandboxMode = false,
  onModeToggle,
  onClear,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  elements = [],
  scale = 1,
  onScaleChange,
  editorScale = 1,
  onEditorScaleChange,
  visualStyle = "memoryviz",
  onVisualStyleChange,
  pythonTutorReferenceArrows = false,
  onPythonTutorReferenceArrowsChange,
  pythonTutorStandalonePrimitives = false,
  onPythonTutorStandalonePrimitivesChange,
  fontScale = 1,
  onFontScaleChange,
  showLinkedListView = false,
  onShowLinkedListViewChange,
}: CanvasControlsProps) {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [activeTab, setActiveTab] = useState<ControlTab>("actions");

  return (
    <div className={styles.container}>
      <nav className={styles.tabHeaders} role="tablist">
        {(Object.keys(TAB_LABELS) as ControlTab[]).map((tab) => (
          <TabButton
            key={tab}
            tab={tab}
            label={TAB_LABELS[tab]}
            isActive={activeTab === tab}
            onClick={setActiveTab}
          />
        ))}
      </nav>

      <div className={styles.tabBody} role="tabpanel">
        <h3 className={styles.title}>Canvas Controls</h3>

        {/* Actions Tab */}
        {activeTab === "actions" && (
          <div className={styles.tabContent}>
            {(onUndo || onRedo) && (
              <div className={styles.undoRedoRow}>
                {onUndo && <UndoButton onClick={onUndo} disabled={!canUndo} />}
                {onRedo && <RedoButton onClick={onRedo} disabled={!canRedo} />}
              </div>
            )}

            {onClear && (
              <div className={styles.buttonWrapper}>
                <ClearCanvasButton onClick={onClear} />
              </div>
            )}

            <div className={styles.buttonWrapper}>
              <DownloadButton elements={elements} />
            </div>
          </div>
        )}

        {/* View Tab */}
        {activeTab === "view" && (
          <div className={styles.tabContent}>
            {onScaleChange && (
              <>
                <div className={styles.controlItem}>
                  <label className={styles.controlLabel}>Canvas Zoom</label>
                  <span className={styles.scaleValue}>{Math.round(scale * 100)}%</span>
                </div>
                <div className={styles.buttonWrapper}>
                  <ZoomControls scale={scale} onScaleChange={onScaleChange} />
                </div>
              </>
            )}

            {onEditorScaleChange && (
              <>
                <div className={styles.controlItem}>
                  <label className={styles.controlLabel}>Editor Zoom</label>
                  <span className={styles.scaleValue}>{Math.round(editorScale * 100)}%</span>
                </div>
                <div className={styles.buttonWrapper}>
                  <ZoomControls scale={editorScale} onScaleChange={onEditorScaleChange} />
                </div>
              </>
            )}

            {onFontScaleChange && (
              <>
                <div className={styles.controlItem}>
                  <label className={styles.controlLabel}>Question Zoom</label>
                  <span className={styles.scaleValue}>{Math.round(fontScale * 100)}%</span>
                </div>
                <div className={styles.buttonWrapper}>
                  <div className={styles.fontZoomControls}>
                    <button
                      type="button"
                      className={styles.fontZoomBtn}
                      onClick={() => onFontScaleChange(-0.1)}
                      disabled={fontScale <= 0.75}
                      aria-label="Decrease question font size"
                      title="Decrease question font size"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      className={styles.fontZoomBtn}
                      onClick={() => onFontScaleChange(0.1)}
                      disabled={fontScale >= 1.5}
                      aria-label="Increase question font size"
                      title="Increase question font size"
                    >
                      +
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className={styles.tabContent}>
            {/* Mode Toggle */}
            {onModeToggle && (
              <div className={styles.controlItem}>
                <label className={styles.controlLabel}>
                  {isSandboxMode ? "Practice" : "Test"}
                </label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isSandboxMode}
                  onClick={onModeToggle}
                  className={`${styles.toggle} ${isSandboxMode ? styles.toggleActive : ""}`}
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>
            )}

            {/* Dark Mode Toggle */}
            <div className={styles.controlItem}>
              <label className={styles.controlLabel} htmlFor="dark-mode-toggle">
                Dark Mode
              </label>
              <button
                id="dark-mode-toggle"
                type="button"
                role="switch"
                aria-checked={isDarkMode}
                onClick={toggleTheme}
                className={`${styles.toggle} ${isDarkMode ? styles.toggleActive : ""}`}
              >
                <span className={styles.toggleThumb} />
              </button>
            </div>

            {onVisualStyleChange && (
              <div className={styles.controlItem}>
                <label
                  className={styles.controlLabel}
                  htmlFor="python-tutor-style-toggle"
                >
                  Python Tutor Style
                </label>
                <button
                  id="python-tutor-style-toggle"
                  type="button"
                  role="switch"
                  aria-checked={visualStyle === "pythonTutor"}
                  onClick={() =>
                    onVisualStyleChange(
                      visualStyle === "pythonTutor"
                        ? "memoryviz"
                        : "pythonTutor"
                    )
                  }
                  className={`${styles.toggle} ${
                    visualStyle === "pythonTutor" ? styles.toggleActive : ""
                  }`}
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>
            )}

            {visualStyle === "pythonTutor" &&
              onPythonTutorStandalonePrimitivesChange && (
                <div
                  className={`${styles.controlItem} ${styles.nestedControlItem}`}
                >
                  <label
                    className={styles.controlLabel}
                    htmlFor="python-tutor-standalone-primitives-toggle"
                  >
                    Standalone Primitives
                  </label>
                  <button
                    id="python-tutor-standalone-primitives-toggle"
                    type="button"
                    role="switch"
                    aria-checked={pythonTutorStandalonePrimitives}
                    onClick={() =>
                      onPythonTutorStandalonePrimitivesChange(
                        !pythonTutorStandalonePrimitives
                      )
                    }
                    className={`${styles.toggle} ${
                      pythonTutorStandalonePrimitives
                        ? styles.toggleActive
                        : ""
                    }`}
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                </div>
              )}

            {visualStyle === "pythonTutor" &&
              onPythonTutorReferenceArrowsChange && (
                <div
                  className={`${styles.controlItem} ${styles.nestedControlItem}`}
                >
                  <label
                    className={styles.controlLabel}
                    htmlFor="python-tutor-reference-arrows-toggle"
                  >
                    Reference Arrows
                  </label>
                  <button
                    id="python-tutor-reference-arrows-toggle"
                    type="button"
                    role="switch"
                    aria-checked={pythonTutorReferenceArrows}
                    onClick={() =>
                      onPythonTutorReferenceArrowsChange(
                        !pythonTutorReferenceArrows
                      )
                    }
                    className={`${styles.toggle} ${
                      pythonTutorReferenceArrows ? styles.toggleActive : ""
                    }`}
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                </div>
              )}

            {onShowLinkedListViewChange && (
              <>
                <div className={styles.sectionHeading}>
                  Structure Visualizations
                </div>

                <div className={styles.controlItem}>
                  <label
                    className={styles.controlLabel}
                    htmlFor="linked-list-view-toggle"
                  >
                    Linked List View
                  </label>
                  <button
                    id="linked-list-view-toggle"
                    type="button"
                    role="switch"
                    aria-checked={showLinkedListView}
                    onClick={() =>
                      onShowLinkedListViewChange(!showLinkedListView)
                    }
                    className={`${styles.toggle} ${
                      showLinkedListView ? styles.toggleActive : ""
                    }`}
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                </div>
              </>
            )}

            <div className={`${styles.buttonWrapper} ${styles.feedbackWrapper}`}>
              <FeedbackButton />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
