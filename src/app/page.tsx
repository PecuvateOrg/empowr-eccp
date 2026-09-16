import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { CertificationCard } from "@/components/CertificationCard";
import { certificationLevels } from "@/lib/programme";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center px-5 py-10 text-center sm:px-8 lg:py-16">
      <header className="flex items-center justify-center gap-3 font-black text-blue">
        <BadgeCheck aria-hidden="true" className="size-7" />
        <span>Empowr ECCP</span>
      </header>

      <section className="flex max-w-4xl flex-col items-center py-20 sm:py-28">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue">
          Empowr Certified Coaching Programme
        </p>
        <h1 className="mt-5 text-5xl font-black leading-[1.04] tracking-tight text-ink sm:text-7xl">
          Grow from member to certified coach.
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
          Build the knowledge, facilitation skills, and community leadership to
          deliver inclusive Empowr experiences.
        </p>
        <Link
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-blue px-6 py-3 font-extrabold text-white shadow-[0_4px_16px_rgb(74_112_194_/_0.26)] hover:bg-blue-dark"
          href="/login"
        >
          Coach sign in
          <ArrowRight aria-hidden="true" className="size-5" />
        </Link>
      </section>

      <section aria-labelledby="pathway-heading" className="w-full pb-16">
        <h2
          className="text-3xl font-black tracking-tight text-ink sm:text-4xl"
          id="pathway-heading"
        >
          Four levels of responsibility
        </h2>
        <p className="mx-auto mt-4 max-w-2xl leading-8 text-muted">
          Each role has clear boundaries. Moving to the next level requires
          further development and formal approval.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {certificationLevels.map((certification) => (
            <CertificationCard
              key={certification.level}
              certification={certification}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
