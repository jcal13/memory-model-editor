import React, { useRef, useState } from "react";
import { CanvasElement } from "../../shared/types";
import { buildJSONFromElements } from "../../validation/jsonBuilder";
import styles from "../Canvas.module.css";
import canvasStyles from "../../../MemoryModelEditor.module.css";
import html2canvas from "html2canvas";
import domtoimage from "dom-to-image";

interface Props {
  elements: CanvasElement[];
}

const DownloadOptionsButton: React.FC<Props> = ({ elements }) => {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const openNow = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setIsOpen(true);
  };

  const closeSoon = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setIsOpen(false), 150);
  };

  const downloadJsonFile = () => {
    const processed = buildJSONFromElements(elements);
    const blob = new Blob([JSON.stringify(processed, null, 2)], {
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

  const downloadSvgFile = async () => {
    setIsOpen(false);
    await new Promise(requestAnimationFrame);

    const node = document.querySelector(`.${canvasStyles.column}`)!;

    domtoimage
      .toSvg(node)
      .then((dataUrl: string) => {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "canvas.svg";
        link.click();
      })
      .catch(console.error);
  };

  const downloadPngFile = async () => {
    setIsOpen(false);
    await new Promise(requestAnimationFrame);

    const canvasRoot = document.querySelector(
      `.${canvasStyles.column}`
    ) as HTMLElement | null;
    if (!canvasRoot) return;

    const canvas = await html2canvas(canvasRoot, {
      backgroundColor: "#ffffff",
      useCORS: true,
      scale: 2, // higher resolution
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
  };

  return (
    <div
      className={styles.downloadContainer}
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        type="button"
        className={styles.downloadBtn}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        Download{" "}
        <span className={styles.caret} aria-hidden>
          ▾
        </span>
      </button>

      {isOpen && (
        <div
          className={styles.downloadMenu}
          role="menu"
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
        >
          <button type="button" role="menuitem" onClick={downloadSvgFile}>
            Download SVG
          </button>
          <button type="button" role="menuitem" onClick={downloadPngFile}>
            Download PNG
          </button>
          <button type="button" role="menuitem" onClick={downloadJsonFile}>
            Download JSON
          </button>
        </div>
      )}
    </div>
  );
};

export default DownloadOptionsButton;
