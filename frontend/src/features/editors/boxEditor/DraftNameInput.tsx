import { InputHTMLAttributes, useEffect, useRef, useState } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "onBlur" | "onKeyDown"> & {
  value: string;
  onCommit: (value: string) => void;
};

export default function DraftNameInput({ value, onCommit, ...props }: Props) {
  const [draft, setDraft] = useState(value);
  const pending = useRef(value);
  useEffect(() => { pending.current = value; setDraft(value); }, [value]);
  const commit = () => {
    if (pending.current !== value) {
      const next = pending.current;
      pending.current = value;
      onCommit(next);
    }
  };
  return <input {...props} value={draft}
    onChange={event => { pending.current = event.target.value; setDraft(event.target.value); }}
    onBlur={commit}
    onKeyDown={event => {
      if (event.nativeEvent.isComposing) return;
      if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); }
      if (event.key === "Escape") {
        event.stopPropagation();
        pending.current = value;
        setDraft(value);
        event.currentTarget.blur();
      }
    }} />;
}
