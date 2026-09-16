import type { CertificationLevel } from "@/lib/programme";

interface CertificationCardProps {
  certification: CertificationLevel;
  /** Mirrors the mock-up's alternating role-card fills. */
  tone: "blue" | "dark";
}

// Solid colour-blocked cards, per the coach-pathway mock-up: fill, 22px radius,
// 25px padding, left-aligned white text, body copy at 78% opacity.
//
// The one deliberate change is the blue. The mock-up fills these with #4e79ca,
// where white body text lands at 3.27:1 — under the 4.5:1 AA floor for normal
// text, on copy that states supervision limits and age boundaries. Our existing
// blue-dark (#3558a8) is visually the same colour family and reaches 4.83:1
// with the same 78% opacity, so no token and no design intent is lost.
export function CertificationCard({
  certification,
  tone,
}: CertificationCardProps) {
  return (
    <article
      className={`flex min-h-[270px] flex-col rounded-[22px] p-[25px] text-left text-white ${
        tone === "blue" ? "bg-blue-dark" : "bg-ink"
      }`}
    >
      <p className="text-[0.74rem] font-black uppercase tracking-[0.1em] text-white/[0.78]">
        {certification.stage}
      </p>
      <h3 className="mt-2 mb-3 text-[1.38rem] font-bold leading-[1.6]">
        {certification.name}
      </h3>
      <p className="text-[0.94rem] leading-[1.6] text-white/[0.78]">
        {certification.description}
      </p>
      <ul className="mt-4 space-y-2 text-[0.9rem] leading-[1.5] text-white/[0.78]">
        {certification.boundaries.map((boundary) => (
          <li key={boundary} className="flex gap-2.5">
            <span
              aria-hidden="true"
              className="mt-2 size-1.5 shrink-0 rounded-full bg-white/60"
            />
            <span>{boundary}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
