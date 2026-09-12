export interface CertificationLevel {
  level: number;
  name: string;
  description: string;
}

export const certificationLevels: readonly CertificationLevel[] = [
  {
    level: 1,
    name: "Foundation",
    description:
      "Core Empowr principles, programme knowledge, and facilitation basics.",
  },
  {
    level: 2,
    name: "Practitioner",
    description:
      "Deeper facilitation skills, session planning, and member wellbeing.",
  },
  {
    level: 3,
    name: "Advanced Coach",
    description:
      "Programme design, community leadership, and coaching other facilitators.",
  },
];
