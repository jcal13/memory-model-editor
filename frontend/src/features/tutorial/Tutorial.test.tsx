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
 expect(screen.getByText('Connect variables to objects')).toBeInTheDocument();
 expect(screen.getByRole('button',{name:/New to Memory Lab/})).toBeInTheDocument();
});
test('hide and resume preserve the exercise and find the next unfinished action',()=>{
 const m=model(); if(m[0].kind.name==='function') m[0].kind.params.pop();
 const {rerender}=render(<Tutorial elements={[]} correct={false}/>);
 fireEvent.click(screen.getByRole('button',{name:'Hide'}));
 rerender(<Tutorial elements={m} correct={false}/>);
 fireEvent.click(screen.getByRole('button',{name:'Resume guide'}));
 expect(screen.getByRole('dialog',{name:'Build c = 6'})).toBeInTheDocument();
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
