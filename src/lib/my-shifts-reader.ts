import "server-only";
import { getCurrentCoach } from "./auth";
import { getDb } from "./supabase";

// No caller-supplied coach ID. Service-role access must be scoped here.
export async function readMyShifts(){
 const coach=await getCurrentCoach();
 if(!coach) throw new Error("Not authenticated");
 if(process.env.ECCP_MY_SHIFTS_ENABLED!=="1") return {enabled:false as const};
 const {data,error}=await getDb().from("shift_assignments")
  .select("id,role,state,staffing_sessions!inner(id,title,starts_at,ends_at,venue,source_status,reconciliation_state)")
  .eq("coach_id",coach.id)
  .eq("state","confirmed")
  .order("starts_at",{referencedTable:"staffing_sessions",ascending:true})
  .limit(200);
 if(error || !data) throw new Error("Unable to retrieve shifts");
 return {enabled:true as const, shifts:data};
}
