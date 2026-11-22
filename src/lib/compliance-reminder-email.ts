import { type ComplianceRequirement, isCalendarDate } from "./compliance-reminder-rules";

export type ComplianceEmailItem = { requirement: ComplianceRequirement; deadline: string };
const labels: Record<ComplianceRequirement, string> = {
  safeguarding: "Safeguarding", first_aid: "First aid", dbs: "DBS",
  training: "Training", qualification: "Qualifications",
};
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]!);

/** Pure email renderer; does not send or access coach records. Caller must
 * recheck each requirement and its deadline on the server before delivery. */
export function renderComplianceReminder(
  name: string, items: ComplianceEmailItem[], note: string,
): { subject: string; text: string; html: string } {
  if (!items.length || items.length > 5 || items.some(item => !labels[item.requirement] || !isCalendarDate(item.deadline)))
    throw new Error("Valid outstanding requirements and deadlines are required");
  if (note.length > 500) throw new Error("Message too long");
  const firstName = name.trim().split(/\s+/)[0] || "there";
  const lines = items.map(item => `- ${labels[item.requirement]}: complete by ${item.deadline}`);
  const text = [
    `Hi ${firstName},`, "",
    "Please complete the following ECCP requirements by their deadlines:",
    ...lines, ...(note.trim() ? ["", note.trim()] : []), "",
    "Sign in to ECCP to review your requirements: https://eccp.empowrcic.org/login",
    "", "Empowr CIC",
  ].join("\n");
  const html = [
    `<p>Hi ${escapeHtml(firstName)},</p>`,
    "<p>Please complete the following ECCP requirements by their deadlines:</p>",
    "<ul>", ...items.map(item => `<li>${labels[item.requirement]}: complete by ${item.deadline}</li>`), "</ul>",
    ...(note.trim() ? [`<p style="white-space:pre-wrap">${escapeHtml(note.trim())}</p>`] : []),
    '<p><a href="https://eccp.empowrcic.org/login">Sign in to ECCP</a> to review your requirements.</p>',
    "<p>Empowr CIC</p>",
  ].join("\n");
  return { subject: "Reminder: outstanding ECCP requirements", text, html };
}
