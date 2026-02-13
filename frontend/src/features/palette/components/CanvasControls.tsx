/**
 * CanvasControls component provides UI controls for the canvas.
 * Includes mode toggle, clear, download, zoom controls, and dark mode.
 */

import React from "react";
import { CanvasElement } from "../../shared/types";
import { ClearCanvasButton, DownloadButton, ZoomControls } from "../../canvas/components/CanvasButtons";
import { useTheme } from "../../../contexts/ThemeContext";
import styles from "./CanvasControls.module.css";

interface CanvasControlsProps {
  isSandboxMode?: boolean;
  onModeToggle?: () => void;
  onClear?: () => void;
  elements?: CanvasElement[];
  scale?: number;
  onScaleChange?: (scale: number) => void;
}

export default function CanvasControls({
  isSandboxMode = false,
  onModeToggle,
  onClear,
  elements = [],
  scale = 1,
  onScaleChange,
}: CanvasControlsProps) {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Canvas Controls</h3>
      </div>

      <div className={styles.controlsBody}>
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

        {/* Canvas Actions */}
        <div className={styles.controlGroup}>
          <h4 className={styles.groupTitle}>Actions</h4>

          {onClear && (
            <div className={styles.buttonWrapper}>
              <ClearCanvasButton onClick={onClear} />
            </div>
          )}

          <div className={styles.buttonWrapper}>
            <DownloadButton elements={elements} />
          </div>
        </div>

        {/* Zoom Controls */}
        {onScaleChange && (
          <div className={styles.controlGroup}>
            <h4 className={styles.groupTitle}>Zoom</h4>
            <div className={styles.buttonWrapper}>
              <ZoomControls scale={scale} onScaleChange={onScaleChange} />
            </div>
          </div>
        )}

        {/* Dark Mode Toggle */}
        <div className={styles.controlGroup}>
          <h4 className={styles.groupTitle}>Appearance</h4>
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
      </div>
    </div>
  );
}
