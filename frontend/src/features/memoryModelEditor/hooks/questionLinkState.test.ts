import { questionTypes } from '../../informationTabs/questionTab/utils/questionLinks';
import { renderHook } from '@testing-library/react';
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
  expect(result.current.isSandboxMode).toBe(false);
  expect(result.current.elements).toEqual([]);
  expect(loadInitialUIData().questionType).toBe('test');
});
test('visiting without a link still restores the saved question', () => {
  localStorage.setItem('canvas_ui_state_v3', JSON.stringify({questionIndex: 8, questionType: 'test', questionView: 'question'}));
  const { result } = renderHook(() => useMemoryModelEditorState(true));
  expect(result.current.selectedQuestionIndex).toBe(8);
  expect(result.current.selectedQuestionType).toBe('test');
});

test.each(questionTypes)('bare %s overrides saved question and opens its list', type => {
 localStorage.setItem('canvas_ui_state_v3', JSON.stringify({questionIndex:8, questionType:'test', questionView:'question', isInfoPanelOpen:false}));
 window.history.replaceState(null, '', `/?${type}`);
 const {result}=renderHook(() => useMemoryModelEditorState(true));
 expect(result.current.selectedQuestionIndex).toBeNull();
 expect(result.current.selectedQuestionType).toBe(type);
 expect(result.current.questionView).toBe('list');
 expect(result.current.isInfoPanelOpen).toBe(true);
 expect(result.current.elements).toEqual([]);
 expect(loadInitialUIData().questionIndex).toBe(8);
});
