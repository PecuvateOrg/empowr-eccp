import { describe,it } from "node:test";
import assert from "node:assert/strict";
const expect = (actual: unknown) => ({ toBe(expected: unknown) { assert.equal(actual, expected); } });
import {calendarDayDifference,isCalendarDate,reminderEligible,type ReminderRecord} from "./compliance-reminder-rules";
const base:ReminderRecord={coachId:"coach-1",requirement:"safeguarding",status:"outstanding",deadline:"2026-12-01",renewalDate:"2027-12-01"};
describe("compliance reminder rules",()=>{
 it("rejects impossible dates",()=>{expect(isCalendarDate("2026-02-30")).toBe(false);expect(isCalendarDate("2028-02-29")).toBe(true);});
 it("uses completion deadline, never certificate renewal date",()=>{expect(reminderEligible(base,"seven_days","2026-11-24")).toBe(true);expect(reminderEligible(base,"seven_days","2027-11-24")).toBe(false);});
 it("supports one-day and overdue",()=>{expect(reminderEligible(base,"one_day","2026-11-30")).toBe(true);expect(reminderEligible(base,"overdue","2026-12-02")).toBe(true);});
 it("suppresses completed and not-required items",()=>{expect(reminderEligible({...base,status:"complete"},"manual","2026-11-24")).toBe(false);expect(reminderEligible({...base,status:"not_required"},"overdue","2026-12-02")).toBe(false);});
 it("does not assume missing deadlines",()=>{expect(reminderEligible({...base,deadline:null},"manual","2026-11-24")).toBe(false);});
 it("handles month and year boundaries",()=>{expect(calendarDayDifference("2027-01-01","2026-12-31")).toBe(1);});
});
