type Shift = { id:string; coachId:string; role:"head"|"assistant"|"junior_assistant"; startsAt:string; endsAt:string; confirmed:boolean; arrivedAt?:string; completedAt?:string };
type FirstAid = "none"|"report_submitted";
function times(shift:Shift,now:string){
 const start=Date.parse(shift.startsAt),end=Date.parse(shift.endsAt),time=Date.parse(now);
 if(![start,end,time].every(Number.isFinite)||end<=start)throw new Error("Invalid shift times");
 return {start,end,time};
}
// Pure preflight. Actor, clock, location verification and report status must
// be supplied by trusted server services, not accepted from browser input.
export function planArrival(actorId:string,shift:Shift,now:string,locationVerified:boolean){
 const {start,end,time}=times(shift,now);
 if(!actorId||actorId!==shift.coachId||!shift.confirmed||shift.arrivedAt||time>=end||!locationVerified)throw new Error("Arrival not authorised");
 return {arrivedAt:now,late:time>start};
}
export function attendanceStatus(shift:Shift,now:string){
 const {start,end,time}=times(shift,now);
 return {late:shift.confirmed&&!shift.arrivedAt&&time>start&&time<end,endReminder:shift.confirmed&&!shift.completedAt&&time>=end-900000&&time<end,overdue:shift.confirmed&&!shift.completedAt&&time>=end+86400000};
}
export function planCompletion(actorId:string,shift:Shift,now:string,firstAid?:FirstAid){
 const {end,time}=times(shift,now);
 if(!actorId||actorId!==shift.coachId||!shift.confirmed||shift.completedAt||time<end)throw new Error("Completion not authorised");
 if(shift.role==="head"&&firstAid!=="none"&&firstAid!=="report_submitted")throw new Error("First aid confirmation required");
 if(shift.role!=="head"&&firstAid!==undefined)throw new Error("Only head coach submits first aid confirmation");
 return {completedAt:now,late:time>end+86400000};
}
