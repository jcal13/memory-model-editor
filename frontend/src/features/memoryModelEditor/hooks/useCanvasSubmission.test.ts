import { act, renderHook } from '@testing-library/react';
import { useCanvasSubmission } from './useCanvasSubmission';
import { submitCanvas, submitCanvasAtLine } from '../../validationServices/questionValidationService';
import { CanvasElement } from '../../shared/types';

jest.mock('../../validationServices/questionValidationService');
const elements: CanvasElement[] = [{boxId: 1, id: 1, x: 0, y: 0,
  kind: {name: 'primitive', type: 'int', value: '99'}}];
const passed = {correct: true, errors: []};
function deferred() {
  let resolve!: (value: any) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<any>((yes, no) => {resolve = yes; reject = no;});
  return {promise, resolve, reject};
}
beforeEach(() => jest.clearAllMocks());

describe.each(['whole', 'line'] as const)('%s submission', kind => {
  function setup() {
    const pending = deferred();
    const service = (kind === 'whole' ? submitCanvas : submitCanvasAtLine) as jest.Mock;
    service.mockReturnValue(pending.promise);
    const setElements = jest.fn(), setSubmissionResults = jest.fn();
    const initialProps = {elements, selectedQuestionIndex: 2};
    const hook = renderHook(props => useCanvasSubmission({...props,
      selectedQuestionType: 'practice', setElements, setSubmissionResults}), {initialProps});
    const start = () => kind === 'whole' ? hook.result.current.handleCanvasSubmit()
      : hook.result.current.handleCanvasSubmitAtLine(1);
    return {...hook, pending, setElements, setSubmissionResults, start};
  }

  test.each(['reset', 'navigate', 'unmount'] as const)('ignores success after %s', async change => {
      const h = setup();
      const result = h.start();
      if (change === 'reset') h.rerender({elements: [], selectedQuestionIndex: 2});
      if (change === 'navigate') h.rerender({elements, selectedQuestionIndex: 3});
      if (change === 'unmount') h.unmount();
      await act(async () => {h.pending.resolve(passed); expect(await result).toBe(false);});
      expect(h.setElements).not.toHaveBeenCalled();
      expect(h.setSubmissionResults).not.toHaveBeenCalled();
  });

  test('a late failure does not clear feedback after a reset', async () => {
    const h = setup();
    const result = h.start();
    h.rerender({elements: [], selectedQuestionIndex: 2});
    await act(async () => {h.pending.reject(new Error('network')); expect(await result).toBe(false);});
    expect(h.setSubmissionResults).not.toHaveBeenCalled();
    expect(h.setElements).not.toHaveBeenCalled();
  });

  test('applies a current response normally', async () => {
    const h = setup();
    const result = h.start();
    await act(async () => {h.pending.resolve(passed); expect(await result).toBe(true);});
    expect(h.setElements).toHaveBeenCalledTimes(1);
    expect(h.setSubmissionResults).toHaveBeenCalledWith(passed);
  });
});
