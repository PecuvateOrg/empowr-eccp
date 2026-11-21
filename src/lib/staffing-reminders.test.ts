import {test} from "node:test";
import assert from "node:assert/strict";
import {dueShiftReminders} from "./staffing-reminders";
const shift={assignmentId:"a",startsAt:"2027-01-02T12:00:00Z",confirmed:true,sessionStatus:"scheduled" as const,needsReview:false};
test("24-hour and one-hour reminders",()=>{
 assert.equal(dueShiftReminders([shift],"2027-01-01T12:00:00Z",new Set())[0].kind,"24h");
 assert.equal(dueShiftReminders([shift],"2027-01-02T11:00:00Z",new Set())[0].kind,"1h");
});
test("duplicates, cancellation, review and late delivery suppressed",()=>{
 const now="2027-01-01T12:00:00Z";
 const result=dueShiftReminders([shift,shift],now,new Set());
 assert.equal(result.length,1);
 assert.equal(dueShiftReminders([shift],now,new Set([result[0].key])).length,0);
 assert.equal(dueShiftReminders([{...shift,sessionStatus:"cancelled"},{...shift,needsReview:true}],now,new Set()).length,0);
 assert.equal(dueShiftReminders([shift],"2027-01-01T13:00:00Z",new Set()).length,0);
});
