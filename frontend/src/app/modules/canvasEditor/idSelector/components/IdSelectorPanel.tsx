import React, { useState } from "react";
import styles from "../styles/IdSelector.module.css";
import { ID } from "../../shared/types";

interface Props {
  ids: ID[];
  onAdd: (id: ID) => void;
  onSelect: (id: ID) => void;
}

export default function IdSelectorPanel({ ids, onAdd, onSelect }: Props) {
  const [newId, setNewId] = useState("");

  const add = () => {
    const trimmed = newId.trim();
    if (!trimmed) return;               // ignore blank input

    let id: ID;
    if (trimmed === "None") {
      id = "None";                      // accept literal "None"
    } else {
      const num = Number(trimmed);
      if (Number.isNaN(num)) return;    // reject non-numeric strings
      id = num;
    }

    if (ids.includes(id)) return;       // duplicate guard
    setNewId("");
    onAdd(id);
  };

  return (
    <div className={styles.panel}>
      {/* === Header (drag handle) === */}
      <div className={`drag-handle ${styles.header}`}>ID Selector</div>

      {/* === Add-new form === */}
      <div className={styles.form}>
        <input
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
          placeholder='New ID (number or "None")'
        />
        <button type="button" onClick={add}>
          Add
        </button>
      </div>

      {/* === ID list === */}
      <ul className={styles.list}>
        {ids.map((id) => (
          <li key={id.toString()}>
            <button type="button" onClick={() => onSelect(id)}>
              {id}
            </button>
          </li>
        ))}
        {ids.length === 0 && <li className={styles.empty}>No IDs yet</li>}
      </ul>
    </div>
  );
}
