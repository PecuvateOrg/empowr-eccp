import type { CertificationLevel } from "@/lib/programme";

interface CertificationCardProps {
  certification: CertificationLevel;
}

export function CertificationCard({
  certification,
}: CertificationCardProps) {
  return (
    <article className="rounded-3xl border border-border bg-card p-6 text-center shadow-[0_12px_32px_rgb(27_27_27_/_0.08)]">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue">
        Level {certification.level}
      </p>
      <h2 className="mt-3 text-2xl font-black text-ink">
        {certification.name}
      </h2>
      <p className="mt-3 leading-7 text-muted">{certification.description}</p>
    </article>
  );
}
