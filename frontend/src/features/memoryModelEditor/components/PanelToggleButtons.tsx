import React from "react";
import styles from "./PanelToggleButtons.module.css";

interface PanelToggleButtonsProps {
  isPaletteOpen: boolean;
  isInfoPanelOpen: boolean;
  onTogglePalette: () => void;
  onToggleInfoPanel: () => void;
}

export default function PanelToggleButtons({
  isPaletteOpen,
  isInfoPanelOpen,
  onTogglePalette,
  onToggleInfoPanel,
}: PanelToggleButtonsProps) {
  return (
    <>
      {/* Left Panel Toggle (Palette) */}
      {!isPaletteOpen && (
        <button
          className={`${styles.toggleButton} ${styles.leftToggle}`}
          onClick={onTogglePalette}
          aria-label="Show Palette"
          title="Show Palette"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      )}

      {/* Right Panel Toggle (Info) */}
      {!isInfoPanelOpen && (
        <button
          className={`${styles.toggleButton} ${styles.rightToggle}`}
          onClick={onToggleInfoPanel}
          aria-label="Show Info Panel"
          title="Show Info Panel"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      )}
    </>
  );
}
