import React from 'react'
import styles from '../styles/Canvas.module.css'
import { CanvasElement } from '../../shared/types'
interface Props {
  onClick: () => Promise<void>;
}

const SubmitButton: React.FC<Props> = ({ onClick }) => {
  /*
  const handleSubmit = async () => {
    try {
      const res = await submitCanvas(elements)
      console.log('Backend response:', res)
    } catch (error) {
      console.error('Error sending to backend:', error)
    }
  }*/
  return (
    <button className={styles.submitButton} onClick={onClick}>
      Submit
    </button>
  )
}

export default SubmitButton
