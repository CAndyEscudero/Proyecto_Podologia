import clsx from "clsx";

export function Button({ className, variant = "primary", ...props }) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-extrabold transition",
        variant === "primary" &&
          "bg-gradient-to-r from-brand-rose to-[#c58d9b] text-white shadow-lg shadow-rose-300/40 hover:-translate-y-0.5",
        variant === "secondary" &&
          "border border-rose-200 bg-white text-brand-ink hover:border-brand-rose hover:text-brand-wine",
        className
      )}
      {...props}
    />
  );
}
