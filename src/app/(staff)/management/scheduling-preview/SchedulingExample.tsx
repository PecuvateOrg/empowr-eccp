"use client";
import { useState } from "react";
import { selectDates, validateAllocation, staffingRequirement, approveCover, type Allocation, type Duration } from "@/lib/staffing-allocation";

const shifts = [
  ...Array.from({length: 10}, (_, i) => { const date = new Date(Date.UTC(2027, 0, 11 + i * 7)).toISOString().slice(0, 10); return { id: "school-"+i, title: "Example school club", series: "school", startsAt: date+"T15:30:00Z", endsAt: date+"T16:30:00Z", children: 24 }; }),
  {id:"event",title:"Example overlapping event",series:"event",startsAt:"2027-01-11T16:00:00Z",endsAt:"2027-01-11T17:00:00Z",children:16},
];
const coaches = [{id:"a",role:"head"},{id:"b",role:"assistant"},{id:"c",role:"assistant"},{id:"d",role:"junior_assistant"}] as const;
const field = "mt-1 block w-full rounded-lg border border-border bg-card p-2";
export function SchedulingExample() {
  const [allocations,setAllocations] = useState<Allocation[]>([]);
  const [selected,setSelected] = useState("school-0");
  const [duration,setDuration] = useState<Duration>("single");
  const [custom,setCustom] = useState<string[]>([]);
  const [coach,setCoach] = useState("a");
  const [paid,setPaid] = useState(false);
  const [reason,setReason] = useState("");
  const [approved,setApproved] = useState(false);
  const [filter,setFilter] = useState(false);
  const [message,setMessage] = useState("");
  const [cover,setCover] = useState<{original:Allocation; replacement:string;accepted:boolean;approved:boolean}|null>(null);
  const selectedShift = shifts.find(s=>s.id===selected)!;
  const series = shifts.filter(s=>s.series===selectedShift.series && s.startsAt>=selectedShift.startsAt);
  function allocate(){
    try {
      const ids = duration==="single"?[selected]:duration==="custom"?custom:duration==="weekly"?series.slice(0,4).map(s=>s.id):series.map(s=>s.id);
      const dates = selectDates(shifts,ids,duration);
      const c = coaches.find(c=>c.id===coach)!;
      const next = [...allocations];
      for(const s of dates){
        const a:Allocation = {shiftId:s.id,coachId:c.id,role:c.role,eligible:true,additionalPaid:paid,reason:paid?reason:undefined,approvedBy:paid&&approved?"Example manager":undefined};
        validateAllocation(a,shifts,next); next.push(a);
      }
      setAllocations(next);setMessage("Example allocation added.");
    } catch(e){setMessage(e instanceof Error?e.message:"Allocation rejected");}
  }
  function completeCover(){
    if(!cover)return;
    try{
      const c=coaches.find(c=>c.id===cover.replacement);
      if(!c)throw new Error("Select a replacement");
      setAllocations(approveCover(cover.original,{...cover.original,coachId:c.id,role:c.role,eligible:true},cover.accepted,cover.approved?"Example manager":"",shifts,allocations));
      setCover(null);setMessage("Example cover approved.");
    }catch(e){setMessage(e instanceof Error?e.message:"Cover rejected");}
  }
  const requirement=(id:string,children:number)=>staffingRequirement(children,allocations.filter(a=>a.shiftId===id));
  return <section className="mt-6 space-y-4">
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-bold">Allocate a coach</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Starting session<select className={field} value={selected} onChange={e=>{setSelected(e.target.value);setCustom([]);}}>{shifts.map(s=><option key={s.id} value={s.id}>{s.title} · {s.startsAt.slice(0,10)}</option>)}</select></label>
        <label className="text-sm">Assignment duration<select className={field} value={duration} onChange={e=>setDuration(e.target.value as Duration)}><option value="single">Single session</option><option value="weekly">Next four weekly sessions</option><option value="term">Remaining example term</option><option value="custom">Custom dates</option></select></label>
        <label className="text-sm">Coach<select className={field} value={coach} onChange={e=>setCoach(e.target.value)}>{coaches.map(c=><option key={c.id} value={c.id}>Example coach {c.id.toUpperCase()} · {c.role.replaceAll("_"," ")}</option>)}</select></label>
      </div>
      {duration==="custom"&&<fieldset className="mt-3"><legend className="text-sm font-bold">Choose dates</legend>{series.map(s=><label key={s.id} className="flex gap-2 text-sm"><input type="checkbox" checked={custom.includes(s.id)} onChange={e=>setCustom(prev=>e.target.checked?[...prev,s.id]:prev.filter(id=>id!==s.id))}/>{s.startsAt.slice(0,10)}</label>)}</fieldset>}
      <label className="mt-4 flex gap-2 text-sm"><input type="checkbox" checked={paid} onChange={e=>setPaid(e.target.checked)}/>Additional paid coach — training and development</label>
      {paid&&<div className="mt-3 space-y-2"><label className="block text-sm">Reason<input className={field} value={reason} onChange={e=>setReason(e.target.value)}/></label><label className="flex gap-2 text-sm"><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/>Simulate management approval</label></div>}
      <button type="button" className="mt-4 rounded-lg border border-border px-4 py-2 font-bold text-blue" onClick={allocate}>Add example allocation</button>
    </div>
    <p role="status" className="text-sm font-semibold">{message}</p>
    {cover&&<div className="rounded-xl border border-border p-4 space-y-2"><h2 className="font-bold">Example cover request</h2><label className="block text-sm">Replacement<select className={field} value={cover.replacement} onChange={e=>setCover({...cover,replacement:e.target.value})}><option value="">Choose coach</option>{coaches.filter(c=>c.id!==cover.original.coachId&&c.role===cover.original.role).map(c=><option key={c.id} value={c.id}>Example coach {c.id.toUpperCase()}</option>)}</select></label><label className="flex gap-2 text-sm"><input type="checkbox" checked={cover.accepted} onChange={e=>setCover({...cover,accepted:e.target.checked})}/>Simulate coach acceptance</label><label className="flex gap-2 text-sm"><input type="checkbox" checked={cover.approved} onChange={e=>setCover({...cover,approved:e.target.checked})}/>Simulate management approval</label><button type="button" onClick={completeCover} className="font-bold text-blue">Confirm example cover</button><button type="button" onClick={()=>setCover(null)} className="ml-4 text-sm">Cancel</button></div>}
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={filter} onChange={e=>setFilter(e.target.checked)}/>Show staffing gaps only</label>
    {shifts.filter(s=>!filter||!requirement(s.id,s.children).covered).map(s=>{const r=requirement(s.id,s.children);return <article key={s.id} className="rounded-xl border border-border bg-card p-4"><h2 className="font-bold">{s.title}</h2><p className="text-sm text-muted">{s.startsAt.slice(0,10)} · {s.startsAt.slice(11,16)}–{s.endsAt.slice(11,16)}</p><p className="mt-2 text-sm">{r.assigned}/{r.required} required coaches · {r.covered?"Example minimum met":"Staffing gap"}</p>{allocations.filter(a=>a.shiftId===s.id).map(a=><div key={a.coachId} className="mt-2 flex flex-wrap items-center gap-2 text-sm"><span>Coach {a.coachId.toUpperCase()} · {a.role}{a.additionalPaid?" · Additional paid":""}</span><button type="button" className="text-blue font-semibold" onClick={()=>setCover({original:a,replacement:"",accepted:false,approved:false})}>Request cover</button></div>)}</article>;})}
    <p className="text-xs text-muted">Fictional data only. Approval controls simulate different users; no actual permissions, pay or notifications are applied.</p>
  </section>;
}
