import styles from "../../styles/boxEditorStyles.module.css";

interface Props {
  functionParams: any;
  setParams: any;
}

const FunctionContent = ({ functionParams, setParams }: Props) => {
  const addParam = () =>
    setParams([...functionParams, { name: "", targetId: null }]);
  const removeParam = (i: number) =>
    setParams(functionParams.filter((_: any, idx: any) => idx !== i));
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
              <div className={styles.idBox}>
                <div className={styles.idBoxText}>+</div>
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
