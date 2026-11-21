"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function CoachReplyForm({ conversationId }: { conversationId: string }) {
 const router = useRouter();
 const [body, setBody] = useState("");
 const [sending, setSending] = useState(false);
 const [error, setError] = useState("");
 // Kept across a failed attempt so retrying the same text can't post it twice.
 const pendingKey = useRef<string | null>(null);

 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (sending || !body.trim()) return;
  setSending(true); setError("");
  const key = pendingKey.current ?? crypto.randomUUID();
  pendingKey.current = key;
  try {
   const response = await fetch(`/api/messages/${conversationId}/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: body.trim(), idempotencyKey: key }),
   });
   if (!response.ok) {
    const result = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(result.error || "Your reply could not be sent.");
   }
   pendingKey.current = null;
   setBody("");
   router.refresh();
  } catch (e) {
   setError(e instanceof Error ? e.message : "Your reply could not be sent.");
  } finally { setSending(false); }
 }

 return <form onSubmit={submit} className="mt-6 rounded-2xl border border-border bg-card p-5">
  <label htmlFor="reply-body" className="block text-sm font-bold">Reply to the staff team</label>
  <textarea id="reply-body" required maxLength={5000} rows={4} value={body}
   onChange={e => { setBody(e.target.value); pendingKey.current = null; setError(""); }}
   className="mt-2 w-full rounded-xl border border-border p-3" placeholder="Write your reply" />
  {error && <p role="alert" className="mt-2 text-sm font-semibold text-red-dark">{error}</p>}
  <button type="submit" disabled={sending} className="mt-3 rounded-xl bg-blue px-5 py-3 font-bold text-white disabled:opacity-60">{sending ? "Sending…" : "Send reply"}</button>
 </form>;
}
