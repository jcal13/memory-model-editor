import styles from "../../../styles/boxEditorStyles.module.css";
import { PrimitiveKind } from "../../../../shared/types";

interface Props {
  element: { id: string; kind: PrimitiveKind };
}

const IdDisplay = ({ element }: Props) => {
  return <span className={styles.pill}>ID&nbsp;{element.id}</span>;
};

export default IdDisplay;
