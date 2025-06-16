// canvas/components/DownloadJsonButton.tsx
import React from 'react';
import { CanvasElement } from '../../shared/types';
import styles from '../styles/Canvas.module.css';

interface Props {
  elements: CanvasElement[];
}

const DownloadJsonButton: React.FC<Props> = ({ elements }) => {

  return (
    <button className={styles.downloadJsonButton}>
      Download JSON
    </button>
  );
};

export default DownloadJsonButton;
