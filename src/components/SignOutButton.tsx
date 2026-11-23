"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      className="font-bold text-muted hover:text-ink disabled:opacity-60"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/auth/signout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
      type="button"
    >
      Sign out
    </button>
  );
}
