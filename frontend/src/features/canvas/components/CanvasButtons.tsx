import React, { useCallback, useRef, useState } from "react";
import { CanvasElement } from "../../shared/types";
import { buildJSONFromElements } from "../../validationServices/jsonBuilder";
import html2canvas from "html2canvas";
import styles from "./CanvasButtons.module.css";

// Clear Canvas Button
interface ClearButtonProps {
  onClick: () => void;
}

export function ClearCanvasButton({ onClick }: ClearButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.baseButton} ${styles.clearButton}`}
      onClick={onClick}
      aria-label="Clear Canvas"
      title="Clear Canvas"
    >
      Clear
    </button>
  );
}

// Undo Button
interface UndoButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function UndoButton({ onClick, disabled = false }: UndoButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.baseButton} ${styles.undoButton}`}
      onClick={onClick}
      disabled={disabled}
      aria-label="Undo"
      title="Undo last action"
    >
      Undo
    </button>
  );
}

// Redo Button
interface RedoButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function RedoButton({ onClick, disabled = false }: RedoButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.baseButton} ${styles.undoButton}`}
      onClick={onClick}
      disabled={disabled}
      aria-label="Redo"
      title="Redo last undone action"
    >
      Redo
    </button>
  );
}

// Download Options Button
interface DownloadButtonProps {
  elements: CanvasElement[];
}

export function DownloadButton({
  elements,
}: DownloadButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const downloadJson = () => {
    // Don't close the menu - keep it open
    const processedData = buildJSONFromElements(elements);
    const blob = new Blob([JSON.stringify(processedData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "canvas-data.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  //   setIsMenuOpen(false);
  //   await new Promise(requestAnimationFrame);

  //   const canvasNode = document.querySelector(canvasSelector);
  //   if (!canvasNode) return;

  //   try {
  //     const dataUrl = await domtoimage.toSvg(canvasNode);
  //     const link = document.createElement("a");
  //     link.href = dataUrl;
  //     link.download = "canvas.svg";
  //     link.click();
  //   } catch (error) {
  //     console.error("SVG download failed:", error);
  //   }
  // };

  const downloadPng = async () => {
    // Don't close the menu - keep it open
    await new Promise(requestAnimationFrame);

    // Find the canvas SVG element and its parent wrapper
    const canvasSvg = document.querySelector('[data-testid="canvas"]') as SVGElement;
    if (!canvasSvg) {
      console.error("Canvas SVG not found");
      return;
    }

    const canvasWrapper = canvasSvg.parentElement;
    if (!canvasWrapper) {
      console.error("Canvas wrapper not found");
      return;
    }

    try {
      const canvas = await html2canvas(canvasWrapper, {
        backgroundColor: "#ffffff",
        useCORS: true,
        scale: 2,
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "canvas-snapshot.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error("PNG download failed:", error);
    }
  };

  return (
    <div className={styles.downloadContainer} ref={containerRef}>
      <button
        type="button"
        className={`${styles.baseButton} ${styles.downloadButton}`}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        onClick={handleToggleMenu}
      >
        Download{" "}
        <span className={`${styles.dropdownCaret} ${isMenuOpen ? styles.caretRotated : ""}`} aria-hidden>
          ▾
        </span>
      </button>

      {isMenuOpen && (
        <div className={styles.downloadOptions}>
          <button
            type="button"
            className={`${styles.baseButton} ${styles.downloadOptionButton}`}
            onClick={downloadPng}
          >
            Download PNG
          </button>
          <button
            type="button"
            className={`${styles.baseButton} ${styles.downloadOptionButton}`}
            onClick={downloadJson}
          >
            Download JSON
          </button>
        </div>
      )}
    </div>
  );
}

// Zoom Controls
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.0;
const SCALE_STEP = 0.1;

interface ZoomControlsProps {
  scale: number;
  onScaleChange: (scale: number) => void;
}

export function ZoomControls({ scale, onScaleChange }: ZoomControlsProps) {
  const handleZoomIn = useCallback(() => {
    const next = Math.min(MAX_SCALE, Math.round((scale + SCALE_STEP) * 10) / 10);
    onScaleChange(next);
  }, [scale, onScaleChange]);

  const handleZoomOut = useCallback(() => {
    const next = Math.max(MIN_SCALE, Math.round((scale - SCALE_STEP) * 10) / 10);
    onScaleChange(next);
  }, [scale, onScaleChange]);

  return (
    <div className={styles.zoomControls}>
      <button
        type="button"
        className={`${styles.baseButton} ${styles.zoomButton}`}
        onClick={handleZoomOut}
        disabled={scale <= MIN_SCALE}
        aria-label="Zoom out"
        title="Zoom out"
      >
        −
      </button>
      <button
        type="button"
        className={`${styles.baseButton} ${styles.zoomButton}`}
        onClick={handleZoomIn}
        disabled={scale >= MAX_SCALE}
        aria-label="Zoom in"
        title="Zoom in"
      >
        +
      </button>
    </div>
  );
}

