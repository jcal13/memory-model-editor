import styles from "../Editor.module.css";
import IdDisplay from "../idEditor/IdDisplay";
import ClassDisplay from "./classBoxes/ClassDisplay";
import FunctionNameSelector from "../functionEditor/FunctionNameSelector";
import { PrimitiveType, ID } from "../../shared/types";

interface Props {
  element: any;
  dataType: any;
  setDataType: React.Dispatch<React.SetStateAction<PrimitiveType>>;
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  functionName: string;
  setFunctionName: (name: string) => void;
  functionNames: string[];
  setFunctionNames: React.Dispatch<React.SetStateAction<string[]>>;
  ids: ID[];
  addId: (id: ID) => void;
  ownId: ID;
  setElementId: (id: ID) => void;
  removeId: (id: ID) => void;
  sandbox: boolean;
  classes?: string[];
  addClasses?: (className: string) => void;
  ownClasses?: string;
  setOwnClassName?: (className: string) => void;
  removeClasses?: (className: string) => void;
  elements?: any[];
  onClose: () => void;
}

const KIND_LABELS: Record<string, string> = {
  primitive: "Primitive",
  function: "Function",
  list: "List",
  set: "Set",
  tuple: "Tuple",
  dict: "Dict",
  class: "Class",
};

/**
 * Header renders a title bar (type label left, × right) and a
 * meta row with the ID chip on the left and type badge on the right.
 */
const Header = ({
  element,
  dataType,
  functionName,
  setFunctionName,
  functionNames,
  setFunctionNames,
  ids,
  addId,
  ownId,
  setElementId,
  removeId,
  sandbox,
  classes = [],
  addClasses = () => {},
  ownClasses = "",
  setOwnClassName = () => {},
  removeClasses = () => {},
  elements = [],
  onClose,
}: Props) => {
  const kind = element.kind.name;
  const titleLabel = KIND_LABELS[kind] ?? kind;

  // Meta row right side: for primitives show the actual type (int/bool/etc),
  // for class show the class chip, for function show the function name selector,
  // for others show kind label
  const typeLabel =
    kind === "primitive"
      ? dataType ?? "primitive"
      : KIND_LABELS[kind] ?? kind;

  const handleFunctionAdd = (name: string) => {
    if (!functionNames.includes(name)) {
      setFunctionNames((prev) => [...prev, name]);
    }
  };

  const handleFunctionRemove = (name: string) => {
    setFunctionNames((prev) => prev.filter((n) => n !== name));
  };

  return (
    <>
      {/* Title bar: type label left, × right */}
      <div className={`drag-handle ${styles.titleBar}`}>
        <span className={styles.titleBarLabel}>{titleLabel}</span>
        <button className={styles.removeItem} onClick={onClose} title="Close">
          ×
        </button>
      </div>

      {/* Meta row: ID chip left, type/class/function chip right */}
      <div className={styles.metaRow}>
        <IdDisplay
          ids={ids}
          addId={addId}
          ownId={ownId}
          setElementId={setElementId}
          removeId={removeId}
          sandbox={sandbox}
          elements={elements}
        />
        <div className={styles.metaRowRight}>
          {kind === "class" ? (
            <ClassDisplay
              classes={classes}
              addClassName={addClasses}
              ownClassName={ownClasses}
              setElementClassName={setOwnClassName}
              removeClassName={removeClasses}
              sandbox={sandbox}
            />
          ) : kind === "function" ? (
            <FunctionNameSelector
              names={functionNames}
              currentName={functionName}
              onSelect={setFunctionName}
              onAdd={handleFunctionAdd}
              onRemove={handleFunctionRemove}
              buttonClassName={styles.moduleIdBox}
              editable={true}
              sandbox={sandbox}
            />
          ) : (
            <span className={styles.typeChip}>{typeLabel}</span>
          )}
        </div>
      </div>
    </>
  );
};

export default Header;
