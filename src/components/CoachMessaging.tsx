"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type Conversation = {
 id: string; category: string; title: string; status: string; updated_at: string;
};
const categories = [
 { value: "general", label: "General enquiry" },
 { value: "scheduling", label: "Scheduling" },
 { value: "training", label: "Training" },
 { value: "other", label: "Other" },
];

export function CoachMessaging() {
 const [conversations, setConversations] = useState<Conversation[]>([]);
 const [loading, setLoading] = useState(true);
 const [listError, setListError] = useState("");
 const [category, setCategory] = useState("general");
 const [title, setTitle] = useState("");
 const [body, setBody] = useState("");
 const [sending, setSending] = useState(false);
 const [sendError, setSendError] = useState("");
 const [sent, setSent] = useState(false);
 const pendingKey = useRef<string | null>(null);

 const refresh = useCallback(async () => {
  try {
   const response = await fetch("/api/messages", { cache: "no-store" });
   if (!response.ok) throw new Error("Unable to load your conversations.");
   const result = await response.json() as { conversations?: Conversation[] };
   setConversations(result.conversations ?? []);
   setListError("");
  } catch {
   setListError("Unable to load conversations. Please try again.");
  } finally { setLoading(false); }
 }, []);

 useEffect(() => {\n  const start = () => { void refresh(); };\n  start();\n }, [refresh]);

 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (sending || !title.trim() || !body.trim()) return;
  setSending(true);
  setSendError("");
  setSent(false);
  // Preserve the key after a network failure so retrying the same payload is safe.
  const key = pendingKey.current ?? crypto.randomUUID();
  pendingKey.current = key;
  try {
   const response = await fetch("/api/messages/new", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, title: title.trim(), body: body.trim(), idempotencyKey: key }),
   });
   if (!response.ok) {
    const result = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(result.error || "Your message could not be sent.");
   }
   pendingKey.current = null;
   setTitle("");
   setBody("");
   setSent(true);
   await refresh();
  } catch (error) {
   setSendError(error instanceof Error ? error.message : "Your message could not be sent.");
  } finally { setSending(false); }
 }

 function changed() {
  pendingKey.current = null;
  setSent(false);
  setSendError("");
 }

 return <>
  <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6" aria-labelledby="private-title">
   <h2 id="private-title" className="text-xl font-bold">Message the staff team</h2>
   <p className="mt-2 text-sm text-muted">Your enquiry goes to the shared Staff Inbox. Staff will route it to the appropriate person. For urgent safeguarding concerns, use the separate safeguarding reporting process.</p>
   <form onSubmit={submit} className="mt-5 space-y-4">
    <label className="block text-sm font-bold" htmlFor="message-category">Category</label>
    <select id="message-category" value={category} onChange={e => { setCategory(e.target.value); changed(); }} className="w-full rounded-xl border border-border bg-white p-3">
     {categories.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
    </select>
    <label className="block text-sm font-bold" htmlFor="message-title">Subject</label>
    <input id="message-title" required maxLength={120} value={title} onChange={e => { setTitle(e.target.value); changed(); }} className="w-full rounded-xl border border-border p-3" placeholder="What is your enquiry about?" />
    <label className="block text-sm font-bold" htmlFor="message-body">Message</label>
    <textarea id="message-body" required maxLength={5000} rows={5} value={body} onChange={e => { setBody(e.target.value); changed(); }} className="w-full rounded-xl border border-border p-3" placeholder="Write your message to the staff team" />
    {sendError && <p role="alert" className="text-sm font-semibold text-red-dark">{sendError}</p>}
    {sent && <p role="status" className="text-sm font-semibold">Your message has been sent to the staff team.</p>}
    <button type="submit" disabled={sending} className="rounded-xl bg-blue px-5 py-3 font-bold text-white disabled:opacity-60">{sending ? "Sending…" : "Send message"}</button>
   </form>
  </section>
  <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6" aria-labelledby="conversation-title">
   <div className="flex items-center justify-between gap-3">
    <h2 id="conversation-title" className="text-xl font-bold">My enquiries</h2>
    <button type="button" onClick={() => void refresh()} className="text-sm font-bold text-blue underline">Refresh</button>
   </div>
   {loading ? <p role="status" className="mt-3 text-sm text-muted">Loading enquiries…</p> :
    listError ? <p role="alert" className="mt-3 text-sm text-red-dark">{listError}</p> :
    conversations.length === 0 ? <p className="mt-3 text-sm text-muted">You have no enquiries yet.</p> :
    <ul className="mt-4 divide-y divide-border">{conversations.map(item => <li key={item.id} className="py-3">
     <p className="font-bold">{item.title}</p>
     <p className="text-sm text-muted">{item.category} · {item.status} · {new Date(item.updated_at).toLocaleDateString("en-GB")}</p>
    </li>)}</ul>}
   <p className="mt-4 text-xs text-muted">Conversation replies and group chats are being prepared.</p>
  </section>
 </>;
}
