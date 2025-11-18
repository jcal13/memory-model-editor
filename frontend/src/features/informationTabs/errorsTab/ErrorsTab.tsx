import { MasterErrorList, flattenErrorList } from "../../memoryModelEditor/utils/masterErrorList";
import { CanvasElement, ErrorSource } from "../../shared/types";
import ErrorListDisplay from "../components/ErrorListDisplay";

interface ErrorsTabProps {
  masterErrorList: MasterErrorList;
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  onOpenEditor: (element: CanvasElement) => void;
}

export default function ErrorsTab({ 
  masterErrorList, 
  elements,
  setElements,
  onOpenEditor 
}: ErrorsTabProps) {
  
  // Get all errors and filter for validation errors only
  const allErrors = flattenErrorList(masterErrorList);
  const validationErrors = allErrors.filter(
    (item) => item.error.source === ErrorSource.VALIDATION
  );

  return (
    <ErrorListDisplay
      errors={validationErrors}
      elements={elements}
      setElements={setElements}
      onOpenEditor={onOpenEditor}
      title="Validation Errors"
      emptyStateMessage="No validation errors detected"
      emptyStateSubtext="Your memory model is valid and ready to submit."
    />
  );
}
