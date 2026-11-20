import { NextResponse } from "next/server";
import { getCurrentCoach } from "@/lib/auth";
import { getDb } from "@/lib/supabase";
import { validateCoachContactProfile } from "@/lib/coach-profile";

export async function GET() {
  const coach = await getCurrentCoach();
  if (!coach) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await getDb().from("coach_contact_profiles")
    .select("phone, emergency_contact_name, emergency_contact_phone")
    .eq("coach_id", coach.id).maybeSingle();
  if (error) return NextResponse.json({ error: "Profile storage unavailable" }, { status: 503 });
  return NextResponse.json({ profile: data ? {
    phone: data.phone, emergencyContactName: data.emergency_contact_name,
    emergencyContactPhone: data.emergency_contact_phone,
  } : null });
}

export async function PUT(request: Request) {
  const coach = await getCurrentCoach();
  if (!coach) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let input: unknown;
  try { input = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const result = validateCoachContactProfile(input);
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });
  const { error } = await getDb().from("coach_contact_profiles").upsert({
    coach_id: coach.id,
    phone: result.value.phone,
    emergency_contact_name: result.value.emergencyContactName,
    emergency_contact_phone: result.value.emergencyContactPhone,
    updated_at: new Date().toISOString(),
  }, { onConflict: "coach_id" });
  if (error) return NextResponse.json({ error: "Could not save profile" }, { status: 503 });
  return NextResponse.json({ ok: true });
}
