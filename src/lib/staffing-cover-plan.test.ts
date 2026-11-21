import {test} from "node:test";
import assert from "node:assert/strict";
import {acceptCoverRequest,planCoverApproval,type CoverRequest} from "./staffing-cover-plan";
const original={shiftId:"s",coachId:"a",role:"head" as const,eligible:true};
const request:CoverRequest={shiftId:"s",originalCoachId:"a",replacementCoachId:"b",state:"requested"};
const coach={id:"b",admin_role:"coach" as const};
const manager={id:"m",admin_role:"admin" as const};
const eligibility=[{coachId:"b",shiftId:"s",roles:["head" as const]}];
const context={shifts:[{id:"s",startsAt:"2027-01-01T10:00:00Z",endsAt:"2027-01-01T11:00:00Z",children:10}],assignableIds:["s"],existing:[original],eligibility};
test("only replacement may accept",()=>assert.throws(()=>acceptCoverRequest(manager,request,original,eligibility)));
test("requires accepted cover and admin approval",()=>{
 assert.throws(()=>planCoverApproval(manager,request,context));
 const accepted=acceptCoverRequest(coach,request,original,eligibility);
 assert.throws(()=>planCoverApproval(coach,accepted,context));
 assert.equal(context.existing[0].coachId,"a");
 assert.equal(planCoverApproval(manager,accepted,context).allocations[0].coachId,"b");
 assert.throws(()=>planCoverApproval(manager,accepted,{...context,eligibility:[]}));
});
