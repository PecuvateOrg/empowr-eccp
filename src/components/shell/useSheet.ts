"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Phone Menu sheet (mobile-layout.md rule 7), as in the Pecuvate Dashboard reference: while open
// the page behind cannot scroll, and Back, Escape, a tap outside or Close all shut it. Back works
// because opening adds one history entry; closing any other way takes it off again.
export function useSheet() {
  const [open, setOpen] = useState(false);
  const pushed = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);

  const show = useCallback(() => {
    window.history.pushState({ ...window.history.state, sheet: true }, "");
    pushed.current = true;
    setOpen(true);
  }, []);

  // close("nav"): a link inside was tapped; the navigation replaces our entry, so don't go back.
  const close = useCallback((how?: "nav") => {
    if (pushed.current && how !== "nav") window.history.back();
    else setOpen(false);
    pushed.current = false;
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPop = () => { pushed.current = false; setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { close(); trigger.current?.focus(); } };
    // The shell scrolls inside its own area, the document only on some phone browsers: lock both.
    const area = document.querySelector<HTMLElement>("[data-shell-scroll]");
    const before = [document.body.style.overflow, area?.style.overflow ?? ""];
    document.body.style.overflow = "hidden";
    if (area) area.style.overflow = "hidden";
    window.addEventListener("popstate", onPop);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = before[0];
      if (area) area.style.overflow = before[1];
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return { open, show, close, toggle: () => (open ? close() : show()), trigger };
}
