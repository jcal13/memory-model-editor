import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CanvasElement } from "../shared/types";
import { assignments, checkTutorial, hasAssignment } from "./tutorialModel";
import { exitTutorial, restartTutorial, workspaceStorage } from "./tutorialStorage";
import "./tutorial.css";

// Adapted from Beamer+ tour.js: declarative steps, measured targets, spotlight shadow.
const steps = [
  { title: "Build your first memory model", body: "We’ll model a = 5, b = 4, and c = 6. Your regular work is saved separately. Use Next to begin; Exit tutorial returns to it.", target: "" },
  { title: "Add an integer object", body: "Drag the int box from the palette onto the canvas. It represents an integer object. You can also use Add integer in the tutorial panel.", target: '[aria-label="Draggable int box"]' },
  { title: "Set its value to 5", body: "Click the integer box to open its editor. Change its value from 0 to 5. Changes save automatically. Close the editor when you’re ready.", target: '[data-tour="canvas"]' },
  { title: "Make a refer to that object", body: "Open the __main__ frame in the call stack. Click Add Variable, type a in the var field, then click ID _ and choose the integer object’s ID. The value 5 belongs in the object; the variable stores a reference to it.", target: '[data-tour="call-stack"]' },
  { title: "Your turn: b = 4", body: "Add another integer, set its value to 4, then add b to the main frame and select that object’s ID. Use the editor buttons below if you need help finding a box.", target: '[data-tour="canvas"]' },
  { title: "Try c = 6 independently", body: "Repeat the process for c = 6. Each variable should point to its own integer object. Next becomes available when the reference is correct.", target: '[data-tour="canvas"]' },
  { title: "Check your model", body: "Use Check answer in the tutorial panel. If something needs attention, use the feedback to repair it and check again.", target: '[data-tour="tutorial-check"]' },
  { title: "You’ve built your first model", body: "You added objects, edited values, connected references, and checked your answer. Return to questions to try Practice Question #1 independently. You can replay this tutorial any time.", target: "" },
];
interface Props { elements: CanvasElement[]; onOpenEditor: (element: CanvasElement) => void; onAddInteger: () => void; }
export default function Tutorial({ elements, onOpenEditor, onAddInteger }: Props) {
  const [step, setStep] = useState(() => Math.max(0, Math.min(6, Number(workspaceStorage.getItem("step")) || 0)));
  const [guidance, setGuidance] = useState(true);
  const [feedback, setFeedback] = useState<string[] | null>(null);
  const [rect, setRect] = useState<{left: number; top: number; width: number; height: number} | null>(null);
  const [position, setPosition] = useState({left: 24, top: 24});
  const card = useRef<HTMLDivElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const current = steps[step];
  const objects = elements.filter(e => e.kind.name === "primitive");
  const frame = elements.find(e => e.kind.name === "function" && e.kind.functionName === "__main__");
  const ready = step === 1 ? objects.some(e => e.kind.type === "int") : step === 2 ? objects.some(e => e.kind.name === "primitive" && e.kind.type === "int" && Number(e.kind.value) === 5) : step >= 3 && step <= 5 ? hasAssignment(elements, assignments[step - 3][0], assignments[step - 3][1]) : step !== 6;
  useEffect(() => { workspaceStorage.setItem("step", String(step)); }, [step]);
  useEffect(() => {
    setFeedback(null);
    if (checkTutorial(elements).length) setStep(currentStep => currentStep === 7 ? 6 : currentStep);
  }, [elements]);
  useEffect(() => {
    if (!guidance) return;
    // Information steps take focus; action steps leave the editor keyboard accessible.
    if (step === 0 || step === 7) next.current?.focus();
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") setGuidance(false); };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [guidance, step]);
  useEffect(() => {
    if (!guidance) return;
    let raf = 0;
    const update = () => {
      const editor = step >= 2 && step <= 5 ? document.querySelector('[data-tour="box-editor"]') : null;
      const target = editor || (current.target ? document.querySelector(current.target) : null);
      const r = target?.getBoundingClientRect();
      const box = r && r.width && r.height ? { left: r.left - 8, top: r.top - 8, width: r.width + 16, height: r.height + 16 } : null;
      setRect(old => JSON.stringify(old) === JSON.stringify(box) ? old : box);
      const w = card.current?.offsetWidth || 320, h = card.current?.offsetHeight || 260;
      const vw = window.innerWidth, vh = window.innerHeight;
      let left = (vw - w) / 2, top = (vh - h) / 2;
      if (r) {
        // Prefer the side with room; clamp both axes for narrow viewports.
        left = vw - r.right >= w + 22 ? r.right + 14 : r.left >= w + 22 ? r.left - w - 14 : vw - w - 16;
        top = r.top + r.height / 2 - h / 2;
        if (!editor && current.target === '[data-tour="canvas"]') {
          // Keep the exercise buttons reachable; use spare canvas space.
          left = r.right - w - 16;
          top = r.bottom - h - 16;
        }
      }
      const pos = {left: Math.max(12, Math.min(left, vw - w - 12)), top: Math.max(12, Math.min(top, vh - h - 12))};
      setPosition(old => old.left === pos.left && old.top === pos.top ? old : pos);
    };
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    const resize = new ResizeObserver(schedule);
    resize.observe(document.body);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    schedule();
    return () => { cancelAnimationFrame(raf); observer.disconnect(); resize.disconnect(); window.removeEventListener("resize", schedule); window.removeEventListener("scroll", schedule, true); };
  }, [current.target, guidance, step]);
  const advance = () => { if (step === 7) exitTutorial(); else if (ready) setStep(s => s + 1); };
  return <section className="tutorial-panel" aria-label="Tutorial exercise">
    <div className="tutorial-heading"><span className="tutorial-badge">TUTORIAL</span><button onClick={exitTutorial}>Exit tutorial</button></div>
    <h1>Your first memory model</h1>
    <p>Draw the model after these assignments. Your main frame is ready.</p>
    <pre aria-label="Tutorial Python code">{assignments.map(([name, value]) => `${name} = ${value}`).join("\n")}</pre>
    <ol className="tutorial-checklist">{assignments.map(([name, value]) => <li key={name}>{hasAssignment(elements, name, value) ? "✓" : "○"} {name} refers to an integer with value {value}</li>)}</ol>
    <div className="tutorial-actions"><button onClick={() => setGuidance(!guidance)}>{guidance ? "Hide guidance" : "Show guidance"}</button><button onClick={restartTutorial}>Restart tutorial</button></div>
    <h2>Build and edit</h2>
    <p>Drag an int from the palette, or use these buttons. Click a box on the canvas to edit it.</p>
    <div className="tutorial-actions"><button onClick={onAddInteger}>Add integer</button>{frame && <button onClick={() => onOpenEditor(frame)}>Edit main frame</button>}</div>
    <div className="tutorial-actions">{objects.map(e => <button key={e.boxId} onClick={() => onOpenEditor(e)}>Edit object {e.id}</button>)}</div>
    <button className="tutorial-primary" data-tour="tutorial-check" onClick={() => { const errors = checkTutorial(elements); setFeedback(errors); if (!errors.length) { setStep(7); setGuidance(true); } }}>Check answer</button>
    <div aria-live="polite">{feedback && (feedback.length ? <ul>{feedback.map(message => <li key={message}>{message}</li>)}</ul> : <p>Correct! All three variables reference the right objects.</p>)}</div>
    <p className="tutorial-note">This exercise is separate from your practice attempts. Exit to return to your saved work.</p>
    {guidance && createPortal(<div className="tutorial-layer">
      {rect ? <div className="tutorial-spotlight" style={rect} /> : <div className="tutorial-dim" />}
      <div ref={card} className="tutorial-card" style={position} role="dialog" aria-label={current.title}>
        <div className="tutorial-heading"><span>{step + 1} of {steps.length}</span><button onClick={() => setGuidance(false)}>Hide</button></div>
        <h2>{current.title}</h2><p>{current.body}</p>
        {!ready && step !== 6 && <p className="tutorial-note" role="status">Complete this action to continue, or hide guidance to explore.</p>}
        <div className="tutorial-actions"><button disabled={step === 0} onClick={() => setStep(s => s - 1)}>Back</button><button ref={next} className="tutorial-primary" disabled={!ready} onClick={advance}>{step === 7 ? "Return to questions" : "Next"}</button></div>
        <button className="tutorial-exit" onClick={exitTutorial}>Exit tutorial</button>
      </div>
    </div>, document.body)}
  </section>;
}
