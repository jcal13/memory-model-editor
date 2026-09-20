import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CanvasElement } from "../shared/types";
import { hasAssignment } from "./tutorialModel";
import { exitTutorial, isTutorial, startTutorial, workspaceStorage } from "./tutorialStorage";
import HelpContent from "./HelpContent";
import "./tutorial.css";

// Beamer+ pattern: declarative steps, measured targets, and a transparent spotlight.
const steps = [
  { title: "Build your first memory model", body: "This demo uses Practice Question 1, with the same tools, Submit button, and feedback you’ll use in practice. Your tutorial work is saved separately. Follow the guide or hide it to explore.", target: "" },
  { title: "Add an integer object", body: "Drag the int box from the palette onto the middle canvas. An integer box represents an object in memory.", target: '[aria-label="Draggable int box"]' },
  { title: "Create the value for a = 5", body: "Click an integer object and set its value to 5 in the editor. Changes save automatically. Object IDs can differ: the value belongs inside the object.", target: "" },
  { title: "Connect a to the object with value 5", body: "Click the __main__ frame in the call stack. Choose Add Variable, enter a, then click its ID selector and choose the object containing 5.", target: '[data-canvas-kind="function"]' },
  { title: "Build b = 4", body: "Drag another int onto the canvas and change its value to 4. In __main__, add variable b and select the ID of the object containing 4. Keep the object containing 5 for a.", target: "" },
  { title: "Build c = 6", body: "Add an integer object containing 6. Add c to __main__ and reference that object’s ID. Keep a pointing to 5 and b pointing to 4.", target: "" },
  { title: "Submit and read the feedback", body: "Click the normal Submit button on the right. Read the Feedback panel below it and repair anything it flags. You can also check individual code lines using their highlighted line numbers.", target: '[data-tour="submit"]' },
  { title: "You’ve built your first model", body: "You added objects, edited values, connected references, and checked your answer. Finish closes the guide and leaves you here to explore. Resume guide and Help remain in the bottom-right corner; Exit tutorial returns to your regular workspace.", target: "" },
];

export function nextAction(elements: CanvasElement[], correct: boolean) {
  const integers = elements.filter(e => !e.invalidated && e.kind.name === "primitive" && e.kind.type === "int");
  if (!integers.length) return 1;
  if (!integers.some(e => e.kind.name === "primitive" && e.kind.value.trim() !== "" && Number(e.kind.value) === 5)) return 2;
  if (!hasAssignment(elements, "a", 5)) return 3;
  if (!hasAssignment(elements, "b", 4)) return 4;
  if (!hasAssignment(elements, "c", 6)) return 5;
  return correct ? 7 : 6;
}

