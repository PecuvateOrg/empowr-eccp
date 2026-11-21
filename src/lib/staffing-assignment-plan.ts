import { validateAllocation, staffingRequirement, type Allocation, type Shift, type Role } from "./staffing-allocation";
import type { AdminRole } from "./coach-permissions";

export type Eligibility = { coachId: string; shiftId: string; roles: Role[] };
export type AssignmentRequest = { coachId: string; shiftIds: string[]; role: Role; additionalPaid?: boolean; reason?: string };

// Pure preflight only. All context except request must be loaded by the server
// inside the eventual transaction, never supplied by a browser.
export function planAssignments(actor: {id:string; admin_role:AdminRole}, request: AssignmentRequest,
 context: {shifts:Shift[]; assignableIds:string[]; eligibility:Eligibility[]; existing:Allocation[]}) {
 if(actor.admin_role !== "admin" || !actor.id.trim()) throw new Error("Not authorised");
 if(!request.coachId.trim() || !request.shiftIds.length || new Set(request.shiftIds).size !== request.shiftIds.length) throw new Error("Invalid assignment selection");
 if(!(["head","assistant","junior_assistant"] as Role[]).includes(request.role)) throw new Error("Invalid staffing role");
 const planned:Allocation[] = [];
 for(const shiftId of request.shiftIds){
  if(!context.assignableIds.includes(shiftId)) throw new Error("Session not assignable");
  const eligible = context.eligibility.some(e=>e.coachId===request.coachId && e.shiftId===shiftId && e.roles.includes(request.role));
  const allocation:Allocation={shiftId,coachId:request.coachId,role:request.role,eligible,additionalPaid:request.additionalPaid===true,reason:request.additionalPaid===true?request.reason?.trim():undefined,approvedBy:request.additionalPaid===true?actor.id:undefined};
  validateAllocation(allocation,context.shifts,[...context.existing,...planned]);
  planned.push(allocation);
 }
 return {allocations:planned,coverage:request.shiftIds.map(id=>({shiftId:id,...staffingRequirement(context.shifts.find(s=>s.id===id)!.children,[...context.existing,...planned].filter(a=>a.shiftId===id))}))};
}
