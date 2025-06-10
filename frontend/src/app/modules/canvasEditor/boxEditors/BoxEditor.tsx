import BoxEditorModule from "./components/BoxEditorModule";
import { BoxEditorType } from "../shared/types";

const BoxEditor = ({ metadata, onSave, onRemove }: BoxEditorType) => {
  return (
    <BoxEditorModule metadata={metadata} onSave={onSave} onRemove={onRemove} />
  );
};

export default BoxEditor;
