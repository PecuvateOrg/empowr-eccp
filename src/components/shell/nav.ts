// Navigation for the console shell (Web Build Framework types/web-app/console-shell.md +
// mobile-layout.md). Built on the server, where the role and feature switches are known, and
// handed to the client shell as plain data: icons travel as keys, not components.

export type IconKey =
  | "home" | "course" | "training" | "certificate" | "shifts" | "messages" | "management"
  | "coaches" | "inbox" | "onboarding" | "grading" | "compliance" | "switch" | "profile";

export type NavItem = { label: string; href: string; icon: IconKey; exact?: boolean };
export type NavGroup = { heading: string; items: NavItem[] };
export type ShellNav = {
  product: string;
  strapline: string;
  home: string;
  groups: NavGroup[];
  tabs: string[]; // phone bottom bar: up to 4 hrefs, Menu is always added last
  account?: NavItem; // foot block link (coach profile)
};

export const MAX_TABS = 4;

type Flags = { shifts: boolean; messaging: boolean; management: boolean };

export function coachNav({ shifts, messaging, management }: Flags): ShellNav {
  const work: NavItem[] = [
    ...(shifts ? [{ label: "My Shifts", href: "/my-shifts", icon: "shifts" as const }] : []),
    ...(messaging ? [{ label: "Messages", href: "/messages", icon: "messages" as const }] : []),
  ];
  const groups: NavGroup[] = [
    {
      heading: "My coaching",
      items: [
        { label: "Home", href: "/dashboard", icon: "home", exact: true },
        { label: "Course", href: "/course", icon: "course" },
        { label: "Training", href: "/training", icon: "training" },
        { label: "Certificate", href: "/certificate", icon: "certificate" },
      ],
    },
    ...(work.length ? [{ heading: "My work", items: work }] : []),
    ...(management
      ? [{ heading: "Staff", items: [{ label: "Management", href: "/management", icon: "management" as const }] }]
      : []),
  ];
  return {
    product: "ECCP",
    strapline: "Coach portal",
    home: "/dashboard",
    groups,
    tabs: ["/dashboard", "/course", ...work.map((i) => i.href), "/certificate"].slice(0, MAX_TABS),
    account: { label: "Profile", href: "/profile", icon: "profile" },
  };
}

export function staffNav({ shifts, messaging }: Omit<Flags, "management">): ShellNav {
  const manage: NavItem[] = [
    { label: "Coaches", href: "/management", icon: "coaches", exact: true },
    ...(shifts ? [{ label: "Staffing", href: "/management/staffing", icon: "shifts" as const }] : []),
    ...(messaging ? [{ label: "Staff inbox", href: "/management/messages", icon: "inbox" as const }] : []),
  ];
  return {
    product: "ECCP Management",
    strapline: "Staff dashboard",
    home: "/management",
    groups: [
      { heading: "Management", items: manage },
      {
        heading: "Previews",
        items: [
          { label: "Onboarding", href: "/management/onboarding-preview", icon: "onboarding" },
          { label: "Grading", href: "/management/grading-preview", icon: "grading" },
          { label: "Compliance", href: "/management/compliance-preview", icon: "compliance" },
        ],
      },
      { heading: "Switch", items: [{ label: "Coach view", href: "/dashboard", icon: "switch" }] },
    ],
    tabs: [...manage.map((i) => i.href), "/dashboard"].slice(0, MAX_TABS),
  };
}

export function isActive(item: NavItem, path: string): boolean {
  return item.exact ? path === item.href : path === item.href || path.startsWith(item.href + "/");
}
