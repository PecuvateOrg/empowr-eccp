-- ECCP routes use the service_role key, so every eccp table needs explicit
-- service_role grants (the original tables have them; tables added since did
-- not, so the server got 42501 permission denied). Client roles stay revoked.
grant select, insert, update, delete on
  eccp.coach_contact_profiles, eccp.coach_weekly_availability, eccp.coach_availability_exceptions,
  eccp.message_conversations, eccp.message_participants, eccp.message_safeguarding_access,
  eccp.message_entries, eccp.message_events, eccp.message_read_receipts
  to service_role;
grant select on eccp.coaching_grade_audit to service_role;
