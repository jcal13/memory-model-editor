// canvas/components/DownloadJsonButton.tsx
import React from 'react';
import { CanvasElement } from '../../shared/types';
import styles from '../styles/Canvas.module.css';

interface Props {
  elements: CanvasElement[];
}

const DownloadJsonButton: React.FC<Props> = ({ elements }) => {
  const downloadJsonFile = () => {
    const blob = new Blob([JSON.stringify(elements, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'canvas-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={downloadJsonFile} className={styles.downloadJsonButton}>
      Download JSON
    </button>
  );
};

export default DownloadJsonButton;
