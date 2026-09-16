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
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-dark">
          Empowr Certified Coaching Programme
        </p>
        <h1 className="mt-5 text-5xl font-black leading-[1.04] tracking-tight text-ink sm:text-7xl">
          Grow from member to certified coach.
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
          Build the knowledge, facilitation skills, and community leadership to
          deliver inclusive Empowr experiences.
        </p>
        <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-blue px-6 py-3 font-extrabold text-white shadow-[0_4px_16px_rgb(74_112_194_/_0.26)]">
          Programme platform in development
          <ArrowRight aria-hidden="true" className="size-5" />
        </p>
      </section>

      <section aria-labelledby="pathway-heading" className="w-full pb-16">
        <h2 id="pathway-heading" className="sr-only">
          Certification pathway
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
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
