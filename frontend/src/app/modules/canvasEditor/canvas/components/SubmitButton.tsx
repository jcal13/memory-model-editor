import React from "react";
import { CanvasElement } from "../../shared/types";
import styles from "../styles/Canvas.module.css";
import { buildJSONFromElements } from "../../jsonConversion/jsonBuilder";

interface Props {
  elements: CanvasElement[];
}

const SubmitButton: React.FC<Props> = ({ elements }) => {
  const handleSubmit = async () => {
    const data = buildJSONFromElements(elements);

    try {
      const response = await fetch(
        "http://localhost:3001/canvasEditor/submit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const res = await response.json();
      console.log("Backend response:", res);
    } catch (error) {
      console.error("Error sending to backend:", error);
    }
  };

  return (
    <button className={styles.submitButton} onClick={handleSubmit}>
      Submit
    </button>
  );
};

export default SubmitButton;
