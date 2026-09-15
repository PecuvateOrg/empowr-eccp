import { createClient } from "@supabase/supabase-js";

// Every ECCP table lives in the `eccp` schema, which grants USAGE to
// service_role only — anon and authenticated cannot reach it at all. There is
// no Supabase Auth session here, so access control is the session-cookie check
// in each route handler, not RLS keyed to auth.uid().
export function getDb() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false }, db: { schema: "eccp" } },
  );
}
