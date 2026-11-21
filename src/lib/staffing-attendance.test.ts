import {test} from "node:test";
import assert from "node:assert/strict";
import {planArrival,attendanceStatus,planCompletion} from "./staffing-attendance";
const shift={id:"s",coachId:"a",role:"head" as const,startsAt:"2027-01-01T10:00:00Z",endsAt:"2027-01-01T11:00:00Z",confirmed:true};
test("arrival requires ownership and verified location",()=>{
 assert.throws(()=>planArrival("b",shift,"2027-01-01T10:01:00Z",true));
 assert.throws(()=>planArrival("a",shift,"2027-01-01T10:01:00Z",false));
 assert.equal(planArrival("a",shift,"2027-01-01T10:01:00Z",true).late,true);
});
test("end reminder and overdue report",()=>{
 assert.equal(attendanceStatus(shift,"2027-01-01T10:45:00Z").endReminder,true);
 assert.equal(attendanceStatus(shift,"2027-01-02T11:00:00Z").overdue,true);
});
test("head coach must confirm first aid; late completion is retained",()=>{
 assert.throws(()=>planCompletion("a",shift,"2027-01-01T11:01:00Z"));
 assert.throws(()=>planCompletion("a",{...shift,role:"assistant"},"2027-01-01T11:01:00Z","none"));
 assert.equal(planCompletion("a",shift,"2027-01-02T12:00:00Z","none").late,true);
});
