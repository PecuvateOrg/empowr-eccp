export type ReminderShift = {assignmentId:string; startsAt:string; confirmed:boolean; sessionStatus:"scheduled"|"cancelled"; needsReview:boolean};
export function dueShiftReminders(shifts:ReminderShift[], now:string, delivered:ReadonlySet<string>){
 const time=Date.parse(now);
 if(!Number.isFinite(time))throw new Error("Invalid reminder clock");
 const reminders:{assignmentId:string;kind:"24h"|"1h";key:string;dueAt:string}[]=[];
 const seen=new Set<string>(delivered);
 for(const shift of shifts){
  const start=Date.parse(shift.startsAt);
  if(!Number.isFinite(start)||!shift.assignmentId.trim())throw new Error("Invalid shift");
  if(!shift.confirmed||shift.sessionStatus!=="scheduled"||shift.needsReview||start<=time)continue;
  for(const [kind,hours] of [["24h",24],["1h",1]] as const){
   const due=start-hours*3600000;
   // Bounded catch-up window avoids stale reminders after outages.
   if(time<due||time>=due+15*60000)continue;
   const key=JSON.stringify([shift.assignmentId,start,kind]);
   if(seen.has(key))continue;
   seen.add(key);
   reminders.push({assignmentId:shift.assignmentId,kind,key,dueAt:new Date(due).toISOString()});
  }
 }
 return reminders;
}
