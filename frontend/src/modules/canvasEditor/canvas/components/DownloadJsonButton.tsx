import React from 'react';
import { CanvasElement } from '../../shared/types';
import { buildJSONFromElements } from '../../jsonConversion/jsonBuilder';
import styles from '../styles/Canvas.module.css';

interface Props {
  elements: CanvasElement[];
}

const DownloadJsonButton: React.FC<Props> = ({ elements }) => {
  const downloadJsonFile = () => {
    const processed = buildJSONFromElements(elements);
    const blob = new Blob([JSON.stringify(processed, null, 2)], {
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
