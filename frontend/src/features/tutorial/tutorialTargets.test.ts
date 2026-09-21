import { lessonTarget, placeCard, targetBounds } from './tutorialTargets';
import { CanvasElement } from '../shared/types';
class TestRect {
 constructor(public x=0, public y=0, public width=0, public height=0) {}
 get left(){return this.x;} get top(){return this.y;}
 get right(){return this.x+this.width;} get bottom(){return this.y+this.height;}
 toJSON(){return {x:this.x,y:this.y,width:this.width,height:this.height};}
}
Object.defineProperty(globalThis, 'DOMRect', {value:TestRect, configurable:true});
const elements: CanvasElement[] = [
 {boxId:0,id:'_',x:0,y:0,kind:{name:'function',type:'function',value:null,functionName:'__main__',params:[]}},
 {boxId:1,id:7,x:0,y:0,kind:{name:'primitive',type:'int',value:'0'}}
];
beforeEach(()=>{document.body.innerHTML='<button aria-label="Draggable int box"></button><svg><g data-canvas-box-id="0"></g><g data-canvas-box-id="1"></g></svg><button data-tour="submit"></button>';});
afterEach(()=>{document.body.innerHTML='';});
test('step two stays on palette despite unrelated editor or picker opening',()=>{
 document.body.insertAdjacentHTML('beforeend','<div data-tour="box-editor" data-box-id="0"></div><div data-tour="reference-picker"></div>');
 expect(lessonTarget(1,elements)).toBe(document.querySelector('[aria-label]'));
});
test('value lesson automatically hands off from its object to its own editor',()=>{
 expect(lessonTarget(2,elements)).toBe(document.querySelector('[data-canvas-box-id="1"]'));
 document.body.insertAdjacentHTML('beforeend','<div data-tour="box-editor" data-box-id="0"></div>');
 expect(lessonTarget(2,elements)).toBe(document.querySelector('[data-canvas-box-id="1"]'));
 document.querySelector('[data-tour="box-editor"]')!.setAttribute('data-box-id','1');
 expect(lessonTarget(2,elements)).toBe(document.querySelector('[data-tour="box-editor"]'));
});
test('reference lesson hands off main to function editor to ID picker without extra clicks',()=>{
 expect(lessonTarget(3,elements)).toBe(document.querySelector('[data-canvas-box-id="0"]'));
 document.body.insertAdjacentHTML('beforeend','<div data-tour="box-editor" data-box-id="0"></div>');
 expect(lessonTarget(3,elements)).toBe(document.querySelector('[data-tour="box-editor"]'));
 document.body.insertAdjacentHTML('beforeend','<div data-tour="reference-picker"></div>');
 expect(lessonTarget(3,elements)).toBe(document.querySelector('[data-tour="reference-picker"]'));
});
test('card placement avoids the target and an adjacent editor',()=>{
 const target=new DOMRect(400,200,150,100), editor=new DOMRect(570,180,330,300);
 const p=placeCard(target,300,250,1200,800,[editor]);
 expect(p.left+300<=editor.left || p.left>=editor.right || p.top+250<=editor.top || p.top>=editor.bottom).toBe(true);
 expect(p.left+300<=target.left || p.left>=target.right || p.top+250<=target.top || p.top>=target.bottom).toBe(true);
});
test('visible bounds exclude invisible drag padding',()=>{
 const wrapper=document.querySelector('[data-canvas-box-id="1"]')!;
 wrapper.innerHTML='<svg><path/><rect fill="transparent" data-overlay="true"/></svg>';
 wrapper.querySelector('path')!.getBoundingClientRect=()=>new DOMRect(10,20,100,60);
 wrapper.querySelector('rect')!.getBoundingClientRect=()=>new DOMRect(0,0,150,100);
 expect(targetBounds(wrapper).toJSON()).toEqual(new DOMRect(10,20,100,60).toJSON());
});
