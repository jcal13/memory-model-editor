import styles from "../../Editor.module.css";
import IdDisplay from "../../idEditor/IdDisplay";
import ClassDisplay from "./ClassDisplay";
import { ID } from "../../../shared/types";

/**
 * Props for the ClassHeader component.
 */
interface Props {
  classes: string[];
  addClasses: (className: string) => void;
  ownClasses: string;
  setOwnClassName: (className: string) => void;
  removeClasses: (className: string) => void;
  ids: ID[];
  addId: (id: ID) => void;
  ownId: ID;
  setElementId: (id: ID) => void;
  removeId: (id: ID) => void;
  sandbox: boolean;
  elements?: any[];
}

/**
 * ClassHeader displays the class's name and its ID selector.
 */
const ClassHeader = ({
  classes,
  addClasses,
  ownClasses,
  setOwnClassName,
  removeClasses,
  ids,
  addId,
  ownId,
  setElementId,
  removeId,
  sandbox,
  elements = [],
}: Props) => (
  <div className={styles.collectionHeader}>
    <IdDisplay
      ids={ids}
      addId={addId}
      ownId={ownId}
      setElementId={setElementId}
      removeId={removeId}
      sandbox={sandbox}
      elements={elements}
    />
    <ClassDisplay
      classes={classes}
      addClassName={addClasses}
      ownClassName={ownClasses}
      setElementClassName={setOwnClassName}
      removeClassName={removeClasses}
      sandbox={sandbox}
    />
  </div>
);

export default ClassHeader;
