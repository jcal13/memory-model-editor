import styles from "../../../styles/BoxEditorStyles.module.css";

interface Props {
  typeLabel: any;
}

const TypeDisplay = ({ typeLabel }: Props) => {
  return <div className={styles.typeDisplay}>{typeLabel}</div>;
};

export default TypeDisplay;
