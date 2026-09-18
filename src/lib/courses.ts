// Registry of every course in the ECCP pathway. Safeguarding is the only one
// with real content today — its own module/answer data still lives in
// safeguarding-course.ts and safeguarding-answers.ts, ported verbatim from the
// handover mock-up. The other three are named by Empowr's programme design
// but have no authored content anywhere in this workspace yet; do not invent
// module text or assessment questions for them, especially First Aid, which
// is safety-critical and needs an accredited source, not general knowledge.
//
// `code` is the certificate-number prefix each course will use once it has
// content and reaches the assessment/certificate stage (ECCP-{code}-{year}-
// {seq}) — reserved now so the eventual migration has an agreed value to
// apply, not decided ad hoc when the first non-Safeguarding certificate ships.

export interface CourseSummary {
  readonly slug: string;
  readonly code: string;
  readonly title: string;
  readonly shortLabel: string;
  readonly status: "live" | "coming-soon";
  readonly description: string;
}

export const courses: readonly CourseSummary[] = [
  {
    slug: "safeguarding",
    code: "SG",
    title: "Empowr: Safeguarding for Roller Skating Coaches",
    shortLabel: "Safeguarding",
    status: "live",
    description:
      "Recognise, respond, record and report safeguarding concerns in Empowr sessions.",
  },
  {
    slug: "code-of-conduct",
    code: "COC",
    title: "Empowr Code of Conduct for Coaches",
    shortLabel: "Code of Conduct",
    status: "coming-soon",
    description:
      "Empowr's standards of behaviour and professionalism for coaching roles.",
  },
  {
    slug: "safe-session-delivery",
    code: "SSD",
    title: "Safe Session Delivery",
    shortLabel: "Safe Session Delivery",
    status: "coming-soon",
    description: "Planning, staffing and running an Empowr session safely.",
  },
  {
    slug: "head-coach-first-aid",
    code: "FA",
    title: "Head Coach First Aid",
    shortLabel: "First Aid",
    status: "coming-soon",
    description:
      "First aid responsibilities and procedures for Head Coaches.",
  },
];

export function getCourse(slug: string): CourseSummary | undefined {
  return courses.find((course) => course.slug === slug);
}
