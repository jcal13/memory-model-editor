import { questionTypes } from '../../informationTabs/questionTab/utils/questionLinks';
import { act, renderHook } from '@testing-library/react';
import { useMemoryModelEditorState } from './useMemoryModelEditorState';
import { loadInitialUIData } from '../utils/localStorage';
afterEach(() => { localStorage.clear(); window.history.replaceState(null,'','/'); });
test.each(questionTypes)('a %s link overrides saved selection and a closed panel without mutating defaults', type => {
  localStorage.setItem('canvas_ui_state_v3', JSON.stringify({questionIndex: 8, questionType: 'test', questionView: 'list', isInfoPanelOpen: false, sandboxMode: true}));
  window.history.replaceState(null,'',`/?${type}=2`);
  const { result } = renderHook(() => useMemoryModelEditorState(true));
  expect(result.current.selectedQuestionIndex).toBe(2);
  expect(result.current.selectedQuestionType).toBe(type);
  expect(result.current.questionView).toBe('question');
  expect(result.current.isInfoPanelOpen).toBe(true);
  expect(result.current.isSandboxMode).toBe(true);
  expect(result.current.elements).toEqual([]);
  expect(loadInitialUIData().questionType).toBe('test');
});
test('visiting without a link still restores the saved question', () => {
  localStorage.setItem('canvas_ui_state_v3', JSON.stringify({questionIndex: 8, questionType: 'test', questionView: 'question'}));
  const { result } = renderHook(() => useMemoryModelEditorState(true));
  expect(result.current.selectedQuestionIndex).toBe(8);
  expect(result.current.selectedQuestionType).toBe('test');
});

describe.each(questionTypes)('%s direct-link mode', type => {
  test.each([true, false])('starts Guided Palette despite saved mode %s on entry and remount', sandboxMode => {
    localStorage.setItem('canvas_ui_state_v3', JSON.stringify({sandboxMode}));
    const saved = localStorage.getItem('canvas_ui_state_v3');
    window.history.replaceState(null, '', `/?${type}=2`);
    const first = renderHook(() => useMemoryModelEditorState(true));
    expect(first.result.current.isSandboxMode).toBe(true);
    act(() => first.result.current.setIsSandboxMode(false));
    expect(first.result.current.isSandboxMode).toBe(false);
    first.unmount();
    const refreshed = renderHook(() => useMemoryModelEditorState(true));
    expect(refreshed.result.current.isSandboxMode).toBe(true);
    expect(localStorage.getItem('canvas_ui_state_v3')).toBe(saved);
  });

  test('uses the Guided Palette default without a saved mode', () => {
    window.history.replaceState(null, '', `/?${type}=2`);
    const { result } = renderHook(() => useMemoryModelEditorState(true));
    expect(result.current.isSandboxMode).toBe(true);
    expect(result.current.selectedQuestionType).toBe(type);
    expect(result.current.selectedQuestionIndex).toBe(2);
  });
});

test.each([true, false])('non-link entry retains saved palette mode %s', sandboxMode => {
  localStorage.setItem('canvas_ui_state_v3', JSON.stringify({sandboxMode}));
  const {result} = renderHook(() => useMemoryModelEditorState(true));
  expect(result.current.isSandboxMode).toBe(sandboxMode);
});
