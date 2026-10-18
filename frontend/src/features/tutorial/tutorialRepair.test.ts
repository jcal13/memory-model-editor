import { assignmentRepair } from './tutorialRepair';
import { CanvasElement } from '../shared/types';
const model = (): CanvasElement[] => [
 {boxId:0,id:'_',x:0,y:0,kind:{name:'function',type:'function',value:null,functionName:'__main__',params:[{name:'a',targetId:1},{name:'b',targetId:2}]}},
 {boxId:1,id:1,x:0,y:0,kind:{name:'primitive',type:'int',value:'5'}},
 {boxId:2,id:2,x:0,y:0,kind:{name:'primitive',type:'int',value:'3'}},
];
test('repairs the existing assignment even if another object has the expected value',()=>{
 const m=model(); m.push({...m[2],boxId:3,id:3,kind:{name:'primitive',type:'int',value:'4'}});
 expect(assignmentRepair(4,m).target?.id).toBe(2);
});
test('does not change an object shared with a different variable',()=>{
 const m=model(); if(m[0].kind.name==='function') m[0].kind.params[1].targetId=1;
 expect(assignmentRepair(4,m).target?.id).toBe(2);
});
test.each([null,99])('repairs unassigned or dangling references %s without adding variables',targetId=>{
 const m=model(); if(m[0].kind.name==='function') m[0].kind.params[1].targetId=targetId;
 m[2].kind={name:'primitive',type:'int',value:'4'};
 expect(assignmentRepair(4,m).text).toContain('change the existing variable b');
});
test('deleted object requires a replacement, but not another variable',()=>{
 expect(assignmentRepair(4,model().slice(0,2)).text).toContain('update the existing variable b');
});
test('missing variable reuses an available object',()=>{
 const m=model(); if(m[0].kind.name==='function') m[0].kind.params.pop();
 m[2].kind={name:'primitive',type:'int',value:'4'};
 expect(assignmentRepair(4,m).text).toContain('add variable b and select ID 2');
});
