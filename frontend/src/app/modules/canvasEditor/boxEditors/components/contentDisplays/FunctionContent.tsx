import styles from "../../styles/BoxEditorStyles.module.css";
import { ID } from "../../../shared/types";
import IdSelector from "../../../idSelector/IdSelector";

/**
 * Props for the FunctionContent component.
 */
interface Props {
  functionParams: any; // Array of parameter objects for the function
  setParams: any; // Setter to update the list of parameters
  ids: any;
  addId: (id: ID) => void;
  removeId: (id: ID) => void;
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
const FunctionContent = ({ functionParams, setParams, ids, addId, removeId }: Props) => {
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

  // Update the targetId of a parameter at a given index
  const setTargetId = (i: number, id: ID) =>
    setParams(
      functionParams.map((p: any, idx: any) =>
        idx === i ? { ...p, targetId: id } : p
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
              <div className={styles.idSelectButtonWrapper}>
                <IdSelector
                  currentId={p.targetId}
                  ids={ids}
                  onAdd={addId}
                  onSelect={(id) => setTargetId(idx, id)}
                  onRemove={removeId}
                  buttonClassName={styles.collectionIdBox}
                />
                <button
                  onClick={() => removeParam(idx)}
                  className={styles.collectionRemoveId}
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
