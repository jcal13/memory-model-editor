import { fireEvent, render, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';
import DraftNameInput from './DraftNameInput';
import { useUndoHistory } from '../../memoryModelEditor/hooks/useUndoHistory';
import { CanvasElement } from '../../shared/types';

beforeEach(()=>localStorage.clear());
test('typing commits once on blur and Enter does not create a second commit', () => {
 const commit=jest.fn();
 render(<DraftNameInput aria-label="Name" value="head" onCommit={commit}/>);
 const input=screen.getByRole('textbox');
 input.focus();
 for (const value of ['c','cu','current']) fireEvent.change(input,{target:{value}});
 expect(commit).not.toHaveBeenCalled();
 fireEvent.keyDown(input,{key:'Enter'});
 expect(commit).toHaveBeenCalledTimes(1);
 expect(commit).toHaveBeenCalledWith('current');
 fireEvent.blur(input);
 expect(commit).toHaveBeenCalledTimes(1);
});
test('Escape cancels and external undo updates the draft', () => {
 const commit=jest.fn();
 const {rerender}=render(<DraftNameInput value="head" onCommit={commit}/>);
 const input=screen.getByRole('textbox'); input.focus();
 fireEvent.change(input,{target:{value:'current'}});
 fireEvent.keyDown(input,{key:'Escape'});
 expect(input).toHaveValue('head'); expect(commit).not.toHaveBeenCalled();
 rerender(<DraftNameInput value="previous" onCommit={commit}/>);
 expect(input).toHaveValue('previous');
});
test('one canvas undo and redo restores the entire rename and preserves references', () => {
 function Harness() {
  const [elements,setElements]=useState<CanvasElement[]>([{boxId:0,id:'_',x:0,y:0,kind:{name:'function',type:'function',value:null,functionName:'__main__',params:[{name:'head',targetId:1}]}}]);
  const [ids,setIds]=useState<number[]>([1]); const [classes,setClasses]=useState<string[]>([]);
  const history=useUndoHistory(setElements,setIds,setClasses);
  useEffect(()=>history.recordState({elements,ids,classes}),[elements,ids,classes,history.recordState]);
  const kind=elements[0].kind;
  if(kind.name!=='function') return null;
  return <><DraftNameInput value={kind.params[0].name} onCommit={name=>setElements([{...elements[0],kind:{...kind,params:[{...kind.params[0],name}]}}])}/>
   <button onClick={history.undo}>Undo</button><button onClick={history.redo}>Redo</button><output>{kind.params[0].targetId}</output></>;
 }
 render(<Harness/>); const input=screen.getByRole('textbox');
 fireEvent.change(input,{target:{value:'curr'}});fireEvent.change(input,{target:{value:'current'}});fireEvent.blur(input);
 fireEvent.click(screen.getByText('Undo'));expect(input).toHaveValue('head');
 fireEvent.click(screen.getByText('Redo'));expect(input).toHaveValue('current');
 expect(screen.getByText('1')).toBeInTheDocument();
});
