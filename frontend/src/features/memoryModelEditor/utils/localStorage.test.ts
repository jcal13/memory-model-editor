import { loadInitialUIData, saveUIState } from "./localStorage";

describe("localStorage UI state", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults pythonTutorReferenceArrows to false when missing", () => {
    localStorage.setItem(
      "canvas_ui_state_v3",
      JSON.stringify({
        activeTab: "question",
        questionIndex: null,
        questionType: null,
        submissionResults: null,
        sandboxMode: false,
        visualStyle: "pythonTutor",
      })
    );

    expect(loadInitialUIData().pythonTutorReferenceArrows).toBe(false);
  });

  it("defaults pythonTutorStandalonePrimitives to false when missing", () => {
    localStorage.setItem(
      "canvas_ui_state_v3",
      JSON.stringify({
        activeTab: "question",
        questionIndex: null,
        questionType: null,
        submissionResults: null,
        sandboxMode: false,
        visualStyle: "pythonTutor",
      })
    );

    expect(loadInitialUIData().pythonTutorStandalonePrimitives).toBe(false);
  });

  it("round-trips pythonTutorReferenceArrows when persisted", () => {
    saveUIState({
      activeTab: "question",
      questionIndex: null,
      questionType: null,
      submissionResults: null,
      sandboxMode: false,
      visualStyle: "pythonTutor",
      pythonTutorReferenceArrows: true,
    });

    expect(loadInitialUIData().pythonTutorReferenceArrows).toBe(true);
  });

  it("round-trips pythonTutorStandalonePrimitives when persisted", () => {
    saveUIState({
      activeTab: "question",
      questionIndex: null,
      questionType: null,
      submissionResults: null,
      sandboxMode: false,
      visualStyle: "pythonTutor",
      pythonTutorStandalonePrimitives: true,
    });

    expect(loadInitialUIData().pythonTutorStandalonePrimitives).toBe(true);
  });
});
