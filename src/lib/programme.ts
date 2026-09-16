export interface CertificationLevel {
  /** Ordering only. The cards show `stage`, not a level number. */
  level: number;
  /** The role-label badge above the name in the pathway mock-up. */
  stage: string;
  name: string;
  description: string;
  /** The role's boundaries. These are safeguarding limits, not features. */
  boundaries: readonly string[];
}

// Wording is taken verbatim from the designer's coach-pathway mock-up
// (workspace-docs/empowr-eccp/handover/Shaun-ECCP-Handover/
// ECCP-Coach-Pathway-Landing-Page-8.html, the "Four levels of responsibility"
// section). These describe who may supervise whom and at what age, so the text
// must not drift through paraphrase — change it only from an updated mock-up.
export const certificationLevels: readonly CertificationLevel[] = [
  {
    level: 1,
    stage: "Starting point",
    name: "Champion & Junior Champion",
    description:
      "Volunteers, observes and learns how Empowr sessions work. Junior Champions take part within age-appropriate boundaries and supervision.",
    boundaries: [
      "Does not coach independently",
      "Does not automatically count in ratios",
      "Works under the coaching team",
    ],
  },
  {
    level: 2,
    stage: "Ages 16–17",
    name: "Junior Assistant Coach",
    description:
      "Supports agreed coaching activities after training and approval.",
    boundaries: [
      "Never works unsupervised",
      "Direct adult supervision at all times",
      "Cannot cover an adult absence",
    ],
  },
  {
    level: 3,
    stage: "Aged 18+",
    name: "Assistant Coach",
    description:
      "Delivers assigned activities within the approved session plan.",
    boundaries: [
      "Maintains active supervision",
      "Works within training and experience",
      "Raises and responds to concerns",
    ],
  },
  {
    level: 4,
    stage: "Session lead",
    name: "Head Coach",
    description:
      "Holds overall responsibility for safe planning and delivery.",
    boundaries: [
      "Approves the session plan",
      "Manages staffing and ratios",
      "Leads safety decisions",
    ],
  },
];
