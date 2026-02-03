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

// Download Options Button
interface DownloadButtonProps {
  elements: CanvasElement[];
  canvasSelector?: string;
}

export function DownloadButton({
  elements,
  canvasSelector = ".canvasColumn",
}: DownloadButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const handleMenuOpen = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setIsMenuOpen(true);
  };

  const handleMenuClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setIsMenuOpen(false), 150);
  };

  const downloadJson = () => {
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
    setIsMenuOpen(false);
    await new Promise(requestAnimationFrame);

    const canvasNode = document.querySelector(canvasSelector) as HTMLElement;
    if (!canvasNode) return;

    const downloadButton = canvasNode.querySelector(
      `.${styles.downloadContainer}`
    ) as HTMLElement;
    const clearButton = canvasNode.querySelector(
      `.${styles.clearButton}`
    ) as HTMLElement;
    const zoomControls = canvasNode.querySelector(
      `.${styles.zoomControls}`
    ) as HTMLElement;
    const modeToggle = document.querySelector(
      '[data-editor-control="mode-toggle"]'
    ) as HTMLElement;

    const elementsToHide = [downloadButton, clearButton, zoomControls, modeToggle].filter(
      Boolean
    );

    const originalDisplays = elementsToHide.map((el) => el.style.display);

    elementsToHide.forEach((el) => {
      el.style.display = "none";
    });

    try {
      const canvas = await html2canvas(canvasNode, {
        backgroundColor: "#ffffff",
        useCORS: true,
        scale: 2,
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
    } finally {
      elementsToHide.forEach((el, index) => {
        el.style.display = originalDisplays[index];
      });
    }
  };

  return (
    <div
      className={styles.downloadContainer}
      onMouseEnter={handleMenuOpen}
      onMouseLeave={handleMenuClose}
    >
      <button
        type="button"
        className={`${styles.baseButton} ${styles.downloadButton}`}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
      >
        Download{" "}
        <span className={styles.dropdownCaret} aria-hidden>
          ▾
        </span>
      </button>

      {isMenuOpen && (
        <div
          className={styles.downloadMenu}
          role="menu"
          onMouseEnter={handleMenuOpen}
          onMouseLeave={handleMenuClose}
        >
          <button type="button" role="menuitem" onClick={downloadPng}>
            Download PNG
          </button>
          <button type="button" role="menuitem" onClick={downloadJson}>
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
