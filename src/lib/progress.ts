import { getDb } from "./supabase";
import { courseModules } from "./safeguarding-course";

export interface ModuleProgress {
  readonly moduleId: string;
  readonly completedAt: string | null;
  readonly reflectionText: string | null;
}

export async function getProgress(coachId: string): Promise<Map<string, ModuleProgress>> {
  const { data, error } = await getDb()
    .from("course_progress")
    .select("module_id, completed_at, reflection_text")
    .eq("coach_id", coachId);

  if (error) throw new Error(`progress lookup failed: ${error.message}`);

  return new Map(
    (data ?? []).map((row) => [
      row.module_id,
      {
        moduleId: row.module_id,
        completedAt: row.completed_at,
        reflectionText: row.reflection_text,
      },
    ]),
  );
}

// `undefined` means "the caller said nothing about the reflection" and leaves any
// stored text alone; `null` means "clear it". Collapsing the two would let a
// request that merely re-marks a module complete wipe a coach's written
// safeguarding reflection, with nothing to show it had ever been there.
export async function markComplete(
  coachId: string,
  moduleId: string,
  reflectionText?: string | null,
): Promise<void> {
  const row: Record<string, unknown> = {
    coach_id: coachId,
    module_id: moduleId,
    completed_at: new Date().toISOString(),
  };
  if (reflectionText !== undefined) row.reflection_text = reflectionText;

  const { error } = await getDb()
    .from("course_progress")
    .upsert(row, { onConflict: "coach_id,module_id" });

  if (error) throw new Error(`progress save failed: ${error.message}`);
}

// The assessment is gated on finishing every module, so this is the gate's
// source of truth rather than a display value — it counts against the module
// list in code, not against whatever happens to be in the table.
export function isCourseComplete(progress: Map<string, ModuleProgress>): boolean {
  return courseModules.every((m) => progress.get(m.slug)?.completedAt);
}

export function completedCount(progress: Map<string, ModuleProgress>): number {
  return courseModules.filter((m) => progress.get(m.slug)?.completedAt).length;
}
