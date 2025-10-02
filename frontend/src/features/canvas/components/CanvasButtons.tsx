import React, { useRef, useState } from "react";
import { CanvasElement } from "../../shared/types";
import { buildJSONFromElements } from "../../validationServices/jsonBuilder";
import html2canvas from "html2canvas";
import domtoimage from "dom-to-image";
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

  const downloadSvg = async () => {
    setIsMenuOpen(false);
    await new Promise(requestAnimationFrame);

    const canvasNode = document.querySelector(canvasSelector);
    if (!canvasNode) return;

    try {
      const dataUrl = await domtoimage.toSvg(canvasNode);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "canvas.svg";
      link.click();
    } catch (error) {
      console.error("SVG download failed:", error);
    }
  };

  const downloadPng = async () => {
    setIsMenuOpen(false);
    await new Promise(requestAnimationFrame);

    const canvasNode = document.querySelector(canvasSelector) as HTMLElement;
    if (!canvasNode) return;

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
          <button type="button" role="menuitem" onClick={downloadSvg}>
            Download SVG
          </button>
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
