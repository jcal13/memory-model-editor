import styles from "../../../styles/boxEditorStyles.module.css";

interface Props {
  typeLabel: any;
}

const TypeDisplay = ({ typeLabel }: Props) => {
  return <span>{typeLabel}</span>;
};

export default TypeDisplay;
