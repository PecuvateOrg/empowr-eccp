import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { getCourse } from "@/lib/courses";
import { notFound } from "next/navigation";

export function ComingSoonCourse({ slug }: { slug: string }) {
  const course = getCourse(slug);
  if (!course || course.status !== "coming-soon") notFound();

  return (
    <main className="py-10">
      <Link
        className="inline-flex items-center gap-1.5 text-sm font-bold text-blue hover:text-blue-dark"
        href="/course"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to your courses
      </Link>

      <p className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-blue-pale px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-blue-dark">
        <Clock aria-hidden="true" className="size-3.5" />
        Coming soon
      </p>
      <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-ink sm:text-5xl">
        {course.title}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
        {course.description} This course isn&apos;t open yet — we&apos;ll let
        you know as soon as it is.
      </p>
    </main>
  );
}
