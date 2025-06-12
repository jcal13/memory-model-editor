import styles from "../../styles/BoxEditorStyles.module.css";
import { ID

 } from "../../../shared/types";
/**
 * Props for the FunctionContent component.
 */
interface Props {
  functionParams: any; // Array of parameter objects for the function
  setParams: any; // Setter to update the list of parameters
  ids: ID[];
  addId: (id: ID) => void;
}

/**
 * FunctionContent renders editable fields for function parameters.
 *
 * Each parameter consists of:
 * - A `name` input box for variable name
 * - A visual placeholder for the parameter's target ID
 * - A remove button to delete the parameter
 *
 * The component also provides an "Add Variable" button to append a new parameter.
 */
const FunctionContent = ({ functionParams, setParams }: Props) => {
  // Add a new empty parameter to the list
  const addParam = () =>
    setParams([...functionParams, { name: "", targetId: null }]);

  // Remove a parameter at a given index
  const removeParam = (i: number) =>
    setParams(functionParams.filter((_: any, idx: any) => idx !== i));

  // Update the name of a parameter at a given index
  const changeName = (i: number, val: string) =>
    setParams(
      functionParams.map((p: any, idx: any) =>
        idx === i ? { ...p, name: val } : p
      )
    );

  return (
    <div className={styles.contentContainer}>
      {functionParams.length > 0 && (
        <div className={styles.ItemContainer}>
          {functionParams.map((p: any, idx: any) => (
            <div key={idx} className={styles.pairItem}>
              <input
                placeholder="var"
                value={p.name}
                onChange={(e) => changeName(idx, e.target.value)}
                className={styles.variableNameBox}
              />
              <div className={styles.functionIdBox}>
                <div className={styles.functionIdBoxText}>+</div>
                <button
                  onClick={() => removeParam(idx)}
                  className={styles.removeItem}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div>
        <button className={styles.addButton} onClick={addParam}>
          Add Variable
        </button>
      </div>
    </div>
  );
};

export default FunctionContent;
