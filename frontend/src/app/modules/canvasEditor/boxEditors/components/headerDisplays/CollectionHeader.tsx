import IdDisplay from "./components/IdDisplay";
import TypeDisplay from "./components/TypeDisplay";

interface Props {
  element: any;
}

const CollectionHeader = ({ element }: Props) => (
  <>
    <IdDisplay element={element} />
    <TypeDisplay typeLabel={element.kind.type} />
  </>
);

export default CollectionHeader;
