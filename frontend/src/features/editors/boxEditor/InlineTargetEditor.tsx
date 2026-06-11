import React, { useEffect, useMemo, useState } from "react";
import {
  CanvasElement,
  ElementError,
  ID,
  PrimitiveType,
} from "../../shared/types";
import PrimitiveContent from "./primitiveBoxes/PrimitiveContent";
import styles from "../Editor.module.css";
import FieldValidationTooltip from "./FieldValidationTooltip";
import { getErrorsForId, isIdInvalid } from "../utils/validationHelpers";
import {
  createDefaultPrimitiveKind,
  getReferenceOptionLabel,
  getReferenceableElements,
  normalizeInlineTarget,
  upsertInlinePrimitive,
  InlineTargetValue,
} from "../utils/pythonTutorInlinePrimitives";
import {
  createElementsByIdMap,
  isPrimitiveElement,
} from "../../canvas/utils/pythonTutorReferences";

interface InlineTargetEditorProps {
  ownerElement: CanvasElement;
  currentTarget: InlineTargetValue;
  blankValue?: ID | string;
  onTargetChange: (nextTarget: ID | string) => void;
  addId: (id: ID) => void;
  elements: CanvasElement[];
  onElementsChange?: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  validationErrors?: ElementError[];
}

const BLANK_OPTION = "__blank__";

export default function InlineTargetEditor({
  ownerElement,
  currentTarget,
  blankValue = "_",
  onTargetChange,
  addId,
  elements,
  onElementsChange,
  validationErrors,
}: InlineTargetEditorProps) {
  const elementsById = useMemo(() => createElementsByIdMap(elements), [elements]);
  const currentNumericTarget = normalizeInlineTarget(currentTarget);
  const currentTargetElement =
    currentNumericTarget !== null ? elementsById.get(currentNumericTarget) : undefined;
  const currentPrimitiveTarget =
    currentTargetElement && isPrimitiveElement(currentTargetElement)
      ? currentTargetElement
      : null;
  const [mode, setMode] = useState<"reference" | "primitive">(
    currentPrimitiveTarget ? "primitive" : "reference"
  );
  const [primitiveType, setPrimitiveType] = useState<PrimitiveType>(
    currentPrimitiveTarget?.kind.type ?? "int"
  );
  const [primitiveValue, setPrimitiveValue] = useState(
    currentPrimitiveTarget?.kind.value ?? "0"
  );

  const referenceableElements = useMemo(
    () => getReferenceableElements(elements),
    [elements]
  );
  const hasExplicitReferenceOption =
    currentNumericTarget !== null &&
    referenceableElements.some((element) => element.id === currentNumericTarget);
  const hasReferenceError = isIdInvalid(validationErrors, currentNumericTarget);
  const referenceErrors = getErrorsForId(validationErrors, currentNumericTarget);

  useEffect(() => {
    if (!currentPrimitiveTarget) {
      return;
    }

    setPrimitiveType(currentPrimitiveTarget.kind.type);
    setPrimitiveValue(currentPrimitiveTarget.kind.value);
  }, [currentPrimitiveTarget]);

  const applyPrimitiveKind = (type: PrimitiveType, value: string) => {
    if (!onElementsChange) return;

    const primitiveKind = {
      name: "primitive" as const,
      type,
      value,
    };
    const nextPrimitiveState = upsertInlinePrimitive({
      elements,
      ownerElement,
      currentTarget,
      primitiveKind,
    });

    if (nextPrimitiveState.targetId !== currentNumericTarget) {
      onTargetChange(nextPrimitiveState.targetId);
    }
    if (nextPrimitiveState.created) {
      addId(nextPrimitiveState.targetId);
    }

    onElementsChange((prevElements) => {
      const liveOwnerElement =
        prevElements.find((element) => element.boxId === ownerElement.boxId) ??
        ownerElement;

      return upsertInlinePrimitive({
        elements: prevElements,
        ownerElement: liveOwnerElement,
        currentTarget,
        primitiveKind,
      }).elements;
    });
  };

  const handleModeSelectChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const nextValue = event.target.value as PrimitiveType | "reference";

    if (nextValue === "reference") {
      setMode("reference");
      if (currentPrimitiveTarget) {
        onTargetChange(blankValue);
      }
      return;
    }

    const defaultKind = createDefaultPrimitiveKind(nextValue);
    setMode("primitive");
    setPrimitiveType(defaultKind.type);
    setPrimitiveValue(defaultKind.value);
    applyPrimitiveKind(defaultKind.type, defaultKind.value);
  };

  const handlePrimitiveValueChange: React.Dispatch<
    React.SetStateAction<string>
  > = (nextValue) => {
    const resolvedValue =
      typeof nextValue === "function" ? nextValue(primitiveValue) : nextValue;

    setPrimitiveValue(resolvedValue);
    applyPrimitiveKind(primitiveType, resolvedValue);
  };

  const handleReferenceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextValue = event.target.value;

    if (nextValue === BLANK_OPTION) {
      onTargetChange(blankValue);
      return;
    }

    onTargetChange(parseInt(nextValue, 10));
  };

  const referenceSelect = (
    <select
      value={
        currentPrimitiveTarget || currentNumericTarget === null
          ? BLANK_OPTION
          : `${currentNumericTarget}`
      }
      onChange={handleReferenceChange}
      className={`${styles.inlineTargetSelect} ${
        hasReferenceError ? styles.errorId : ""
      }`}
    >
      <option value={BLANK_OPTION}>Unassigned</option>
      {currentNumericTarget !== null &&
        !currentPrimitiveTarget &&
        !hasExplicitReferenceOption && (
          <option value={currentNumericTarget}>{`id${currentNumericTarget}`}</option>
        )}
      {referenceableElements.map((element) => (
        <option key={element.id} value={element.id}>
          {getReferenceOptionLabel(element)}
        </option>
      ))}
    </select>
  );

  return (
    <div className={styles.inlineTargetEditor}>
      <select
        value={mode === "primitive" ? primitiveType : "reference"}
        onChange={handleModeSelectChange}
        className={styles.inlineTargetModeSelect}
      >
        <option value="reference">Reference</option>
        <option value="NoneType">None</option>
        <option value="int">int</option>
        <option value="float">float</option>
        <option value="str">str</option>
        <option value="bool">bool</option>
      </select>

      <div className={styles.inlineTargetBody}>
        {mode === "primitive" ? (
          <PrimitiveContent
            dataType={primitiveType}
            value={primitiveValue}
            setValue={handlePrimitiveValueChange}
          />
        ) : (
          <FieldValidationTooltip errors={referenceErrors}>
            {referenceSelect}
          </FieldValidationTooltip>
        )}
      </div>
    </div>
  );
}
