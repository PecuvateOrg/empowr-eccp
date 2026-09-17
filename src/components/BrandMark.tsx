import Image from "next/image";
import Link from "next/link";

// logo.png is the Empowr eye lockup with the wordmark "Empowr" set in its own
// lower third (same 1080px-square artwork used by Members' SiteHeader), so
// the label here says only what the mark doesn't — otherwise it reads as
// "Empowr Empowr ECCP". `items-end` plus the nudge below lines the label up
// with the mark's own wordmark rather than the centre of the whole square.
export function BrandMark({ href, label }: { href?: string; label: string }) {
  const inner = (
    <>
      <Image
        alt="Empowr"
        className="h-auto w-[38px] shrink-0"
        height={140}
        src="/logo.png"
        width={140}
      />
      <span className="translate-y-[-4px] truncate">{label}</span>
    </>
  );

  const classes = "flex min-w-0 items-end gap-2 font-black text-blue";

  return href ? (
    <Link className={classes} href={href}>
      {inner}
    </Link>
  ) : (
    <div className={classes}>{inner}</div>
  );
}
