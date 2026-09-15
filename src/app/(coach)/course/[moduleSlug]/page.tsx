import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentCoach } from "@/lib/auth";
import { courseModuleBySlug, courseModules } from "@/lib/safeguarding-course";
import { getProgress } from "@/lib/progress";
import { ModuleFooter } from "./ModuleFooter";
import { ScenarioPicker } from "./ScenarioPicker";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ moduleSlug: string }>;
}): Promise<Metadata> {
  const courseModule = courseModuleBySlug.get((await params).moduleSlug);
  return {
    title: courseModule
      ? `${courseModule.title} — Empowr ECCP`
      : "Module — Empowr ECCP",
    robots: { index: false, follow: false },
  };
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ moduleSlug: string }>;
}) {
  const { moduleSlug } = await params;
  const courseModule = courseModuleBySlug.get(moduleSlug);
  if (!courseModule) notFound();

  const coach = (await getCurrentCoach())!;
  const progress = await getProgress(coach.id);
  const existing = progress.get(courseModule.slug);
  const next = courseModules.find((m) => m.order === courseModule.order + 1);

  return (
    <main className="py-10">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-blue hover:text-blue-dark"
        href="/course"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        All modules
      </Link>

      <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-red-dark">
        {courseModule.label} · {courseModule.order} of {courseModules.length}
      </p>
      <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-ink sm:text-4xl">
        {courseModule.title}
      </h1>
      <p className="mt-3 text-lg leading-8 text-muted">{courseModule.eyebrow}</p>

      {courseModule.kind === "content" ? (
        <>
          {courseModule.image ? (
            <figure className="mt-8">
              <Image
                alt={courseModule.imageAlt ?? ""}
                className="w-full rounded-2xl object-cover"
                height={520}
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                src={courseModule.image}
                width={960}
              />
              {courseModule.imageCaption ? (
                <figcaption className="mt-2 text-sm text-muted">
                  {courseModule.imageCaption}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          {/* Authored safeguarding content, compiled into the bundle from the
              handover pack. Never user input, which is what makes this safe. */}
          <div
            className="course-body mt-8"
            dangerouslySetInnerHTML={{ __html: courseModule.body }}
          />

          {courseModule.callout ? (
            <aside
              className="course-body mt-8 rounded-2xl border-l-4 border-blue bg-blue-pale p-6"
              dangerouslySetInnerHTML={{ __html: courseModule.callout }}
            />
          ) : null}
        </>
      ) : null}

      {courseModule.kind === "scenario" ? (
        <div className="mt-8 space-y-6">
          {courseModule.scenarios.map((scenario, index) => (
            <ScenarioPicker key={index} scenario={scenario} />
          ))}
        </div>
      ) : null}

      <ModuleFooter
        initialReflection={existing?.reflectionText ?? ""}
        isComplete={Boolean(existing?.completedAt)}
        moduleSlug={courseModule.slug}
        nextHref={next ? `/course/${next.slug}` : "/course"}
        nextLabel={next ? "Save and continue" : "Save and finish"}
        placeholder={courseModule.kind === "reflection" ? courseModule.placeholder : null}
        prompt={courseModule.kind === "reflection" ? courseModule.prompt : null}
      />
    </main>
  );
}
