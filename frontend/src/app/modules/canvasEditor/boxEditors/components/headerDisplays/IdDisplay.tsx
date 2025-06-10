import { pill } from "../../styles/boxEditorStyles";
import { PrimitiveKind } from "../../../shared/types";

interface Props {
  element: { id: string; kind: PrimitiveKind };
}

const IdDisplay = ({ element }: Props) => {
  return <span style={pill}>ID&nbsp;{element.id}</span>;
};

export default IdDisplay;
