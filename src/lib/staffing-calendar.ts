export type CalendarShift = {id:string; title:string; startsAt:string; endsAt:string; venue:string; updatedAt:string; cancelled:boolean};
const escapeText=(s:string)=>s.replace(/\\/g,"\\\\").replace(/\r\n|\r|\n/g,"\\n").replace(/;/g,"\\;").replace(/,/g,"\\,");
function stamp(s:string){
 const d=new Date(s);
 if(!Number.isFinite(d.getTime()))throw new Error("Invalid calendar timestamp");
 return d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
}
function fold(line:string){
 const encoder=new TextEncoder();
 let result="", bytes=0;
 for(const c of line){
  const n=encoder.encode(c).length;
  if(bytes+n>75){result+="\r\n ";bytes=1;}
  result+=c;bytes+=n;
 }
 return result;
}
// Caller must supply only the authorised coach's assignments.
export function formatShiftCalendar(shifts:CalendarShift[]){
 const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Empowr CIC//ECCP Shifts//EN","CALSCALE:GREGORIAN","X-WR-CALNAME:Empowr My Shifts"];
 const seen=new Set<string>();
 for(const s of shifts){
  if(!/^[a-zA-Z0-9_-]+$/.test(s.id)||seen.has(s.id)||Date.parse(s.endsAt)<=Date.parse(s.startsAt))throw new Error("Invalid calendar shift");
  seen.add(s.id);
  lines.push("BEGIN:VEVENT","UID:"+s.id+"@eccp.empowrcic.org","DTSTAMP:"+stamp(s.updatedAt),"LAST-MODIFIED:"+stamp(s.updatedAt),"DTSTART:"+stamp(s.startsAt),"DTEND:"+stamp(s.endsAt),"SUMMARY:"+escapeText(s.title),"LOCATION:"+escapeText(s.venue),"STATUS:"+(s.cancelled?"CANCELLED":"CONFIRMED"),"END:VEVENT");
 }
 return lines.concat("END:VCALENDAR").map(fold).join("\r\n")+"\r\n";
}
