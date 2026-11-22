"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { categoryLabel, priorityLabel, staffStatusLabel } from "@/lib/coach-messages-view";

type Thread = { id:string; title:string; category:string; status:string; priority:string; coachName:string; assigneeId:string|null; assigneeName:string|null; updatedAt:string; waitingForStaff:boolean };
type Staff = { id:string; name:string };
type Entry = { id:string; authorName:string; fromCoach:boolean; body:string; internalNote:boolean; createdAt:string };
type ApiError = { error?:string };
async function jsonOrError(response:Response) {
 const result = await response.json().catch(() => ({})) as ApiError;
 if (!response.ok) throw new Error(result.error || "Request failed. Please try again.");
 return result;
}
async function fetchQueue():Promise<{threads:Thread[];staff:Staff[]}> {
 const data=await jsonOrError(await fetch("/api/management/messages",{cache:"no-store"})) as {conversations?:Thread[];staff?:Staff[]};
 return {threads:data.conversations??[],staff:data.staff??[]};
}
async function fetchEntries(id:string):Promise<Entry[]> {
 const data=await jsonOrError(await fetch(`/api/management/messages/${id}/history`,{cache:"no-store"})) as {messages?:Entry[]};
 return data.messages??[];
}
export function StaffMessaging({ canManage, initialSelected=null }: { canManage:boolean; initialSelected?:string|null }) {
 const [threads,setThreads]=useState<Thread[]>([]);
 const [staff,setStaff]=useState<Staff[]>([]);
 const [selected,setSelected]=useState<string|null>(initialSelected);
 const [search,setSearch]=useState("");
 const [notesOpen,setNotesOpen]=useState(false);
 const [entries,setEntries]=useState<Entry[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [internal,setInternal]=useState(false);
 const [sending,setSending]=useState(false);
 const [saving,setSaving]=useState(false);
 const [success,setSuccess]=useState("");
 const pendingKey=useRef<string|null>(null);
 const current=threads.find(t=>t.id===selected);
 const filteredThreads=threads.filter(t=>`${t.title} ${t.coachName} ${t.category}`.toLowerCase().includes(search.toLowerCase()));
 const refresh=useCallback(async()=>{
  try {
   {const q=await fetchQueue();setThreads(q.threads);setStaff(q.staff);}setError("");
  }catch(e){setError(e instanceof Error?e.message:"Inbox unavailable");}
  finally{setLoading(false);}
 },[]);
 const loadEntries=useCallback(async(id:string)=>{
  try {
   setEntries(await fetchEntries(id));setError("");
  }catch(e){setError(e instanceof Error?e.message:"Unable to load conversation");setEntries([]);}
 },[]);
 // Effects set state only in promise callbacks (react-hooks/set-state-in-effect);
 // `live` drops results that arrive after the selection changed or unmount.
 useEffect(()=>{
  let live=true;
  fetchQueue()
   .then(q=>{if(live){setThreads(q.threads);setStaff(q.staff);setError("");}},e=>{if(live)setError(e instanceof Error?e.message:"Inbox unavailable");})
   .finally(()=>{if(live)setLoading(false);});
  return ()=>{live=false;};
 },[]);
 useEffect(()=>{
  if(!selected)return;
  let live=true;
  fetchEntries(selected)
   .then(items=>{if(live){setEntries(items);setError("");}},e=>{if(live){setError(e instanceof Error?e.message:"Unable to load conversation");setEntries([]);}});
  return ()=>{live=false;};
 },[selected]);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!selected||!message.trim()||sending)return;
  setSending(true);setError("");setSuccess("");
  const key=pendingKey.current??crypto.randomUUID();pendingKey.current=key;
  const path=internal?`/api/management/messages/${selected}/notes`:`/api/messages/${selected}/reply`;
  try {
   await jsonOrError(await fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({body:message.trim(),idempotencyKey:key})}));
   pendingKey.current=null;setMessage("");setSuccess(internal?"Internal note saved.":"Reply sent.");
   await loadEntries(selected);await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to send");}
  finally{setSending(false);}
 }
 async function update(field:"priority"|"status"|"assigneeId",value:string|null){
  if(!selected||!canManage)return;
  setSaving(true);setError("");setSuccess("");
  try{
   await jsonOrError(await fetch(`/api/management/messages/${selected}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({[field]:value})}));
   await refresh();setSuccess("Conversation updated.");
  }catch(e){setError(e instanceof Error?e.message:"Unable to update");}
  finally{setSaving(false);}
 }
 return <section className="mt-8 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)_minmax(0,0.9fr)]">
  <div className={`${selected?"hidden lg:block":""} min-w-0 rounded-2xl border border-border bg-card p-4`}>
   <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Conversations</h2><button type="button" onClick={()=>void refresh()} className="text-sm font-bold text-blue underline">Refresh</button></div>
   <label className="mt-4 block text-sm font-bold">Search conversations<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name or subject" className="mt-1 w-full rounded-lg border border-border p-2 font-normal" /></label>
   {loading?<p role="status" className="mt-4 text-sm">Loading inbox…</p>:threads.length===0?<p className="mt-4 text-sm text-muted">No coach enquiries yet.</p>:
   <ul className="mt-4 space-y-2">{filteredThreads.map(t=><li key={t.id}><button type="button" onClick={()=>{setSelected(t.id);setEntries([]);setMessage("");pendingKey.current=null;setSuccess("");}} aria-current={selected===t.id?"true":undefined} className={`w-full rounded-xl border p-3 text-left ${selected===t.id?"border-blue bg-blue-pale":"border-border hover:bg-cream"}`}>
    <span className="flex items-start justify-between gap-2"><span className="block break-words font-bold">{t.title}</span>{t.waitingForStaff&&<span className="shrink-0 rounded-full bg-red-dark px-2 py-0.5 text-xs font-bold text-white">Waiting for staff</span>}</span>
    <span className="mt-1 block text-xs text-muted">{t.coachName} · {categoryLabel(t.category)} · {staffStatusLabel(t.status)} · {priorityLabel(t.priority)}</span>
    <span className="block text-xs text-muted">{t.assigneeName?`Assigned to ${t.assigneeName}`:"Unassigned"}</span>
   </button></li>)}</ul>}
  </div>
  <div className={`${!selected?"hidden lg:block":""} min-w-0 rounded-2xl border border-border bg-card p-4`}>
   {selected&&<button type="button" className="mb-3 font-semibold text-blue underline lg:hidden" onClick={()=>setSelected(null)}>Back to conversations</button>}
   {!current?<p className="text-sm text-muted">Select an enquiry to read and respond.</p>:<>
    <h2 className="text-xl font-bold">{current.title}</h2>
    <p className="mt-1 text-sm text-muted">From {current.coachName} · {categoryLabel(current.category)} · {staffStatusLabel(current.status)} · {current.assigneeName?`Assigned to ${current.assigneeName}`:"Unassigned"}</p>
    {canManage&&<div className="mt-4 grid grid-cols-2 gap-3">
     <label className="text-sm font-bold">Priority<select disabled={saving} value={current.priority} onChange={e=>void update("priority",e.target.value)} className="mt-1 w-full rounded-lg border border-border p-2">{["low","medium","high","urgent"].map(v=><option key={v} value={v}>{priorityLabel(v)}</option>)}</select></label>
     <label className="text-sm font-bold">Status<select disabled={saving} value={current.status} onChange={e=>void update("status",e.target.value)} className="mt-1 w-full rounded-lg border border-border p-2">{["new","in_progress","waiting_for_coach","resolved"].map(v=><option key={v} value={v}>{staffStatusLabel(v)}</option>)}</select></label>
     <label className="col-span-2 text-sm font-bold">Assigned to<select disabled={saving} value={current.assigneeId??""} onChange={e=>void update("assigneeId",e.target.value||null)} className="mt-1 w-full rounded-lg border border-border p-2"><option value="">Unassigned</option>{staff.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    </div>}
    <div className="mt-5 max-h-[60vh] min-h-64 space-y-3 overflow-y-auto rounded-xl bg-cream p-3" aria-label="Conversation history">
     {entries.length===0?<p className="text-sm text-muted">No messages to display.</p>:entries.map(entry=><article key={entry.id} className={`rounded-lg border p-3 ${entry.internalNote?"border-amber-300 bg-amber-50":entry.fromCoach?"border-border bg-white":"border-blue/30 bg-blue/5"}`}>
      {entry.internalNote&&<p className="text-xs font-black uppercase">Internal staff note — not visible to coaches</p>}
      <p className="text-xs font-bold text-muted">{entry.authorName}{entry.fromCoach?" (coach)":" (staff)"}</p>
      <p className="whitespace-pre-wrap break-words text-sm">{entry.body}</p><p className="mt-2 text-xs text-muted">{new Date(entry.createdAt).toLocaleString("en-GB",{timeZone:"Europe/London",dateStyle:"medium",timeStyle:"short"})}</p>
     </article>)}
    </div>
    <form onSubmit={submit} className="sticky bottom-0 mt-5 space-y-3 bg-card pt-3">
     <label className="block text-sm font-bold" htmlFor="staff-message">Reply or add an internal note</label>
     <textarea id="staff-message" required rows={4} maxLength={10000} value={message} onChange={e=>{setMessage(e.target.value);pendingKey.current=null;}} className="w-full rounded-xl border border-border p-3" placeholder="Write a message…" />
     <p className="text-xs text-muted">For private staff notes, use the management-only panel.</p>
     <button disabled={sending} className="rounded-xl bg-blue px-5 py-3 font-bold text-white disabled:opacity-60">{sending?"Saving…":internal?"Save internal note":"Send reply"}</button>
    </form>
   </>}
   {error&&<p role="alert" className="mt-3 text-sm font-semibold text-red-dark">{error}</p>}
   {success&&<p role="status" className="mt-3 text-sm font-semibold">{success}</p>}
  </div>
  <aside className={`${!selected?"hidden lg:block":""} min-w-0 rounded-2xl border border-border bg-card p-4`} aria-label="Management notes">
   <h2 className="text-lg font-bold">Internal notes</h2>
   {!current?<p className="mt-3 text-sm text-muted">Select a conversation to see private staff notes.</p>:<>
    <p className="mt-2 text-xs text-muted">Only staff can see these notes. They are never sent to the coach.</p>
    <button type="button" className="mt-3 text-sm font-semibold text-blue underline" onClick={()=>setNotesOpen(v=>!v)}>{notesOpen?"Hide notes":"Show notes"}</button>
    {notesOpen&&<div className="mt-3 max-h-72 space-y-2 overflow-y-auto">{entries.filter(e=>e.internalNote).length===0?<p className="text-sm text-muted">No internal notes yet.</p>:entries.filter(e=>e.internalNote).map(e=><article key={e.id} className="rounded-lg border border-border p-3 text-sm"><p className="font-semibold">{e.authorName}</p><p className="whitespace-pre-wrap break-words">{e.body}</p></article>)}</div>}
    <form onSubmit={submit} className="mt-4 space-y-2"><label className="block text-sm font-semibold" htmlFor="internal-note">Add private note</label><textarea id="internal-note" rows={4} maxLength={10000} value={internal?message:""} onChange={e=>{setInternal(true);setMessage(e.target.value);pendingKey.current=null;}} onFocus={()=>setInternal(true)} className="w-full rounded-lg border border-border p-2" placeholder="Visible to staff only…" /><button disabled={sending||!internal||!message.trim()} className="rounded-lg bg-blue px-3 py-2 text-sm font-bold text-white disabled:opacity-50">Save internal note</button></form>
   </>}
  </aside>
 </section>;
}
