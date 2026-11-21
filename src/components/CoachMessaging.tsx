"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type Conversation = {
 id: string; category: string; title: string; status: string; updated_at: string;
};
type MessageEntry = { id: string; author_id: string; body: string; created_at: string };
const categories = [
 { value: "general", label: "General enquiry" },
 { value: "scheduling", label: "Scheduling" },
 { value: "training", label: "Training" },
 { value: "other", label: "Other" },
];

async function fetchConversations(): Promise<Conversation[]> {
 const response = await fetch("/api/messages", { cache: "no-store" });
 if (!response.ok) throw new Error("Unable to load your conversations.");
 const result = await response.json() as { conversations?: Conversation[] };
 return result.conversations ?? [];
}

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
 const replyKey = useRef<string | null>(null);
 const [selected, setSelected] = useState<string | null>(null);
 const [entries, setEntries] = useState<MessageEntry[]>([]);
 const [threadLoading, setThreadLoading] = useState(false);
 const [threadError, setThreadError] = useState("");
 const [reply, setReply] = useState("");
 const [replySending, setReplySending] = useState(false);
 const [replySuccess, setReplySuccess] = useState("");
 const active = conversations.find(item => item.id === selected);

 const refresh = useCallback(async () => {
  try {
   setConversations(await fetchConversations());
   setListError("");
  } catch {
   setListError("Unable to load conversations. Please try again.");
  } finally { setLoading(false); }
 }, []);

 // Initial load: state is set only in the promise callbacks, never synchronously
 // in the effect (react-hooks/set-state-in-effect). `live` drops late results.
 useEffect(() => {
  let live = true;
  fetchConversations()
   .then(items => { if (live) { setConversations(items); setListError(""); } },
    () => { if (live) setListError("Unable to load conversations. Please try again."); })
   .finally(() => { if (live) setLoading(false); });
  return () => { live = false; };
 }, []);

 useEffect(() => {
  if (!selected) return;
  let live = true;
  fetch(`/api/messages/${selected}`, { cache: "no-store" })
   .then(async response => {
    if (!response.ok) throw new Error("Unable to load conversation.");
    return response.json() as Promise<{ messages: MessageEntry[] }>;
   })
   .then(result => { if (live) { setEntries(result.messages); setThreadError(""); setThreadLoading(false); } },
    error => { if (live) { setThreadError(error instanceof Error ? error.message : "Unable to load conversation."); setThreadLoading(false); } });
  return () => { live = false; };
 }, [selected]);

 async function reloadThread(id: string) {
  const response = await fetch(`/api/messages/${id}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to refresh conversation.");
  const result = await response.json() as { messages: MessageEntry[] };
  setEntries(result.messages);
 }

 async function submitReply(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (!selected || !reply.trim() || replySending) return;
  setReplySending(true); setThreadError(""); setReplySuccess("");
  const id = selected;
  const key = replyKey.current ?? crypto.randomUUID();
  replyKey.current = key;
  try {
   const response = await fetch(`/api/messages/${id}/reply`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: reply.trim(), idempotencyKey: key }),
   });
   if (!response.ok) {
    const result = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(result.error || "Reply could not be sent.");
   }
   replyKey.current = null; setReply(""); setReplySuccess("Reply sent.");
   await reloadThread(id); await refresh();
  } catch (error) {
   setThreadError(error instanceof Error ? error.message : "Reply could not be sent.");
  } finally { setReplySending(false); }
 }

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
     <button type="button" className="font-bold text-blue underline text-left" aria-expanded={selected === item.id} onClick={() => { setSelected(item.id); setThreadLoading(true); setThreadError(""); setEntries([]); setReply(""); replyKey.current = null; setReplySuccess(""); }}>{item.title}</button>
     <p className="text-sm text-muted">{item.category} · {item.status} · {new Date(item.updated_at).toLocaleDateString("en-GB")}</p>
    </li>)}</ul>}
   {active && <div className="mt-5 rounded-xl border border-border p-4" aria-label="Conversation detail">
    <div className="flex items-center justify-between gap-3"><h3 className="font-bold">{active.title}</h3><button type="button" className="text-sm font-bold text-blue underline" onClick={() => { if (selected) { setThreadLoading(true); void reloadThread(selected).then(() => { setThreadError(""); }, () => { setThreadError("Unable to refresh conversation."); }).finally(() => setThreadLoading(false)); } }}>Refresh replies</button></div>
    {threadLoading ? <p role="status" className="mt-3 text-sm">Loading conversation…</p> : <div className="mt-3 space-y-3" aria-live="polite">{entries.length === 0 && !threadError ? <p className="text-sm text-muted">No messages yet.</p> : entries.map(entry => <article key={entry.id} className="rounded-lg bg-cream p-3"><p className="whitespace-pre-wrap break-words text-sm">{entry.body}</p><p className="mt-1 text-xs text-muted">{new Date(entry.created_at).toLocaleString("en-GB")}</p></article>)}</div>}
    {threadError && <p role="alert" className="mt-3 text-sm text-red-dark">{threadError}</p>}
    {replySuccess && <p role="status" className="mt-3 text-sm">{replySuccess}</p>}
    <form onSubmit={submitReply} className="mt-4 space-y-3"><label htmlFor="coach-reply" className="block text-sm font-bold">Reply to this conversation</label><textarea id="coach-reply" required maxLength={5000} rows={3} value={reply} onChange={e => { setReply(e.target.value); replyKey.current = null; setReplySuccess(""); }} className="w-full rounded-xl border border-border p-3" /><button type="submit" disabled={replySending} className="rounded-xl bg-blue px-5 py-3 font-bold text-white disabled:opacity-60">{replySending ? "Sending…" : "Send reply"}</button></form>
   </div>}
   <p className="mt-4 text-xs text-muted">Group chats are not available yet.</p>
  </section>
 </>;
}
