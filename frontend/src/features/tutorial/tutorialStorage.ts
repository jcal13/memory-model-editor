/** Tutorial work lives in this tab's session storage, never regular practice storage. */
export const isTutorial = () => new URLSearchParams(window.location.search).get("tutorial") === "1";
const prefix = "memorylab-tutorial-v1:";
export const workspaceStorage = {
  getItem(key: string) { return isTutorial() ? sessionStorage.getItem(prefix + key) : localStorage.getItem(key); },
  setItem(key: string, value: string) { if (isTutorial()) sessionStorage.setItem(prefix + key, value); else localStorage.setItem(key, value); },
  removeItem(key: string) { if (isTutorial()) sessionStorage.removeItem(prefix + key); else localStorage.removeItem(key); },
};
export function startTutorial() {
  // Each explicit launch loads a clean demo; regular work remains untouched.
  Object.keys(sessionStorage).filter(key => key.startsWith(prefix)).forEach(key => sessionStorage.removeItem(key));
  sessionStorage.setItem(prefix + "guidance", "shown");
  sessionStorage.setItem(prefix + "started", "false");
  const url = new URL(window.location.href);
  url.searchParams.set("tutorial", "1");
  window.location.assign(url.toString());
}
export function exitTutorial() {
  const url = new URL(window.location.href);
  url.searchParams.delete("tutorial");
  window.location.assign(url.toString());
}
export function restartTutorial() {
  Object.keys(sessionStorage).filter(key => key.startsWith(prefix)).forEach(key => sessionStorage.removeItem(key));
  window.location.reload();
}

export const isDemoQuestion = (index: number | null, type: string | null, view: string) =>
  isTutorial() && index === 1 && type === "practice" && view === "question";
