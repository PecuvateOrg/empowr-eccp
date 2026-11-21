import { test } from "node:test";
import assert from "node:assert/strict";
import { planReconciliation, type StoredSession } from "./staffing-reconciliation";
const row: StoredSession = {source_key:"occurrence:1",offering_id:"1",title:"Example",starts_at:"2027-01-11T15:30:00Z",ends_at:"2027-01-11T16:30:00Z",venue:null,status:"scheduled",reconciliation_state:"current",missingSnapshots:0};
const version="a".repeat(64), now="2026-11-21T00:00:00Z";
test("changed or cancelled sessions require review",()=>{
 for(const session of [{...row,status:"cancelled" as const},{...row,ends_at:"2027-01-11T17:30:00Z"}]){
 assert.equal(planReconciliation({snapshotVersion:version,sessions:[session]},[row],now).upserts[0].reconciliation_state,"review");
 }
});
test("missing records are not cancelled and repeated absence requires review",()=>{
 const first=planReconciliation({snapshotVersion:version,sessions:[]},[row],now);
 assert.equal(first.missing[0].reconciliation_state,"current");
 const second=planReconciliation({snapshotVersion:version,sessions:[]},[{...row,missingSnapshots:1}],now);
 assert.equal(second.missing[0].reconciliation_state,"review");
 assert.equal(second.upserts.length,0);
});
test("duplicate keys fail closed",()=>assert.throws(()=>planReconciliation({snapshotVersion:version,sessions:[row,row]},[],now)));
