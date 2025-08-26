import IdDisplay from "../../idEditor/IdDisplay";
import styles from "../BoxEditorStyles.module.css";
import { ID, PrimitiveType } from "../../../shared/types";

/**
 * PrimitiveHeader now shows a read‑only pill with the fixed
 * primitive type instead of the old dropdown.
 */

interface Props {
  element: any;
  dataType: PrimitiveType;
  setDataType: (t: PrimitiveType) => void;
  value: string;
  setValue: (v: string) => void;
  ids: ID[];
  addId: (id: ID) => void;
  ownId: ID;
  setElementId: (id: ID) => void;
  removeId: (id: ID) => void;
  sandbox: boolean;
}

const PrimitiveHeader = ({
  dataType,
  ids,
  addId,
  ownId,
  setElementId,
  removeId,
  sandbox,
}: Props) => (
  <div className={styles.header} data-testid="primitive-header">
    <IdDisplay
      ids={ids}
      addId={addId}
      ownId={ownId}
      setElementId={setElementId}
      removeId={removeId}
      sandbox={sandbox}
    />
  </div>
);

export default PrimitiveHeader;
