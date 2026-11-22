import {test} from "node:test";
import assert from "node:assert/strict";
import {formatShiftCalendar} from "./staffing-calendar";
const shift={id:"example",title:"School, club\nBEGIN:VEVENT",startsAt:"2027-06-01T15:30:00+01:00",endsAt:"2027-06-01T16:30:00+01:00",venue:"School; hall",updatedAt:"2026-11-21T00:00:00Z",cancelled:false};
test("UTC times, escaped text and stable identity",()=>{
 const result=formatShiftCalendar([shift]);
 assert.ok(result.includes("DTSTART:20270601T143000Z"));
 assert.ok(result.includes("SUMMARY:School\\, club\\nBEGIN:VEVENT"));
 assert.ok(result.includes("UID:example@eccp.empowrcic.org"));
});
test("cancellation and duplicate rejection",()=>{
 assert.ok(formatShiftCalendar([{...shift,cancelled:true}]).includes("STATUS:CANCELLED"));
 assert.throws(()=>formatShiftCalendar([shift,shift]));
});
