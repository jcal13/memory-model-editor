import styles from "../../styles/BoxEditorStyles.module.css";
import { ID } from "../../../shared/types";
import IdSelector from "../../../idSelector/IdSelector";

/**
 * Props for the ClassContent component.
 */
interface Props {
  classVariables: any; // Array of variable objects for the class
  setVariables: any;   // Setter to update the list of variables
  ids: any;
  addId: (id: ID) => void;
  removeId: (id: ID) => void;
  sandbox: boolean;
}

/**
 * ClassContent renders editable fields for class variables (attributes).
 *
 * Each variable consists of:
 * - A `name` input box for attribute name
 * - A visual placeholder for the variable's target ID
 * - A remove button to delete the variable
 *
 * The component also provides an "Add Variable" button to append a new attribute.
 */
const ClassContent = ({ classVariables, setVariables, ids, addId, removeId, sandbox }: Props) => {
  // Add a new empty variable to the list
  const addVariable = () =>
    setVariables([...classVariables, { name: "", targetId: null }]);

  // Remove a variable at a given index
  const removeVariable = (i: number) =>
    setVariables(classVariables.filter((_: any, idx: any) => idx !== i));

  // Update the name of a variable at a given index
  const changeName = (i: number, val: string) =>
    setVariables(
      classVariables.map((v: any, idx: any) =>
        idx === i ? { ...v, name: val } : v
      )
    );

  // Update the targetId of a variable at a given index
  const setTargetId = (i: number, id: ID) =>
    setVariables(
      classVariables.map((v: any, idx: any) =>
        idx === i ? { ...v, targetId: id } : v
      )
    );

  return (
    <div className={styles.contentContainer}>
      {classVariables.length > 0 && (
        <div className={styles.ItemContainer}>
          {classVariables.map((v: any, idx: any) => (
            <div key={idx} className={styles.pairItem}>
              <input
                placeholder="variable"
                value={v.name}
                onChange={(e) => changeName(idx, e.target.value)}
                className={styles.variableNameBox}
              />
              <div className={styles.idSelectButtonWrapper}>
                <IdSelector
                  currentId={v.targetId}
                  ids={ids}
                  onAdd={addId}
                  onSelect={(id) => setTargetId(idx, id)}
                  onRemove={removeId}
                  buttonClassName={styles.collectionIdBox}
                  sandbox={sandbox}
                  editable={true}
                />
                <button
                  onClick={() => removeVariable(idx)}
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
        <button className={styles.addButton} onClick={addVariable}>
          Add Variable
        </button>
      </div>
    </div>
  );
};

export default ClassContent;
