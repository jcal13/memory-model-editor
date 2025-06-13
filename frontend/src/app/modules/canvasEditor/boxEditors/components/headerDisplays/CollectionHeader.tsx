import IdDisplay from "./components/IdDisplay";
import TypeDisplay from "./components/TypeDisplay";
import { ID } from "../../../shared/types";

interface Props {
  element: any; // The memory element object containing an ID and kind information
  ids: ID[];
  addId: (id: ID) => void;
  ownId: ID;
  setElementId: (id: ID) => void;
  removeId: (id: ID) => void;
}

/**
 * CollectionHeader displays metadata for a collection-type memory element.
 *
 * It includes:
 * - The element's ID using the IdDisplay component.
 * - The element's type label using the TypeDisplay component.
 *
 * This component is typically used at the top of collection editors (like list, set, tuple, or dict).
 */
const CollectionHeader = ({
  element,
  ids,
  addId,
  ownId,
  setElementId,
  removeId,
}: Props) => (
  <div data-testid="collection-header">
    <IdDisplay
      ids={ids}
      addId={addId}
      ownId={ownId}
      setElementId={setElementId}
      removeId={removeId}
    />
    <TypeDisplay typeLabel={element.kind.type} />
  </div>
);

export default CollectionHeader;