export default function Tutorial({ elements, correct, demoActive = isTutorial() }: { elements: CanvasElement[]; correct: boolean; demoActive?: boolean }) {
  const active = demoActive;
  const action = nextAction(elements, correct);
  const [step, setStep] = useState(() => active && workspaceStorage.getItem("started") === "true" ? action : 0);
  const [guidance, setGuidance] = useState(() => active && workspaceStorage.getItem("guidance") !== "hidden");
  const [help, setHelp] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [draggingBox, setDraggingBox] = useState(false);
  const afterDrop = useRef(false);
  const [rect, setRect] = useState<{left: number; top: number; width: number; height: number} | null>(null);
  const [position, setPosition] = useState({left: 24, top: 24});
  const [editingId, setEditingId] = useState<number | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const helpCard = useRef<HTMLDivElement>(null);
  const clicked = useRef<Element | null>(null);
  const previousAction = useRef(action);
  const current = steps[step];
  const referenceValue = step === 4 ? 4 : step === 5 ? 6 : null;
  const referenceObject = referenceValue === null ? undefined : elements.find(e => !e.invalidated && e.kind.name === "primitive" && e.kind.type === "int" && Number(e.kind.value) === referenceValue);
  const instruction = referenceObject
    ? `Your integer containing ${referenceValue} is ready (ID ${referenceObject.id}). Click __main__, add ${step === 4 ? "b" : "c"}, and select that object’s ID. You do not need another integer for this assignment.`
    : current.body;
  const editing = elements.find(e => e.boxId === editingId);
  const context = editing?.kind.name === "primitive"
    ? `You are editing object ID ${editing.id}, currently containing ${editing.kind.value}. ${Number(editing.kind.value) === 4 ? "Keep this value for b." : Number(editing.kind.value) === 5 ? "Keep this value for a." : Number(editing.kind.value) === 6 ? "Keep this value for c." : "Set its value for the assignment you are building."}`
    : null;
  const showGuide = useCallback((visible: boolean) => { setGuidance(visible); if (active) workspaceStorage.setItem("guidance", visible ? "shown" : "hidden"); }, [active]);
  // Advance when the actual model changes, including work done while guidance is hidden.
  // Back remains usable until another task is completed or undone.
  useEffect(() => {
    if (action !== previousAction.current && step !== 0) setStep(action);
    previousAction.current = action;
  }, [action, step]);
  useEffect(() => {
    clicked.current = null;
    if (active && step > 0) workspaceStorage.setItem("started", "true");
  }, [active, step]);
  useEffect(() => {
    let dragging = false;
    const dragStart = () => { dragging = true; setInteracting(true); setDraggingBox(true); clicked.current = null; };
    const dragEnd = () => { dragging = false; setInteracting(false); setDraggingBox(false); clicked.current = null; afterDrop.current = true; };
    const down = (event: PointerEvent) => {
      if (event.target instanceof Element && !event.target.closest('.tutorial-card, .tutorial-dock, .tutorial-help')) setInteracting(true);
    };
    const up = () => { if (!dragging) setInteracting(false); };
    document.addEventListener("dragstart", dragStart, true);
    document.addEventListener("dragend", dragEnd, true);
    document.addEventListener("drop", dragEnd, true);
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("pointerup", up, true);
    document.addEventListener("pointercancel", up, true);
    window.addEventListener("blur", up);
    return () => {
      document.removeEventListener("dragstart", dragStart, true);
      document.removeEventListener("dragend", dragEnd, true);
      document.removeEventListener("drop", dragEnd, true);
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointerup", up, true);
      document.removeEventListener("pointercancel", up, true);
      window.removeEventListener("blur", up);
    };
  }, []);
  useEffect(() => {
    if (!help) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = helpCard.current;
    panel?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.stopImmediatePropagation(); setHelp(false); }
      if (event.key === "Tab" && panel) {
        const buttons = Array.from(panel.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel)) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", key, true);
    return () => { document.removeEventListener("keydown", key, true); previous?.focus(); };
  }, [help]);
  useEffect(() => {
    if (!active || !guidance || help) return;
    let raf = 0;
    const update = () => {
      const editor = document.querySelector('[data-tour="box-editor"]');
      setEditingId(editor ? Number(editor.getAttribute("data-box-id")) : null);
      let target: Element | null = clicked.current?.isConnected ? clicked.current : editor || (current.target ? document.querySelector(current.target) : null);
      if (afterDrop.current) {
        const boxes = Array.from(document.querySelectorAll('[data-canvas-box-id][data-canvas-kind="primitive"]'));
        target = boxes[boxes.length - 1] || null;
        if (target) { clicked.current = target; afterDrop.current = false; }
      }
      // Empty canvas clicks clear emphasis; never dim an entire working region.
      if (target?.getAttribute("data-tour") === "canvas") target = null;
      const r = target?.getBoundingClientRect();
      const box = r && r.width && r.height ? {left:r.left-6, top:r.top-6, width:r.width+12, height:r.height+12} : null;
      setRect(old => JSON.stringify(old) === JSON.stringify(box) ? old : box);
      const w = card.current?.offsetWidth || 320, h = card.current?.offsetHeight || 300;
      const vw = window.innerWidth, vh = window.innerHeight;
      let left = (vw-w)/2, top = (vh-h)/2;
      if (!r && step > 0 && step < 7) { left = vw-w-20; top = vh-h-72; }
      if (r) {
        left = vw-r.right >= w+22 ? r.right+14 : r.left >= w+22 ? r.left-w-14 : vw-w-16;
        top = r.top+r.height/2-h/2;
        if (target?.getAttribute("data-tour") === "canvas") { left=r.right-w-16; top=r.bottom-h-64; }
      }
      const pos = {left:Math.max(12,Math.min(left,vw-w-12)),top:Math.max(12,Math.min(top,vh-h-64))};
      setPosition(old => old.left===pos.left && old.top===pos.top ? old : pos);
    };
    const schedule = () => { cancelAnimationFrame(raf); raf=requestAnimationFrame(update); };
    const pointer = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || event.target.closest('.tutorial-card, .tutorial-dock')) return;
      if (step > 0) setStep(action);
      afterDrop.current = false;
      clicked.current = event.target.closest('[data-tour="reference-picker"], [data-tour="box-editor"], [data-canvas-box-id], [aria-label^="Draggable "], [data-tour="submit"], [data-tour="canvas"]');
      schedule();
    };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") showGuide(false); };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body,{childList:true,subtree:true,attributes:true});
    const resize = new ResizeObserver(schedule); resize.observe(document.body);
    document.addEventListener("pointerdown",pointer,true);
    document.addEventListener("keydown",key);
    window.addEventListener("resize",schedule); window.addEventListener("scroll",schedule,true);
    schedule();
    return () => { cancelAnimationFrame(raf); observer.disconnect(); resize.disconnect(); document.removeEventListener("pointerdown",pointer,true); document.removeEventListener("keydown",key); window.removeEventListener("resize",schedule); window.removeEventListener("scroll",schedule,true); };
  }, [active,current.target,guidance,help,step,action,showGuide,draggingBox]);

  return createPortal(<>
    <div className="tutorial-dock">
      {isTutorial() && <>{active && <button onClick={() => { if (!guidance) setStep(action); showGuide(!guidance); }}>{guidance ? "Hide guide" : "Resume guide"}</button>}<button onClick={exitTutorial}>Exit tutorial</button></>}
      <button className="tutorial-help-button" aria-label="Help and guide" title="Help and guide" onClick={() => setHelp(true)}>?</button>
    </div>
    {active && guidance && !help && <div className="tutorial-layer">
      {!draggingBox && (rect ? <div className="tutorial-spotlight" style={rect}/> : (step === 0 || step === 7) ? <div className="tutorial-dim"/> : null)}
      <div ref={card} className="tutorial-card" style={{...position, pointerEvents: interacting ? "none" : "auto", opacity: draggingBox ? 0 : 1}} role="dialog" aria-label={current.title}>
        <div className="tutorial-heading"><span>{step+1} of {steps.length}</span><button onClick={() => showGuide(false)}>Hide</button></div>
        <h2>{current.title}</h2><p>{instruction}</p>
        {context && step > 0 && step < 7 && <p className="tutorial-note" role="status">{context}</p>}
        <div className="tutorial-actions"><button disabled={step===0} onClick={() => setStep(s=>s-1)}>Back</button><button className="tutorial-primary" disabled={step > 0 && step >= action && step < 7} onClick={() => { if (step===7) showGuide(false); else setStep(step===0 || step<action ? action : Math.min(step+1,7)); }}>{step===7 ? "Finish" : "Next"}</button></div>
      </div>
    </div>}
    {help && <div className="tutorial-help-backdrop" onClick={event => { if(event.target===event.currentTarget) setHelp(false); }}>
      <div className="tutorial-help" ref={helpCard} role="dialog" aria-modal="true" aria-labelledby="memory-help-title" tabIndex={-1}>
        <div className="tutorial-heading"><h1 id="memory-help-title">Help &amp; guide</h1><button aria-label="Close help" onClick={()=>setHelp(false)}>×</button></div>
        <HelpContent onStart={startTutorial} />
        <button onClick={()=>setHelp(false)}>Done</button>
      </div>
    </div>}
  </>, document.body);
}
