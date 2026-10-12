import { act, fireEvent, render, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';
import BoxEditor from './BoxEditor';
import { validateElements } from '../../canvas/utils/validation';
import { CanvasElement } from '../../shared/types';
import { useUndoHistory } from '../../memoryModelEditor/hooks/useUndoHistory';

beforeEach(() => localStorage.clear());

test.each(['function', 'class'] as const)('%s popup follows canvas undo and redo', async type => {
  function Harness() {
    const [elements, setElements] = useState<CanvasElement[]>([{
      boxId: 0, id: '_', x: 0, y: 0,
      kind: type === 'function'
        ? {name: 'function', type: 'function', value: null, functionName: '__main__', params: [{name: 'head', targetId: 1}]}
        : {name: 'class', type: 'class', value: null, className: 'Node', classVariables: [{name: 'head', targetId: 1}]}
    }, {boxId: 1, id: 1, x: 100, y: 0, kind: {name: "primitive", type: "int", value: "0"}}]);
    const [ids, setIds] = useState<number[]>([0, 1]);
    const [classes, setClasses] = useState<string[]>([]);
    const history = useUndoHistory(setElements, setIds, setClasses);
    useEffect(() => {
      const validated = validateElements(elements);
      if (JSON.stringify(validated) !== JSON.stringify(elements)) setElements(validated);
    }, [elements]);
    useEffect(() => history.recordState({elements, ids, classes}), [elements, ids, classes, history.recordState]);
    return <>
      <BoxEditor metadata={elements[0]} elements={elements} ids={ids} addId={() => {}} removeId={() => {}}
        onRemove={() => {}} onClose={() => {}} onSave={(id, kind, invalidated) => {
          setElements(previous => {
            const next = {...previous[0], id, kind, invalidated};
            return JSON.stringify(next) === JSON.stringify(previous[0]) ? previous : [next, ...previous.slice(1)];
          });
        }}/>
      <button onClick={history.undo}>Canvas Undo</button><button onClick={history.redo}>Canvas Redo</button>
    </>;
  }
  render(<Harness/>);
  const placeholder = type === 'function' ? 'var' : 'variable';
  const input = screen.getByPlaceholderText(placeholder);
  input.focus();
  fireEvent.change(input, {target: {value: 'cou'}});
  expect(input).toHaveFocus();
  fireEvent.change(input, {target: {value: 'count'}});
  fireEvent.blur(input);
  fireEvent.click(screen.getByText('Canvas Undo'));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
  expect(screen.getByPlaceholderText(placeholder)).toHaveValue('head');
  fireEvent.click(screen.getByText('Canvas Redo'));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
  expect(screen.getByPlaceholderText(placeholder)).toHaveValue('count');
  fireEvent.click(screen.getByRole('button', {name: 'ID 1'}));
  fireEvent.click(screen.getByRole('button', {name: '0'}));
  expect(screen.getByRole('button', {name: 'ID 0'})).toBeInTheDocument();
  fireEvent.click(screen.getByText('Canvas Undo'));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
  expect(screen.getByRole('button', {name: 'ID 1'})).toBeInTheDocument();
  fireEvent.click(screen.getByText('Canvas Redo'));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
  expect(screen.getByRole('button', {name: 'ID 0'})).toBeInTheDocument();
  // Correct an invalid reference, then traverse both changes in history.
  fireEvent.click(screen.getByRole('button', {name: 'ID 0'}));
  fireEvent.click(screen.getByRole('button', {name: '1'}));
  expect(screen.getByRole('button', {name: 'ID 1'})).toBeInTheDocument();
  fireEvent.click(screen.getByText('Canvas Undo'));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
  expect(screen.getByRole('button', {name: 'ID 0'})).toBeInTheDocument();
  fireEvent.click(screen.getByText('Canvas Redo'));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
  expect(screen.getByRole('button', {name: 'ID 1'})).toBeInTheDocument();
  fireEvent.click(screen.getByText('Add Variable'));
  expect(screen.getAllByPlaceholderText(placeholder)).toHaveLength(2);
  fireEvent.click(screen.getByText('Canvas Undo'));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
  expect(screen.getAllByPlaceholderText(placeholder)).toHaveLength(1);
  fireEvent.click(screen.getByText('Canvas Redo'));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
  expect(screen.getAllByPlaceholderText(placeholder)).toHaveLength(2);
});
