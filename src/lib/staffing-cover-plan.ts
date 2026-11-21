import { approveCover, type Allocation, type Shift } from "./staffing-allocation";
import type { AdminRole } from "./coach-permissions";
import type { Eligibility } from "./staffing-assignment-plan";

export type CoverRequest = {shiftId:string; originalCoachId:string; replacementCoachId:string; state:"requested"|"accepted"|"approved"; acceptedBy?:string};
type Actor = {id:string; admin_role:AdminRole};
export function acceptCoverRequest(actor:Actor, request:CoverRequest, original:Allocation, eligibility:Eligibility[]):CoverRequest {
 if(request.state!=="requested" || actor.id!==request.replacementCoachId || actor.id===request.originalCoachId || original.coachId!==request.originalCoachId || original.shiftId!==request.shiftId || !eligibility.some(e=>e.coachId===actor.id&&e.shiftId===request.shiftId&&e.roles.includes(original.role))) throw new Error("Cover acceptance not authorised");
 return {...request,state:"accepted",acceptedBy:actor.id};
}
// Trusted persisted request and context must be loaded inside a locked transaction.
export function planCoverApproval(actor:Actor, request:CoverRequest, context:{shifts:Shift[]; assignableIds:string[]; existing:Allocation[]; eligibility:Eligibility[]}) {
 if(actor.admin_role!=="admin" || !actor.id.trim() || request.state!=="accepted" || request.acceptedBy!==request.replacementCoachId || !context.assignableIds.includes(request.shiftId)) throw new Error("Cover approval not authorised");
 const original=context.existing.find(a=>a.shiftId===request.shiftId&&a.coachId===request.originalCoachId);
 if(!original) throw new Error("Original assignment missing");
 const eligible=context.eligibility.some(e=>e.coachId===request.replacementCoachId&&e.shiftId===request.shiftId&&e.roles.includes(original.role));
 const replacement:Allocation={...original,coachId:request.replacementCoachId,eligible,approvedBy:original.additionalPaid?actor.id:undefined};
 const allocations=approveCover(original,replacement,true,actor.id,context.shifts,context.existing);
 return {allocations,request:{...request,state:"approved" as const},approvedBy:actor.id};
}
