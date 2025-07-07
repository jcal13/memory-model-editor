import BoxEditorModule from "./components/BoxEditorModule";
import { BoxEditorType } from "../shared/types";

/**
 * BoxEditor is a wrapper component that delegates
 * all rendering and logic to BoxEditorModule.
 *
 * @param metadata - The box metadata including ID, kind, and type-specific properties
 * @param onSave - Callback function to persist box changes
 * @param onRemove - Callback function to remove the box
 */
const BoxEditor = ({ metadata, onSave, onRemove, onClose, ids, addId, removeId, sandbox = true }: BoxEditorType) => {
  return (
    <BoxEditorModule metadata={metadata} onSave={onSave} onRemove={onRemove} ids={ids} addId={addId} removeId={removeId} sandbox={sandbox} onClose={onClose}/>
  );
};

export default BoxEditor;
