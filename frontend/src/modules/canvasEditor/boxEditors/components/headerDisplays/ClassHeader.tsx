import styles from "../../styles/BoxEditorStyles.module.css";
import IdDisplay from "./components/IdDisplay";
import ClassDisplay from "./components/ClassDisplay"; // <--- import ClassDisplay
import { ID } from "../../../shared/types";

/**
 * Props for the ClassHeader component.
 */
interface Props {
  classes: string[];
  addClasses: (className: string) => void;
  ownClasses: string;
  setElementClassName: (className: string) => void;
  removeClasses: (className: string) => void;
  ids: ID[];
  addId: (id: ID) => void;
  ownId: ID;
  setElementId: (id: ID) => void;
  removeId: (id: ID) => void;
  sandbox: boolean;
}

/**
 * ClassHeader displays the class's name and its ID selector.
 */
const ClassHeader = ({

  classes,
  addClasses,
  ownClasses,
  setElementClassName,
  removeClasses,
  
  ids,
  addId,
  ownId,
  setElementId,
  removeId,
  sandbox,
}: Props) => (
  <div className={styles.collectionHeader}>
    <IdDisplay
      ids={ids}
      addId={addId}
      ownId={ownId}
      setElementId={setElementId}
      removeId={removeId}
      sandbox={sandbox}
    />
    <ClassDisplay
      classes={classes}
      addClassName={addClasses}
      ownClassName={ownClasses}
      setElementClassName={setElementClassName}
      removeClassName={removeClasses}
      sandbox={sandbox}
    />
  </div>
);

export default ClassHeader;

