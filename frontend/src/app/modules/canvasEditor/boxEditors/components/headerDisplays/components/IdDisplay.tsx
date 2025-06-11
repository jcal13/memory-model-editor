import styles from "../../../styles/BoxEditorStyles.module.css";
import { PrimitiveKind } from "../../../../shared/types";

interface Props {
  element: { id: string; kind: PrimitiveKind };
}

const IdDisplay = ({ element }: Props) => {
  return <div className={styles.moduleIdBox}>ID&nbsp;{element.id}</div>;
};

export default IdDisplay;
