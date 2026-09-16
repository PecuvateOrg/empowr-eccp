import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { CertificationCard } from "@/components/CertificationCard";
import { certificationLevels } from "@/lib/programme";

// The mock-up alternates its role-card fills by nth-child: 1 and 4 solid blue,
// 2 and 3 near-black.
const DARK_CARD_INDEXES = new Set([1, 2]);

export default function HomePage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center">
      <header className="flex w-full max-w-6xl items-center justify-center gap-3 px-5 pt-10 font-black text-blue sm:px-8">
        <BadgeCheck aria-hidden="true" className="size-7" />
        <span>Empowr ECCP</span>
      </header>

      {/* Hero ported from the designer's coach-pathway mock-up: cream ground,
          centred text, blue accent word, paired pill CTAs, and the photo with
          its "first step" badge. Two deliberate differences, both recorded:
          the kicker keeps "Empowr Certified Coaching Programme" (the mock-up's
          "Coach & Champion Pathway" was rejected), and the headline is not
          bolded — the mock-up sets it at 700. */}
      <section className="flex w-full max-w-6xl flex-col items-center px-5 py-20 text-center sm:px-8 sm:py-[80px]">
        <p className="text-[0.78rem] font-black uppercase tracking-[0.23em] text-blue-dark">
          Empowr Certified Coaching Programme
        </p>
        <h1 className="mt-[18px] mb-6 max-w-[700px] text-5xl leading-[1.04] tracking-[-0.055em] text-ink sm:text-[4.8rem]">
          Grow into the coach you want to{" "}
          <span className="text-blue">become.</span>
        </h1>
        <p className="max-w-[610px] text-[1.1rem] leading-[1.6] text-muted">
          Learn the Empowr way, develop your confidence and progress through a
          supported pathway&mdash;from volunteering as a Champion to becoming an
          approved Empowr Coach.
        </p>

        {/* The mock-up's primary CTA is "View the checklist", pointing at a
            checklist section that does not exist here yet. Rather than ship a
            dead anchor, the pair is the two destinations that are real. */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-[13px]">
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-blue px-[22px] py-[13px] font-extrabold text-white hover:bg-blue-dark"
            href="#roles"
          >
            Explore the roles
            <ArrowRight aria-hidden="true" className="size-5" />
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-blue-light bg-card px-[22px] py-[13px] font-extrabold text-blue-dark hover:bg-blue-pale"
            href="/login"
          >
            Coach login
          </Link>
        </div>

        <div className="relative mt-14 w-full max-w-[900px]">
          <Image
            alt="An Empowr coach supporting young skaters during a session in a sports hall"
            className="h-auto w-full rounded-[27px] object-cover"
            height={800}
            priority
            sizes="(max-width: 900px) 100vw, 900px"
            src="/home/coach-pathway-hero.jpg"
            width={1200}
          />
          {/* The mock-up floats this over the photo's bottom-left. At phone width the
              badge is nearly as wide as the photo, so overlapping turns it into a
              white band that hides the image's rounded corners — below the photo
              until sm:, floating from there. */}
          <div className="mx-auto mt-4 w-fit max-w-full rounded-[18px] bg-card px-5 py-4 text-center shadow-[0_20px_55px_rgb(7_27_53_/_0.13)] sm:absolute sm:bottom-7 sm:left-6 sm:mt-0 sm:text-left">
            <p className="text-[0.72rem] font-black uppercase tracking-[0.1em] text-blue">
              Your first step
            </p>
            <p className="font-extrabold text-ink">
              Become an Empowr Champion or Junior Champion
            </p>
          </div>
        </div>
      </section>

      {/* The mock-up gives this section a white ground to lift it off the cream. */}
      <section
        aria-labelledby="pathway-heading"
        className="w-full scroll-mt-8 bg-card py-20 sm:py-[80px]"
        id="roles"
      >
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <div className="mx-auto max-w-[730px] text-center">
            <p className="text-[0.78rem] font-black uppercase tracking-[0.13em] text-blue">
              Choose your pathway
            </p>
            <h2
              className="mt-2 mb-4 text-3xl font-bold leading-[1.05] tracking-[-0.04em] text-ink sm:text-[3.2rem]"
              id="pathway-heading"
            >
              Four levels of responsibility
            </h2>
            <p className="text-[1.05rem] leading-[1.6] text-muted">
              Each role has clear boundaries. Moving to the next level requires
              further development and formal approval.
            </p>
          </div>

          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {certificationLevels.map((certification, index) => (
              <CertificationCard
                certification={certification}
                key={certification.level}
                tone={DARK_CARD_INDEXES.has(index) ? "dark" : "blue"}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
