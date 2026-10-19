import { workspaceStorage, isDemoQuestion, isTutorial, normalizeTutorialUrl } from "./tutorialStorage";
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); window.history.replaceState({}, "", "/"); });
test("tutorial writes and deletes leave normal canvas, undo and question state untouched", () => {
 const keys=["canvas_key","canvas_ui_state_v3","questionStatus","question_canvas_practice_1","canvasHistory"];
 keys.forEach(key=>workspaceStorage.setItem(key,"regular"));
 window.history.replaceState({}, "", "/?tutorial=1");
 keys.forEach(key=>{ expect(workspaceStorage.getItem(key)).toBeNull(); workspaceStorage.setItem(key,"tutorial"); expect(workspaceStorage.getItem(key)).toBe("tutorial"); });
 workspaceStorage.removeItem(keys[0]);
 window.history.replaceState({}, "", "/");
 keys.forEach(key=>expect(workspaceStorage.getItem(key)).toBe("regular"));
 window.history.replaceState({}, "", "/?tutorial=1");
 expect(workspaceStorage.getItem(keys[1])).toBe("tutorial");
});

test("the tutorial is scoped to its specific question and view", () => {
 expect(isDemoQuestion(1,"practice","question")).toBe(false);
 window.history.replaceState({}, "", "/?tutorial=1");
 expect(isDemoQuestion(1,"practice","question")).toBe(true);
 expect(isDemoQuestion(2,"practice","question")).toBe(false);
 expect(isDemoQuestion(1,"prep","question")).toBe(false);
 expect(isDemoQuestion(1,"practice","list")).toBe(false);
});


test.each([
 "/?tutorial=2&practice=1",
 "/?tutorial=90&practice=123791ye9,",
 "/?tutorial=13practice%3D1&practice=1",
 "/?tutorial=&practice=2",
 "/?tutorial=1&practice=2&test=3",
 "/?tutorial=2&tutorial=1&practice=1&practice=9",
 "/?practice=1&tutorial=1#other",
 "/?tutorial=1",
])("normalizes edited tutorial URL %s before workspace reads", path => {
 localStorage.setItem("canvas_key", "regular");
 sessionStorage.setItem("memorylab-tutorial-v1:canvas_key", "demo");
 sessionStorage.setItem("memorylab-tutorial-v1:started", "true");
 sessionStorage.setItem("memorylab-tutorial-v1:guidance", "hidden");
 window.history.replaceState({marker:1}, "", path);
 expect(isTutorial()).toBe(true);
 normalizeTutorialUrl();
 expect(window.location.search).toBe("?tutorial=1&practice=1");
 expect(window.location.hash).toBe("");
 expect(window.history.state).toEqual({marker:1});
 expect(workspaceStorage.getItem("started")).toBe("false");
 expect(workspaceStorage.getItem("guidance")).toBe("shown");
 expect(workspaceStorage.getItem("canvas_key")).toBe("demo");
 expect(localStorage.getItem("canvas_key")).toBe("regular");
});

test("normal refresh preserves progress on the canonical tutorial URL", () => {
 window.history.replaceState({}, "", "/?tutorial=1&practice=1");
 workspaceStorage.setItem("started", "true");
 normalizeTutorialUrl();
 expect(workspaceStorage.getItem("started")).toBe("true");
});

test("regular question links remain unchanged", () => {
 window.history.replaceState({}, "", "/?practice=2");
 normalizeTutorialUrl();
 expect(window.location.search).toBe("?practice=2");
 expect(isTutorial()).toBe(false);
});
