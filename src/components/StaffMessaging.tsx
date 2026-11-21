"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type Thread = { id:string; title:string; category:string; status:string; priority:string; assigned_staff_id:string|null; updated_at:string };
type Entry = { id:string; author_id:string; body:string; internal_note:boolean; created_at:string };
type ApiError = { error?:string };
async function jsonOrError(response:Response) {
 const result = await response.json().catch(() => ({})) as ApiError;
 if (!response.ok) throw new Error(result.error || "Request failed. Please try again.");
 return result;
}
export function StaffMessaging({ canManage }: { canManage:boolean }) {
 const [threads,setThreads]=useState<Thread[]>([]);
 const [selected,setSelected]=useState<string|null>(null);
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
 const refresh=useCallback(async()=>{
  try {
   const r=await fetch("/api/management/messages",{cache:"no-store"});
   const data=await jsonOrError(r) as {conversations?:Thread[]};
   setThreads(data.conversations??[]);setError("");
  }catch(e){setError(e instanceof Error?e.message:"Inbox unavailable");}
  finally{setLoading(false);}
 },[]);
 const loadEntries=useCallback(async(id:string)=>{
  try {
   const r=await fetch(`/api/management/messages/${id}/history`,{cache:"no-store"});
   const data=await jsonOrError(r) as {messages?:Entry[]};
   setEntries(data.messages??[]);setError("");
  }catch(e){setError(e instanceof Error?e.message:"Unable to load conversation");setEntries([]);}
 },[]);
 useEffect(()=>{void refresh();},[refresh]);
 useEffect(()=>{if(selected)void loadEntries(selected);else setEntries([]);},[selected,loadEntries]);
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
 async function update(field:"priority"|"status",value:string){
  if(!selected||!canManage)return;
  setSaving(true);setError("");setSuccess("");
  try{
   await jsonOrError(await fetch(`/api/management/messages/${selected}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({[field]:value})}));
   await refresh();setSuccess("Conversation updated.");
  }catch(e){setError(e instanceof Error?e.message:"Unable to update");}
  finally{setSaving(false);}
 }
 return <section className="mt-8 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
  <div className="rounded-2xl border border-border bg-card p-5">
   <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Conversations</h2><button type="button" onClick={()=>void refresh()} className="text-sm font-bold text-blue underline">Refresh</button></div>
   {loading?<p role="status" className="mt-4 text-sm">Loading inbox…</p>:threads.length===0?<p className="mt-4 text-sm text-muted">No coach enquiries yet.</p>:
   <ul className="mt-4 space-y-2">{threads.map(t=><li key={t.id}><button type="button" onClick={()=>{setSelected(t.id);setMessage("");pendingKey.current=null;setSuccess("");}} aria-current={selected===t.id?"true":undefined} className={`w-full rounded-xl border p-3 text-left ${selected===t.id?"border-blue bg-blue-pale":"border-border hover:bg-cream"}`}>
    <span className="block font-bold">{t.title}</span><span className="mt-1 block text-xs text-muted">{t.category} · {t.status} · {t.priority}</span>
   </button></li>)}</ul>}
  </div>
  <div className="rounded-2xl border border-border bg-card p-5">
   {!current?<p className="text-sm text-muted">Select an enquiry to read and respond.</p>:<>
    <h2 className="text-xl font-bold">{current.title}</h2>
    <p className="mt-1 text-sm text-muted">{current.category} · {current.status}</p>
    {canManage&&<div className="mt-4 grid grid-cols-2 gap-3">
     <label className="text-sm font-bold">Priority<select disabled={saving} value={current.priority} onChange={e=>void update("priority",e.target.value)} className="mt-1 w-full rounded-lg border border-border p-2">{["low","medium","high","urgent"].map(v=><option key={v} value={v}>{v}</option>)}</select></label>
     <label className="text-sm font-bold">Status<select disabled={saving} value={current.status} onChange={e=>void update("status",e.target.value)} className="mt-1 w-full rounded-lg border border-border p-2">{["new","in_progress","waiting_for_coach","resolved"].map(v=><option key={v} value={v}>{v.replaceAll("_"," ")}</option>)}</select></label>
    </div>}
    <div className="mt-5 max-h-96 space-y-3 overflow-y-auto rounded-xl bg-cream p-3" aria-label="Conversation history">
     {entries.length===0?<p className="text-sm text-muted">No messages to display.</p>:entries.map(entry=><article key={entry.id} className={`rounded-lg border p-3 ${entry.internal_note?"border-amber-300 bg-amber-50":"border-border bg-white"}`}>
      {entry.internal_note&&<p className="text-xs font-black uppercase">Internal staff note — not visible to coaches</p>}
      <p className="whitespace-pre-wrap break-words text-sm">{entry.body}</p><p className="mt-2 text-xs text-muted">{new Date(entry.created_at).toLocaleString("en-GB")}</p>
     </article>)}
    </div>
    <form onSubmit={submit} className="mt-5 space-y-3">
     <label className="block text-sm font-bold" htmlFor="staff-message">Reply or add an internal note</label>
     <textarea id="staff-message" required rows={4} maxLength={10000} value={message} onChange={e=>{setMessage(e.target.value);pendingKey.current=null;}} className="w-full rounded-xl border border-border p-3" placeholder="Write a message…" />
     <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={internal} onChange={e=>{setInternal(e.target.checked);pendingKey.current=null;}}/> Internal note (staff only)</label>
     <button disabled={sending} className="rounded-xl bg-blue px-5 py-3 font-bold text-white disabled:opacity-60">{sending?"Saving…":internal?"Save internal note":"Send reply"}</button>
    </form>
   </>}
   {error&&<p role="alert" className="mt-3 text-sm font-semibold text-red-dark">{error}</p>}
   {success&&<p role="status" className="mt-3 text-sm font-semibold">{success}</p>}
  </div>
 </section>;
}
