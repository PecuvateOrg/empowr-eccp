import { NextResponse } from "next/server";
import { getCurrentCoach } from "@/lib/auth";
import { courseModuleBySlug } from "@/lib/safeguarding-course";
import { markComplete } from "@/lib/progress";

const MAX_REFLECTION = 5000;

export async function POST(request: Request) {
  const coach = await getCurrentCoach();
  if (!coach) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const moduleSlug = typeof body.moduleSlug === "string" ? body.moduleSlug : "";

  // Validated against the module list in code, not merely inserted. Without
  // this the FK would reject an unknown slug anyway, but with a 500 rather than
  // a clear 400 — and a slug that exists in the table but not in the app would
  // otherwise record progress for a module nobody can open.
  if (!courseModuleBySlug.has(moduleSlug)) {
    return NextResponse.json({ error: "Unknown module" }, { status: 400 });
  }

  // Absent field -> leave any stored reflection untouched. Present but empty ->
  // the coach cleared it deliberately. Only the latter erases anything.
  let reflectionText: string | null | undefined;
  if (typeof body.reflectionText === "string") {
    const trimmed = body.reflectionText.trim();
    reflectionText = trimmed ? trimmed.slice(0, MAX_REFLECTION) : null;
  }

  try {
    await markComplete(coach.id, moduleSlug, reflectionText);
    return NextResponse.json({ success: true });
  } catch (cause) {
    console.error("[course/progress] failed", cause);
    return NextResponse.json(
      { error: "Could not save progress." },
      { status: 500 },
    );
  }
}
