import "server-only";

// GENERATED from the Empowr safeguarding mock-up. Server-only by design: if this
// were imported from a client component the whole answer key would be readable
// in the browser bundle, and the assessment would be worthless. The import above
// makes that a build failure rather than a code-review question.
//
// Do NOT import this from a Netlify Function — "server-only" throws outside the
// Next.js build, which fails at runtime while the deploy still reports success.

export interface AnswerKeyEntry {
  readonly correctIndex: number;
  readonly explanation: string;
}

export const answerKey: readonly AnswerKeyEntry[] = [
  { correctIndex: 1, explanation: "It's the baseline standard every coach must meet before being deployed — not optional." },
  { correctIndex: 1, explanation: "A Junior Assistant Coach may count within the ratio once formally assigned, trained and competent, but must never work unsupervised under any circumstances." },
  { correctIndex: 1, explanation: "Coaching roles require an enhanced DBS check including the barred list check." },
  { correctIndex: 1, explanation: "Unusual, individualised attention or exceptions for one skater is a grooming warning sign in itself." },
  { correctIndex: 1, explanation: "Child-centred coaching keeps welfare and the skater's voice at the centre of every decision." },
  { correctIndex: 2, explanation: "1:1 coaching should be visible to others and recorded with a reason." },
  { correctIndex: 1, explanation: "Personal social media connections with skaters fall outside Empowr's official channels, regardless of age or parental permission." },
  { correctIndex: 1, explanation: "It covers anyone over 18 who may be less able to protect themselves due to disability, illness, age or circumstance." },
  { correctIndex: 2, explanation: "Never promise confidentiality — you need to be honest that you'll pass it on to get the skater help." },
  { correctIndex: 1, explanation: "Record promptly, in the skater's own words, with full context — don't rely on memory later." },
  { correctIndex: 2, explanation: "Report your observation to the Empowr DSL. You don't need proof, and it isn't your role to investigate or confront." },
  { correctIndex: 0, explanation: "Anyone raising a concern in good faith is protected, whatever the outcome of the concern." },
  { correctIndex: 1, explanation: "Every skater under 15 must wear full protective gear for the whole session, with no exceptions." },
  { correctIndex: 2, explanation: "Once a coach identifies a risk of harm, they must intervene rather than treating protective gear as the skater's concern alone." },
  { correctIndex: 1, explanation: "The designated first aider leads the on-site response. Keep the skater safe, alert the first aider and call 999 immediately when emergency help is required." },
  { correctIndex: 2, explanation: "Arriving independently does not give permission to leave independently. Follow the current register until an authorised update is verified." },
  { correctIndex: 2, explanation: "A searching coach is no longer part of the supervision ratio, and all skating pauses during a missing-child response." },
  { correctIndex: 2, explanation: "Empowr coaches are not trained or authorised to administer medication. Support must be agreed before the child is left at the session." },
  { correctIndex: 2, explanation: "Coaches manage immediate safety but are not authorised to investigate complaints or promise an outcome." },
  { correctIndex: 2, explanation: "Evacuation must not be delayed to change shoes or collect belongings. Coaches guide skaters carefully to the assembly point." },
  { correctIndex: 2, explanation: "The full course is renewed every three years, but additional training may be required sooner when guidance, procedures, responsibilities or practice needs change." },
  { correctIndex: 1, explanation: "In immediate danger, call 999 first, then inform the Empowr DSL as soon as it is safe." },
];
