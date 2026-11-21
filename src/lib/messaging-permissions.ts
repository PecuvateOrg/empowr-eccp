/** ECCP messaging authorization rules.
 * Call only with server-verified membership and persisted role data.
 * Do not infer safeguarding clearance from staff or super-admin status.
 */
export type MessageRole = "coach" | "staff" | "admin";
export type ConversationKind = "staff_inbox" | "group" | "safeguarding";
export type ConversationContext = {
 kind: ConversationKind;
 participantIds: readonly string[];
 designatedSafeguardingIds: readonly string[];
};
export function canReadConversation(actorId: string, role: MessageRole, context: ConversationContext): boolean {
 if (!actorId) return false;
 if (context.kind === "safeguarding") return context.designatedSafeguardingIds.includes(actorId);
 if (context.participantIds.includes(actorId)) return true;
 if (context.kind === "staff_inbox") return role === "staff" || role === "admin";
 return false;
}
export function canSendMessage(actorId: string, role: MessageRole, context: ConversationContext): boolean {
 return canReadConversation(actorId, role, context);
}
export function canManageConversation(role: MessageRole, kind: ConversationKind, designated: boolean): boolean {
 if (kind === "safeguarding") return designated;
 return role === "admin";
}
export function canWriteInternalNote(actorId: string, role: MessageRole, context: ConversationContext): boolean {
 if (context.kind === "group") return false;
 if (context.kind === "safeguarding") return context.designatedSafeguardingIds.includes(actorId);
 return (role === "staff" || role === "admin") && canReadConversation(actorId, role, context);
}
export function canReadInternalNote(actorId: string, role: MessageRole, context: ConversationContext): boolean {
 return canWriteInternalNote(actorId, role, context);
}
