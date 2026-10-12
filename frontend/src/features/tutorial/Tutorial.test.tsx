import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Tutorial, { nextAction } from './Tutorial';
import { CanvasElement } from '../shared/types';
const model = (): CanvasElement[] => [
 {boxId:0,id:'_',x:0,y:0,kind:{name:'function',type:'function',value:null,functionName:'__main__',params:[{name:'a',targetId:10},{name:'b',targetId:20},{name:'c',targetId:30}]}},
 ...[5,4,6].map((value,index): CanvasElement=>({boxId:index+1,id:(index+1)*10,x:0,y:0,kind:{name:'primitive',type:'int',value:String(value)}}))
];
beforeEach(()=>{
 window.history.replaceState({},'', '/?tutorial=1'); sessionStorage.clear(); localStorage.clear();
 window.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} } as any;
});
test('help is available outside the Questions list with documentation and a tour entry',()=>{
 window.history.replaceState({},'', '/'); render(<Tutorial elements={[]} correct={false}/>);
 fireEvent.click(screen.getByRole('button',{name:'Help and guide'}));
 expect(screen.getByRole('dialog',{name:'Help & guide'})).toBeInTheDocument();
 expect(screen.getByText('3. Connect variables to objects')).toBeInTheDocument();
 expect(screen.getByRole('button',{name:/New to Memory Lab/})).toBeInTheDocument();
});
test('hide and resume preserve the exact lesson even while the model changes',()=>{
 const m=model(); if(m[0].kind.name==='function') m[0].kind.params.pop();
 const {rerender}=render(<Tutorial elements={[]} correct={false}/>);
 fireEvent.click(screen.getByRole('button',{name:'Hide guide'}));
 rerender(<Tutorial elements={m} correct={false}/>);
 fireEvent.click(screen.getByRole('button',{name:'Resume guide'}));
 expect(screen.getByRole('dialog',{name:'Build your first memory model'})).toBeInTheDocument();
 expect(window.location.search).toBe('?tutorial=1');
});
test('finish keeps the tutorial exercise open and guide can be reopened',()=>{
 render(<Tutorial elements={model()} correct={true}/>);
 for (let i=0;i<7;i++) fireEvent.click(screen.getByRole('button',{name:'Next'}));
 fireEvent.click(screen.getByRole('button',{name:'Finish'}));
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 expect(window.location.search).toBe('?tutorial=1');
 fireEvent.click(screen.getByRole('button',{name:'Resume guide'}));
 expect(screen.getByRole('dialog',{name:'You’ve built your first model'})).toBeInTheDocument();
});
test('progress follows references, handles undo, and never assumes id1 means value5',()=>{
 const m=model(); expect(nextAction(m,false)).toBe(6); expect(nextAction(m,true)).toBe(7);
 if(m[0].kind.name==='function') m[0].kind.params.pop();
 expect(nextAction(m,false)).toBe(5);
 if(m[0].kind.name==='function') m[0].kind.params[1].targetId=10;
 expect(nextAction(m,false)).toBe(4);
 expect(nextAction([],false)).toBe(1);
});
test('completed actions advance instructions automatically',()=>{
 const m=model(); if(m[0].kind.name==='function') m[0].kind.params=[];
 const {rerender}=render(<Tutorial elements={[]} correct={false}/>);
 fireEvent.click(screen.getByRole('button',{name:'Next'}));
 rerender(<Tutorial elements={m} correct={false}/>);
 expect(screen.getByRole('dialog',{name:'Connect a to the object with value 5'})).toBeInTheDocument();
});

test('guidance and resume controls are unavailable on other questions',()=>{
 render(<Tutorial elements={model()} correct={false} demoActive={false}/>);
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:/Resume guide|Hide guide/})).not.toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Help and guide'})).toBeInTheDocument();
});
test('native drag removes all dimming until the drop completes',()=>{
 render(<Tutorial elements={[]} correct={false}/>);
 expect(document.querySelector('.tutorial-dim')).toBeInTheDocument();
 fireEvent.dragStart(document.body);
 fireEvent.pointerCancel(document.body);
 expect(document.querySelector('.tutorial-dim')).not.toBeInTheDocument();
 expect(document.querySelector('.tutorial-spotlight')).not.toBeInTheDocument();
 fireEvent.dragEnd(document.body);
 expect(document.querySelector('.tutorial-dim')).toBeInTheDocument();
});

