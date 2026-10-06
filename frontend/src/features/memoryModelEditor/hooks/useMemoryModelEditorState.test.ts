import { renderHook } from '@testing-library/react';
import { useMemoryModelEditorState } from './useMemoryModelEditorState';
import { loadInitialUIData, saveUIState } from '../utils/localStorage';

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
