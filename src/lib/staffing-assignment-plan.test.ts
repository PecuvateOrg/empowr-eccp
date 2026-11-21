import {test} from "node:test";
import assert from "node:assert/strict";
import {planAssignments,type AssignmentRequest} from "./staffing-assignment-plan";
const actor={id:"manager",admin_role:"admin" as const};
const req:AssignmentRequest={coachId:"coach",shiftIds:["a"],role:"head"};
const shift={id:"a",startsAt:"2027-01-11T15:00:00Z",endsAt:"2027-01-11T16:00:00Z",children:17};
const context={shifts:[shift,{...shift,id:"b"}],assignableIds:["a","b"],eligibility:[{coachId:"coach",shiftId:"a",roles:["head" as const]},{coachId:"coach",shiftId:"b",roles:["head" as const]}],existing:[]};
test("only admin may plan an assignment",()=>assert.throws(()=>planAssignments({...actor,admin_role:"coach"},req,context)));
test("eligibility is derived from trusted context",()=>assert.throws(()=>planAssignments(actor,req,{...context,eligibility:[]})));
test("overlapping batch is rejected",()=>assert.throws(()=>planAssignments(actor,{...req,shiftIds:["a","b"]},context)));
test("additional paid reason and coverage",()=>{
 assert.throws(()=>planAssignments(actor,{...req,additionalPaid:true},context));
 const result=planAssignments(actor,{...req,additionalPaid:true,reason:"Training"},context);
 assert.equal(result.allocations[0].approvedBy,"manager");
 assert.equal(result.coverage[0].assigned,0);
 assert.equal(result.coverage[0].required,2);
 assert.equal(result.coverage[0].covered,false);
});
