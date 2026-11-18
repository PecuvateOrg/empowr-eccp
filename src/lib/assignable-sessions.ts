/** The session catalogue must be sourced from Empowr's authoritative booking system.
 * Do not populate this with hardcoded weekly sessions or assignment records.
 */
export type AssignableSession = {
 id: string;
 title: string;
 date: string;
 start: string;
 end: string;
 venue: string;
};

/** Deliberately unavailable until Shaun verifies the source, credentials and ownership.
 * A missing integration must never appear as an empty list of real sessions.
 */
export async function listAssignableSessions(): Promise<AssignableSession[] | null> {
 return null;
}
