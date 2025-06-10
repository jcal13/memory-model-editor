import { pill } from "../../../styles/boxEditorStyles";

interface Props {
  typeLabel: any;
}

const TypeDisplay = ({ typeLabel }: Props) => {
  return <span style={pill}>{typeLabel}</span>;
};

export default TypeDisplay;
