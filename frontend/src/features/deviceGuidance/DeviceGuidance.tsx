import { useEffect, useRef, useState } from "react";
import "./deviceGuidance.css";

// These are workspace limits, not device models. A tablet with a fine pointer
// can use the editor normally when it has enough room.
export const GUIDANCE_QUERIES = {
  small: "(max-width: 48rem), (max-height: 28rem)",
  touch: "(any-pointer: coarse)",
  fine: "(any-pointer: fine)",
};
export default function DeviceGuidance() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [recommended, setRecommended] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [manualLink, setManualLink] = useState("");

  useEffect(() => {
    const small = matchMedia(GUIDANCE_QUERIES.small);
    const touch = matchMedia(GUIDANCE_QUERIES.touch);
    const fine = matchMedia(GUIDANCE_QUERIES.fine);
    const update = () => setRecommended(small.matches || (touch.matches && !fine.matches));
    const queries = [small, touch, fine];
    update();
    queries.forEach(query => query.addEventListener("change", update));
    return () => queries.forEach(query => query.removeEventListener("change", update));
  }, []);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    // Handle cancellation on the native dialog itself, before browser dismissal.
    const preventCancel = (event: Event) => event.preventDefault();
    node.addEventListener("cancel", preventCancel);
    if (recommended) {
      if (!node.open) node.showModal();
    } else if (node.open) node.close();
    return () => {
      node.removeEventListener("cancel", preventCancel);
      if (node.open) node.close();
    };
  }, [recommended]);

  const copyLink = async () => {
    const link = window.location.href;
    try {
      await navigator.clipboard.writeText(link);
      setManualLink("");
      setCopyStatus("Link copied. Open it on your computer.");
    } catch {
      setManualLink(link);
      setCopyStatus("Copy the link below and open it on your computer.");
    }
  };

  return (
    <dialog ref={dialog} className="device-guidance" aria-labelledby="device-guidance-title"
      aria-describedby="device-guidance-description"
      onKeyDownCapture={event => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onClose={() => {
        if (recommended && dialog.current && !dialog.current.open) dialog.current.showModal();
      }}
      onCancel={event => {
        event.preventDefault();
      }}>
      <h1 id="device-guidance-title">Open MemoryLab on a computer</h1>
      <p id="device-guidance-description">The editor requires a mouse or trackpad and enough screen space. Open this page on a laptop or desktop. If you already use one, enlarge this window to continue.</p>
      <p className="device-guidance-note">The link opens the same page. Your saved diagram stays in this browser.</p>
      <div className="device-guidance-actions">
        <button type="button" className="device-guidance-primary" onClick={copyLink} autoFocus>Copy link</button>
      </div>
      <p role="status">{copyStatus}</p>
      {manualLink && <input aria-label="Page link" value={manualLink} readOnly onFocus={event => event.target.select()} />}
    </dialog>
  );
}
