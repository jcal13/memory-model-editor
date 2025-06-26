import React from 'react';
import { CanvasElement } from '../../shared/types';
import styles from '../styles/Canvas.module.css';

interface Props {
  elements: CanvasElement[];
}

const SubmitButton: React.FC<Props> = ({ elements }) => {
  return (
    <button className={styles.submitButton}>
      Submit
    </button>
  );
};

export default SubmitButton;