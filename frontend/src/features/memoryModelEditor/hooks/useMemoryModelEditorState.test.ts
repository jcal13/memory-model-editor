import { renderHook } from '@testing-library/react';
import { useMemoryModelEditorState } from './useMemoryModelEditorState';
import { loadInitialUIData, saveUIState, saveCanvasData } from '../utils/localStorage';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState({}, '', '/');
});
afterEach(() => window.history.replaceState({}, '', '/'));

test('demo initialization preserves regular workspace defaults in the same runtime', () => {
  const defaults = { ...loadInitialUIData() };
  window.history.replaceState({}, '', '/?tutorial=1');
  const demo = renderHook(() => useMemoryModelEditorState(false));
  expect(demo.result.current.selectedQuestionIndex).toBe(1);
  expect(demo.result.current.questionView).toBe('question');
  expect(demo.result.current.isSandboxMode).toBe(true);
  demo.unmount();
  window.history.replaceState({}, '', '/');
  expect(loadInitialUIData()).toEqual(defaults);
  const regular = renderHook(() => useMemoryModelEditorState(false));
  expect(regular.result.current.selectedQuestionIndex).toBeNull();
  expect(regular.result.current.questionView).toBe('root');
  expect(regular.result.current.isSandboxMode).toBe(false);
});

test('regular question and visual preferences survive demo initialization', () => {
  saveUIState({activeTab:'question', questionIndex:7, questionType:'prep',
    questionView:'question', submissionResults:null, sandboxMode:false,
    visualStyle:'pythonTutor', pythonTutorReferenceArrows:true,
    showLinkedListView:true, isInfoPanelOpen:false});
  const saved = localStorage.getItem('canvas_ui_state_v3');
  window.history.replaceState({}, '', '/?tutorial=1');
  const demo = renderHook(() => useMemoryModelEditorState(false));
  demo.unmount();
  window.history.replaceState({}, '', '/');
  const {result} = renderHook(() => useMemoryModelEditorState(false));
  expect(result.current.selectedQuestionIndex).toBe(7);
  expect(result.current.selectedQuestionType).toBe('prep');
  expect(result.current.isSandboxMode).toBe(false);
  expect(result.current.visualStyle).toBe('pythonTutor');
  expect(result.current.pythonTutorReferenceArrows).toBe(true);
  expect(result.current.showLinkedListView).toBe(true);
  expect(result.current.isInfoPanelOpen).toBe(false);
  expect(localStorage.getItem('canvas_ui_state_v3')).toBe(saved);
});

const savedDiagram = {
  elements: [{ boxId: 5, id: 5, x: 120, y: 80,
    kind: { name: 'primitive' as const, type: 'int' as const, value: '42' } }],
  ids: [5], classes: [],
};

test.each(['memoryviz', 'pythonTutor'] as const)('reload restores the current question diagram in %s style', visualStyle => {
  saveUIState({ activeTab: 'question', questionIndex: 1, questionType: 'practice',
    questionView: 'question', submissionResults: null, sandboxMode: false, visualStyle });
  saveCanvasData(savedDiagram);
  window.history.replaceState({}, '', '/?practice=1');
  const first = renderHook(() => useMemoryModelEditorState(false));
  expect(first.result.current.linkedQuestion).toBeNull();
  expect(first.result.current.elements).toEqual(savedDiagram.elements);
  expect(first.result.current.elementIds).toEqual([5]);
  first.unmount();
  const reload = renderHook(() => useMemoryModelEditorState(false));
  expect(reload.result.current.elements).toEqual(savedDiagram.elements);
  expect(reload.result.current.visualStyle).toBe(visualStyle);
});

test.each(['/?practice=2', '/?prep=1'])('a different question link %s does not reuse the active diagram', url => {
  saveUIState({ activeTab: 'question', questionIndex: 1, questionType: 'practice',
    questionView: 'question', submissionResults: null, sandboxMode: false });
  saveCanvasData(savedDiagram);
  window.history.replaceState({}, '', url);
  const { result } = renderHook(() => useMemoryModelEditorState(false));
  expect(result.current.linkedQuestion).not.toBeNull();
  expect(result.current.elements).toEqual([]);
});
