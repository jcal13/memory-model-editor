import { checkTutorial, hasAssignment } from "./tutorialModel";
import { CanvasElement } from "../shared/types";
const model = (): CanvasElement[] => [
 {boxId: 0, id: "_", x: 0, y: 0, kind: {name: "function", type: "function", value: null, functionName: "__main__", params: [{name: "a", targetId: 10}, {name: "b", targetId: 20}, {name: "c", targetId: 30}]}},
 ...[5,4,6].map((value, index): CanvasElement => ({boxId:index+1, id:(index+1)*10, x:0,y:0,kind:{name:"primitive",type:"int",value:String(value)}}))
];
test("accepts correct references regardless of numeric IDs or positions", () => expect(checkTutorial(model())).toEqual([]));
test("does not confuse an object's value with a variable reference", () => {
 const m=model(); if(m[0].kind.name === "function") m[0].kind.params[0].targetId=5;
 expect(hasAssignment(m,"a",5)).toBe(false); expect(checkTutorial(m)).not.toEqual([]);
});
test("rejects duplicates, orphan objects, invalid boxes, and extra variables", () => {
 const duplicate=model(); duplicate[2].id=10; expect(checkTutorial(duplicate).length).toBeGreaterThan(0);
 const orphan=model(); orphan.push({...orphan[1],boxId:4,id:40}); expect(checkTutorial(orphan).length).toBeGreaterThan(0);
 const invalid=model(); invalid[1].invalidated=true; expect(checkTutorial(invalid).length).toBeGreaterThan(0);
 const extra=model(); if(extra[0].kind.name === "function") extra[0].kind.params.push({name:"d",targetId:10}); expect(checkTutorial(extra).length).toBeGreaterThan(0);
});
test("rejects wrong types and values", () => { const m=model(); if(m[1].kind.name === "primitive") m[1].kind.type="str"; expect(hasAssignment(m,"a",5)).toBe(false); });
