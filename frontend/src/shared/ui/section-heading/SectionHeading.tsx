import type { TextAlign } from "../../types/common";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  copy?: string;
  align?: TextAlign;
}

export function SectionHeading({ eyebrow, title, copy, align = "center" }: SectionHeadingProps) {
  return (
    <div className={align === "left" ? "max-w-2xl" : "mx-auto max-w-3xl text-center"}>
      {eyebrow ? (
        <p className="mb-4 inline-flex rounded-full bg-rose-100/90 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.28em] text-brand-wine">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="section-title">{title}</h2>
      {copy ? <p className="section-copy mt-5">{copy}</p> : null}
    </div>
  );
}
