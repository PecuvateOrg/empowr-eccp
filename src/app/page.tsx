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

      {/* Headline, paragraph and CTA labels are the designer's coach-pathway
          mock-up hero, verbatim. The kicker is NOT: the mock-up expands ECCP as
          "Empowr Coach & Champion Pathway", but "Empowr Certified Coaching
          Programme" is the confirmed name (owner decision 2026-09-16) and is
          what the welcome email and the project docs use. The
          mock-up sets this over a navy-to-blue gradient with white text, where
          its coral accent (#ff6570) clears contrast easily. On this light cream
          background that same coral measures 2.67:1 — under the 3:1 floor for
          large text — so the accent uses red-dark (3.86:1) until the hero
          itself goes dark. */}
      <section className="flex max-w-4xl flex-col items-center py-20 sm:py-28">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue">
          Empowr Certified Coaching Programme
        </p>
        <h1 className="mt-5 text-5xl font-black leading-[1.04] tracking-tight text-ink sm:text-7xl">
          Grow into the coach you want to{" "}
          <span className="text-red-dark">become.</span>
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
          Learn the Empowr way, develop your confidence and progress through a
          supported pathway&mdash;from volunteering as a Champion to becoming an
          approved Empowr Coach.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-blue px-6 py-3 font-extrabold text-white shadow-[0_4px_16px_rgb(74_112_194_/_0.26)] hover:bg-blue-dark"
            href="#roles"
          >
            Explore the roles
            <ArrowRight aria-hidden="true" className="size-5" />
          </Link>
          {/* The mock-up puts "Coach login" in the header nav rather than the
              hero, alongside a "View the checklist" primary. There is no
              checklist section to link to yet, so login takes the second slot
              rather than leaving a dead anchor. */}
          <Link
            className="inline-flex items-center gap-2 rounded-full border-2 border-blue px-6 py-3 font-extrabold text-blue-dark hover:bg-blue-pale"
            href="/login"
          >
            Coach login
          </Link>
        </div>
      </section>

      <section aria-labelledby="pathway-heading" className="w-full scroll-mt-8 pb-16" id="roles">
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
