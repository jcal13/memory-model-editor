/**
 * CanvasControls component provides UI controls for the canvas.
 * Includes mode toggle, clear, download, zoom controls, and dark mode.
 */

import React, { useState } from "react";
import { CanvasElement } from "../../shared/types";
import { ClearCanvasButton, DownloadButton, ZoomControls, UndoButton } from "../../canvas/components/CanvasButtons";
import { useTheme } from "../../../contexts/ThemeContext";
import styles from "./CanvasControls.module.css";

interface CanvasControlsProps {
  isSandboxMode?: boolean;
  onModeToggle?: () => void;
  onClear?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  elements?: CanvasElement[];
  scale?: number;
  onScaleChange?: (scale: number) => void;
  editorScale?: number;
  onEditorScaleChange?: (scale: number) => void;
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
  canUndo = false,
  elements = [],
  scale = 1,
  onScaleChange,
  editorScale = 1,
  onEditorScaleChange,
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
            {onUndo && (
              <div className={styles.buttonWrapper}>
                <UndoButton onClick={onUndo} disabled={!canUndo} />
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
          </div>
        )}
      </div>
    </div>
  );
}
