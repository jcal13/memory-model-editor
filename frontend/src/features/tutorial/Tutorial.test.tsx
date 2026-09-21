import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Tutorial, { nextAction } from './Tutorial';
import { CanvasElement } from '../shared/types';
const model = (): CanvasElement[] => [
 {boxId:0,id:'_',x:0,y:0,kind:{name:'function',type:'function',value:null,functionName:'__main__',params:[{name:'a',targetId:10},{name:'b',targetId:20},{name:'c',targetId:30}]}},
 ...[5,4,6].map((value,index): CanvasElement=>({boxId:index+1,id:(index+1)*10,x:0,y:0,kind:{name:'primitive',type:'int',value:String(value)}}))
];
beforeEach(()=>{
 window.history.replaceState({},'', '/?tutorial=1'); sessionStorage.clear();
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
 fireEvent.click(screen.getByRole('button',{name:'Next'}));
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

test('Help closes only with Done, not the backdrop or Escape',()=>{
 render(<Tutorial elements={[]} correct={false}/>);
 fireEvent.click(screen.getByRole('button',{name:'Help and guide'}));
 fireEvent.click(document.querySelector('.tutorial-help-backdrop')!);
 fireEvent.keyDown(document,{key:'Escape'});
 expect(screen.getByRole('dialog',{name:'Help & guide'})).toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Close help'})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Done'}));
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
