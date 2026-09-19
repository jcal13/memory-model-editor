import { workspaceStorage } from "./tutorialStorage";
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
