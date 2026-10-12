import { ReactNode } from "react";

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
      <div><h2>2. Add and edit objects</h2><p>Drag an <b>int</b> from the left palette onto the canvas. Click the box and enter <b>5</b> in its value field.</p><span className="help-tip">Drag to place · Click to edit · Changes save automatically</span></div>
    </section>
    <section className="help-lesson">
      <span className="help-icon help-amber"><Icon kind="link"/></span>
      <div><h2>3. Connect variables to objects</h2><p>Open <code>__main__</code>, choose <b>Add Variable</b>, and name it <b>a</b>. Use its ID selector to choose the object containing 5.</p><div className="help-memory" aria-label="Variable a references object ID 1, an integer with value 5"><span className="help-variable">a <small>variable</small></span><span aria-hidden="true">→</span><span className="help-object"><span><b>id1</b><b>int</b></span><strong>5</strong></span></div><span className="help-tip">An ID identifies an object. It is different from the object’s value.</span></div>
    </section>
    <section className="help-lesson">
      <span className="help-icon help-green"><Icon kind="check"/></span>
      <div><h2>4. Check and learn</h2><p>Click <b>Submit</b>, read the feedback below the question, then revise your model. Highlighted line numbers let you check an earlier point in the code.</p></div>
    </section>
    <section className="help-lesson help-tools">
      <span className="help-icon help-blue"><Icon kind="sliders"/></span>
      <div><h2>Make room to think</h2><p>Drag the panel divider to widen the question. Use <b>Undo / Redo</b> for small changes, <b>Reset</b> for a fresh attempt, and <b>Download</b> to export your model.</p><p className="help-tip">During the demo: Hide / Resume guide pauses the instructions. Finish leaves the demo open; Exit tutorial restores your regular workspace.</p></div>
    </section>
  </>;
}
