"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeftRight, Award, BookOpen, CalendarDays, ClipboardCheck, GraduationCap, House, Inbox,
  LayoutDashboard, LogOut, Menu, MessageCircle, ShieldCheck, UserPlus, UserRound, Users, X,
  type LucideIcon,
} from "lucide-react";
import { isActive, type IconKey, type NavItem, type ShellNav } from "./nav";
import { useSheet } from "./useSheet";

const ICONS: Record<IconKey, LucideIcon> = {
  home: House, course: BookOpen, training: GraduationCap, certificate: Award, shifts: CalendarDays,
  messages: MessageCircle, management: LayoutDashboard, coaches: Users, inbox: Inbox,
  onboarding: UserPlus, grading: ClipboardCheck, compliance: ShieldCheck, switch: ArrowLeftRight,
  profile: UserRound,
};

// The console shell (Web Build Framework types/web-app/console-shell.md), Empowr skin: light
// sidebar like the Empowr Dashboard, Empowr blue as the accent, Nunito (brand kit exception).
// Phone (below md): 48px top strip with the page name, fixed bottom bar with up to 4 pages +
// Menu, the sidebar as a sheet from the bottom (mobile-layout.md). Reference build: Pecuvate
// Dashboard src/components/dashboard/Sidebar.tsx.
export function AppShell({
  nav, email, badges = {}, children,
}: {
  nav: ShellNav;
  email: string;
  badges?: Record<string, number>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { open, close, toggle, trigger } = useSheet();
  const [signingOut, setSigningOut] = useState(false);

  const all = [...nav.groups.flatMap((g) => g.items), ...(nav.account ? [nav.account] : [])];
  const current = all.find((i) => isActive(i, pathname))
    ?? nav.groups.flatMap((g) => g.items).filter((i) => pathname.startsWith(i.href)).sort((a, b) => b.href.length - a.href.length)[0];
  const tabs = nav.tabs.map((h) => all.find((i) => i.href === h)).filter((i): i is NavItem => !!i);

  async function signOut() {
    setSigningOut(true);
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const row = (item: NavItem, quiet = false) => {
    const Icon = ICONS[item.icon];
    const active = isActive(item, pathname);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => close("nav")}
        aria-current={active ? "page" : undefined}
        className={`group flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150 ${
          active
            ? "bg-blue-pale text-blue-dark shadow-[inset_3px_0_0_var(--color-blue)]"
            : quiet ? "text-ink/65 hover:bg-blue-pale/60 hover:text-ink" : "text-ink/75 hover:bg-blue-pale/60 hover:text-ink"
        }`}
      >
        <Icon size={16} className={`shrink-0 ${active ? "text-blue" : "text-ink/55 group-hover:text-ink/80"}`} />
        {item.label}
        {!!badges[item.href] && (
          <span className="ml-auto rounded-full bg-blue px-1.5 text-[11px] font-semibold leading-5 text-white" aria-label={`${badges[item.href]} new`}>
            {badges[item.href]}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden md:flex-row">
      {/* Phone top strip: mark + the page you are on. Navigation is the bottom bar. */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-12 items-center gap-2 border-b border-border bg-warm-white px-4 md:hidden">
        <Image src="/logo.png" alt="Empowr" width={24} height={24} className="h-6 w-6" />
        <p className="truncate text-sm font-bold tracking-tight text-ink">{current?.label ?? nav.product}</p>
      </header>
      {open && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => close()} aria-hidden />}

      <aside
        id="shell-menu"
        aria-label="Menu"
        className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col overflow-hidden overscroll-contain rounded-t-2xl bg-warm-white transition-transform md:static md:h-dvh md:max-h-none md:w-60 md:shrink-0 md:translate-y-0 md:rounded-none md:border-r md:border-border ${
          open ? "translate-y-0" : "invisible translate-y-full md:visible"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="h-1 shrink-0 bg-gradient-to-r from-blue to-red" aria-hidden />
        <div className="flex items-start justify-between border-b border-border px-5 py-5">
          <Link href={nav.home} onClick={() => close("nav")} className="flex items-center gap-3">
            <Image src="/logo.png" alt="Empowr" width={32} height={32} className="h-8 w-8" />
            <div>
              <p className="text-sm font-bold tracking-tight text-ink">{nav.product}</p>
              <p className="mt-0.5 text-xs text-ink/65">{nav.strapline}</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => close()}
            aria-label="Close menu"
            className="-mr-2 -mt-2 flex h-11 w-11 items-center justify-center rounded-lg text-ink/65 hover:bg-blue-pale md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav aria-label="Pages" className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {nav.groups.map((group) => (
            <div key={group.heading} className="mb-5">
              <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-ink/60">{group.heading}</p>
              <div className="space-y-0.5">{group.items.map((i) => row(i))}</div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border px-3 pb-5 pt-4">
          <p className="mb-2 truncate px-3 text-xs text-ink/65" title={email}>{email}</p>
          {nav.account && row(nav.account, true)}
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-ink/65 transition-colors hover:bg-blue-pale/60 hover:text-ink disabled:opacity-60"
          >
            <LogOut size={16} className="shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      <div
        data-shell-scroll
        className="flex-1 overflow-y-auto pt-12 pb-[calc(64px+env(safe-area-inset-bottom))] md:pt-0 md:pb-0"
      >
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-10 lg:px-8">{children}</div>
      </div>

      {/* Phone bottom bar: position fixed (a bar that is only the last block of the column moved on
          a real phone, mobile-layout.md trap). The scroll area above reserves its space. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-warm-white md:hidden"
        style={{ minHeight: 64, paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {tabs.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-1 text-xs font-bold ${active ? "text-blue-dark" : "text-ink/65"}`}
            >
              <span className="relative">
                <Icon size={22} className={active ? "text-blue" : ""} />
                {!!badges[item.href] && (
                  <span
                    className="absolute -right-2.5 -top-1.5 min-w-[18px] rounded-full bg-blue px-1 text-center text-[11px] font-semibold leading-[18px] text-white"
                    aria-label={`${badges[item.href]} new`}
                  >
                    {badges[item.href]}
                  </span>
                )}
              </span>
              {item.label}
            </Link>
          );
        })}
        <button
          ref={trigger}
          type="button"
          aria-expanded={open}
          aria-controls="shell-menu"
          onClick={toggle}
          className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-1 text-xs font-bold ${open ? "text-blue-dark" : "text-ink/65"}`}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
          Menu
        </button>
      </nav>
    </div>
  );
}