test('Help keeps inside clicks open and supports outside, Escape, Close and Done dismissal',()=>{
 render(<Tutorial elements={[]} correct={false}/>);
 const open = () => fireEvent.click(screen.getByRole('button',{name:'Help and guide'}));
 open();
 fireEvent.click(screen.getByRole('heading',{name:'Help & guide'}));
 expect(screen.getByRole('dialog',{name:'Help & guide'})).toBeInTheDocument();
 fireEvent.click(document.querySelector('.tutorial-help-backdrop')!);
 expect(screen.queryByRole('dialog',{name:'Help & guide'})).not.toBeInTheDocument();
 open(); fireEvent.keyDown(document,{key:'Escape'});
 expect(screen.queryByRole('dialog',{name:'Help & guide'})).not.toBeInTheDocument();
 open(); fireEvent.click(screen.getByRole('button',{name:'Close help'}));
 expect(screen.queryByRole('dialog',{name:'Help & guide'})).not.toBeInTheDocument();
 open(); fireEvent.click(screen.getByRole('button',{name:'Done'}));
 expect(screen.queryByRole('dialog',{name:'Help & guide'})).not.toBeInTheDocument();
});
test('welcome resumes at step one and only one Hide control exists',()=>{
 render(<Tutorial elements={[]} correct={false}/>);
 expect(screen.queryByRole('button',{name:'Hide'})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Hide guide'}));
 fireEvent.click(screen.getByRole('button',{name:'Resume guide'}));
 expect(screen.getByRole('dialog',{name:'Build your first memory model'})).toBeInTheDocument();
});

test('normal mode never registers tutorial pointer or drag listeners', () => {
 window.history.replaceState({}, '', '/');
 const documentAdd = jest.spyOn(document, 'addEventListener');
 const windowAdd = jest.spyOn(window, 'addEventListener');
 try {
  render(<Tutorial elements={[]} correct={false}/>);
  const tutorialEvents = ['dragstart', 'dragend', 'drop', 'pointerdown', 'pointerup', 'pointercancel'];
  expect(documentAdd.mock.calls.filter(([type]) => tutorialEvents.includes(type))).toHaveLength(0);
  expect(windowAdd.mock.calls.filter(([type]) => type === 'blur')).toHaveLength(0);
 } finally { documentAdd.mockRestore(); windowAdd.mockRestore(); }
});

test('deactivating the demo removes every tutorial interaction listener', () => {
 const documentAdd = jest.spyOn(document, 'addEventListener');
 const documentRemove = jest.spyOn(document, 'removeEventListener');
 const windowAdd = jest.spyOn(window, 'addEventListener');
 const windowRemove = jest.spyOn(window, 'removeEventListener');
 try {
  const {rerender} = render(<Tutorial elements={[]} correct={false} demoActive={true}/>);
  const tutorialEvents = ['dragstart', 'dragend', 'drop', 'pointerdown', 'pointerup', 'pointercancel'];
  const listeners = documentAdd.mock.calls.filter(([type]) => tutorialEvents.includes(type));
  const blur = windowAdd.mock.calls.find(([type]) => type === 'blur');
  expect(listeners).toHaveLength(6);
  expect(blur).toBeDefined();
  fireEvent.dragStart(document.body);
  rerender(<Tutorial elements={[]} correct={false} demoActive={false}/>);
  listeners.forEach(args => expect(documentRemove).toHaveBeenCalledWith(...args));
  expect(windowRemove).toHaveBeenCalledWith(...blur!);
  rerender(<Tutorial elements={[]} correct={false} demoActive={true}/>);
  expect(document.querySelector('.tutorial-dim')).toBeInTheDocument();
 } finally {
  documentAdd.mockRestore(); documentRemove.mockRestore();
  windowAdd.mockRestore(); windowRemove.mockRestore();
 }
});

test('Help opens on every regular page load and can still be reopened', () => {
 window.history.replaceState({}, '', '/');
 const first = render(<Tutorial elements={[]} correct={false}/>);
 expect(screen.getByRole('dialog',{name:'Help & guide'})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Close help'}));
 first.unmount();
 localStorage.setItem('memorylab-help-seen-v1', 'true');
 render(<Tutorial elements={[]} correct={false}/>);
 expect(screen.getByRole('dialog',{name:'Help & guide'})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Close help'}));
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Help and guide'}));
 expect(screen.getByRole('dialog',{name:'Help & guide'})).toBeInTheDocument();
});

test('Back to the drag step acknowledges existing objects and Next reviews one step at a time', () => {
 const {rerender} = render(<Tutorial elements={[]} correct={false}/>);
 fireEvent.click(screen.getByRole('button',{name:'Next'}));
 const integer: CanvasElement = {boxId:1,id:1,x:0,y:0,kind:{name:'primitive',type:'int',value:'0'}};
 rerender(<Tutorial elements={[integer]} correct={false}/>);
 expect(screen.getByText('Step 3 of 8')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Back'}));
 expect(screen.getByText(/You already added an integer/)).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Next'}));
 expect(screen.getByText('Step 3 of 8')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Back'}));
 rerender(<Tutorial elements={[]} correct={false}/>);
 expect(screen.getByText(/Drag the int box from the palette/)).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Next'})).toBeDisabled();
});

test.each([1, 2])('failed submission with %i empty rows directs students to feedback', (count) => {
 const m = model();
 if (m[0].kind.name === 'function') m[0].kind.params.push(...Array.from({length:count}, () => ({name:'',targetId:null})));
 m.push({boxId:4,id:40,x:0,y:0,kind:{name:'primitive',type:'int',value:'0'}});
 const {rerender} = render(<Tutorial elements={m} correct={false} submissionFailed/>);
 for (let i=0;i<6;i++) fireEvent.click(screen.getByRole('button',{name:'Next'}));
 expect(screen.getByRole('dialog',{name:'Check your feedback'})).toBeInTheDocument();
 expect(screen.getByText(/The Feedback panel shows issues to fix/)).toBeInTheDocument();
 expect(screen.queryByText(/Remove the/)).not.toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Next'})).toBeDisabled();
 rerender(<Tutorial elements={model()} correct={false} submissionFailed/>);
 expect(screen.queryByText(/Remove the 2 empty variable rows/)).not.toBeInTheDocument();
 expect(screen.queryByText(/unused integer object with ID 40/)).not.toBeInTheDocument();
 expect(screen.getByText(/The Feedback panel shows issues to fix/)).toBeInTheDocument();
 rerender(<Tutorial elements={model()} correct={true} submissionFailed={false}/>);
 expect(screen.getByRole('dialog',{name:'Congratulations! Your model passed!'})).toBeInTheDocument();
 expect(screen.getByText('Step 7 of 8')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Next'}));
 expect(screen.getByRole('button',{name:'Finish'})).toBeInTheDocument();
});

test('before submission the guide keeps its original submit instructions', () => {
 render(<Tutorial elements={model()} correct={false}/>);
 for (let i=0;i<6;i++) fireEvent.click(screen.getByRole('button',{name:'Next'}));
 expect(screen.getByRole('dialog',{name:'Submit and read the feedback'})).toBeInTheDocument();
 expect(screen.queryByRole('dialog',{name:'Check your feedback'})).not.toBeInTheDocument();
});

test('step seven waits for submission, shows a pass, and advances only on Next', () => {
 const {rerender} = render(<Tutorial elements={model()} correct={false}/>);
 for (let i=0;i<6;i++) fireEvent.click(screen.getByRole('button',{name:'Next'}));
 expect(screen.getByRole('dialog',{name:'Submit and read the feedback'})).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Next'})).toBeDisabled();
 rerender(<Tutorial elements={model()} correct/>);
 expect(screen.getByRole('dialog',{name:'Congratulations! Your model passed!'})).toBeInTheDocument();
 expect(screen.getByText('Step 7 of 8')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Next'}));
 expect(screen.getByText('Step 8 of 8')).toBeInTheDocument();
});

test('a model edited after submission returns to Submit rather than showing stale feedback', () => {
 const {rerender} = render(<Tutorial elements={model()} correct={false} submissionFailed/>);
 for (let i=0;i<6;i++) fireEvent.click(screen.getByRole('button',{name:'Next'}));
 expect(screen.getByRole('dialog',{name:'Check your feedback'})).toBeInTheDocument();
 rerender(<Tutorial elements={model()} correct={false} submissionFailed={false}/>);
 expect(screen.getByRole('dialog',{name:'Submit and read the feedback'})).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Next'})).toBeDisabled();
 rerender(<Tutorial elements={model()} correct/>);
 expect(screen.getByRole('dialog',{name:'Congratulations! Your model passed!'})).toBeInTheDocument();
 rerender(<Tutorial elements={model()} correct={false}/>);
 expect(screen.getByRole('dialog',{name:'Submit and read the feedback'})).toBeInTheDocument();
});
