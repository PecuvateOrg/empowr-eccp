import type { CertificationLevel } from "@/lib/programme";

interface CertificationCardProps {
  certification: CertificationLevel;
}

export function CertificationCard({
  certification,
}: CertificationCardProps) {
  return (
    <article className="flex flex-col rounded-3xl border border-border bg-card p-6 text-center shadow-[0_12px_32px_rgb(27_27_27_/_0.08)]">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue">
        {certification.stage}
      </p>
      <h3 className="mt-3 text-xl font-black text-ink">{certification.name}</h3>
      <p className="mt-3 leading-7 text-muted">{certification.description}</p>
      {/* Left-aligned deliberately: these are the role's limits, and a centred
          list of boundaries is markedly harder to scan than a ragged-right one. */}
      <ul className="mt-5 space-y-2 border-t border-border pt-5 text-left text-sm text-muted sm:mt-auto">
        {certification.boundaries.map((boundary) => (
          <li key={boundary} className="flex gap-2.5">
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-light" />
            <span>{boundary}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
