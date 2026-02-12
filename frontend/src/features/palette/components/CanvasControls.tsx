/**
 * CanvasControls component provides UI controls for the canvas.
 * Currently includes a dark mode toggle.
 */

import React, { useState } from "react";
import styles from "./CanvasControls.module.css";

export default function CanvasControls() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleDarkModeToggle = () => {
    setIsDarkMode(!isDarkMode);
    // TODO: Implement dark mode functionality
    console.log("Dark mode:", !isDarkMode);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Canvas Controls</h3>
      </div>

      <div className={styles.controlsBody}>
        <div className={styles.controlItem}>
          <label className={styles.controlLabel} htmlFor="dark-mode-toggle">
            Dark Mode
          </label>
          <button
            id="dark-mode-toggle"
            type="button"
            role="switch"
            aria-checked={isDarkMode}
            onClick={handleDarkModeToggle}
            className={`${styles.toggle} ${isDarkMode ? styles.toggleActive : ""}`}
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>
      </div>
    </div>
  );
}
