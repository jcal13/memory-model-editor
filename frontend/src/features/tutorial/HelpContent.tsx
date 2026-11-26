import { ReactNode } from "react";
import { inlineEditingEnabled } from "../inlineEditing/enabled";

function Icon({ kind }: { kind: "compass" | "book" | "box" | "link" | "check" | "sliders" }) {
  const paths: Record<string, ReactNode> = {
    compass: <><circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5Z"/></>,
    book: <><path d="M3 4h6a4 4 0 0 1 3 2 4 4 0 0 1 3-2h6v15h-6a4 4 0 0 0-3 2 4 4 0 0 0-3-2H3Z"/><path d="M12 6v15"/></>,
    box: <><path d="m12 3 9 5v9l-9 5-9-5V8Z M3 8l9 5 9-5 M12 13v9 M7 5.8l9 5"/></>,
    link: <><path d="M10 14 14 10 M8 16l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0 M16 8l1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0" transform="translate(1 0) scale(.9)"/></>,
    check: <><circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/></>,
    sliders: <><path d="M4 7h16 M4 17h16"/><circle cx="9" cy="7" r="3" fill="currentColor"/><circle cx="16" cy="17" r="3" fill="currentColor"/></>,
  };
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>;
}

export default function HelpContent({ onStart }: { onStart: () => void }) {
  const inline = inlineEditingEnabled();
  return <>
    <p className="help-intro">Learn to turn Python code into a picture of memory.</p>
    <button className="tutorial-launch" onClick={onStart}>
      <span className="help-tour-icon"><Icon kind="compass"/></span>
      <span className="help-tour-copy"><strong>New to Memory Lab? Take the guided tour</strong><span>A fresh Question 1 demo · Learn by dragging, editing, and connecting</span></span>
      <span className="help-arrow" aria-hidden="true">→</span>
    </button>
    <p className="help-demo-note">The tour stays in one demo exercise. Your regular questions and saved work are kept separate.</p>
    <div className="help-section-label">YOUR FIRST MEMORY MODEL</div>
    <section className="help-lesson">
      <span className="help-icon help-blue"><Icon kind="book"/></span>
      <div><h2>1. Read the code</h2><p>Choose a question and read the code on the right. Build the memory model for the point the question asks about.</p><div className="help-code"><code>a = 5</code><span>A variable named <b>a</b> refers to an integer object.</span></div></div>
    </section>
    <section className="help-lesson">
      <span className="help-icon help-violet"><Icon kind="box"/></span>
      <div><h2>2. Add and edit objects</h2>{inline
        ? <><p>Drag an <b>int</b> from the left palette onto the canvas, type <b>5</b>, and press Enter. To change a value later, click it right in the box.</p><span className="help-tip">Drag to place · Click any part of a box to edit it · Changes save automatically</span></>
        : <><p>Drag an <b>int</b> from the left palette onto the canvas. Click the box and enter <b>5</b> in its value field.</p><span className="help-tip">Drag to place · Click to edit · Changes save automatically</span></>}</div>
    </section>
    <section className="help-lesson">
      <span className="help-icon help-amber"><Icon kind="link"/></span>
      <div><h2>3. Connect variables to objects</h2>{inline
        ? <p>Hover <code>__main__</code> and click the <b>+</b> on its bottom edge. Type <b>a</b>, press Enter, then type the ID of the object containing 5 (or drag from the ID slot onto that object).</p>
        : <p>Open <code>__main__</code>, choose <b>Add Variable</b>, and name it <b>a</b>. Use its ID selector to choose the object containing 5.</p>}<div className="help-memory" aria-label="Variable a references object ID 1, an integer with value 5"><span className="help-variable">a <small>variable</small></span><span aria-hidden="true">→</span><span className="help-object"><span><b>id1</b><b>int</b></span><strong>5</strong></span></div><span className="help-tip">An ID identifies an object. It is different from the object’s value.</span></div>
    </section>
    <section className="help-lesson">
      <span className="help-icon help-green"><Icon kind="check"/></span>
      <div><h2>4. Check and learn</h2><p>Click <b>Submit</b>, read the feedback below the question, then revise your model. Highlighted line numbers let you check an earlier point in the code.</p></div>
    </section>
    <section className="help-lesson">
      <span className="help-icon help-blue"><Icon kind="sliders"/></span>
      <div><h2>Keyboard shortcuts</h2>
        <ul className="help-keys">
          <li><kbd>[</kbd> / <kbd>]</kbd> hide or show the palette / question panel</li>
          <li><kbd>⌘/Ctrl</kbd>+<kbd>Z</kbd> undo · <kbd>⇧</kbd>+<kbd>⌘/Ctrl</kbd>+<kbd>Z</kbd> redo</li>
          {inline && <li>Click any value, name, type or ID to edit it · <kbd>Enter</kbd> save · <kbd>Tab</kbd> next field · <kbd>Esc</kbd> cancel</li>}
          {inline && <li><kbd>N</kbd> add an object (pick a type with the arrow keys or its letter), or focus a palette box and press <kbd>Enter</kbd></li>}
          {inline && <li><kbd>Tab</kbd> moves between boxes · arrow keys move the focused box (<kbd>⇧</kbd> for bigger steps) · <kbd>Enter</kbd> edits it · <kbd>+</kbd> adds a variable, element or pair</li>}
          {inline && <li><kbd>Delete</kbd> removes the selected box · <kbd>⇧</kbd>+<kbd>Delete</kbd> (or <kbd>⇧</kbd>+<kbd>⌘/Ctrl</kbd>+<kbd>⌫</kbd>) while editing a slot removes that slot</li>}
          {inline && <li>In an ID or type list, <kbd>↑</kbd> / <kbd>↓</kbd> choose a suggestion and <kbd>Enter</kbd> picks it</li>}
          <li>Canvas Controls → View → <b>Text View</b> shows your model as text (screen readers can always read it)</li>
        </ul>
      </div>
    </section>
    <section className="help-lesson help-tools">
      <span className="help-icon help-blue"><Icon kind="sliders"/></span>
      <div><h2>Make room to think</h2><p>Drag the panel divider to widen the question. Use <b>Undo / Redo</b> for small changes, <b>Reset</b> for a fresh attempt, and <b>Download</b> to export your model.</p><p className="help-tip">During the demo: Hide / Show guide (top of the question panel) pauses the instructions. Finish leaves the demo open; Exit demo restores your regular workspace.</p></div>
    </section>
  </>;
}
