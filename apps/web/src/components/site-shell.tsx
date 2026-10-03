import { cn } from "@/lib/cn";

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative z-10 mx-auto max-w-6xl px-6", className)}>
      {children}
    </div>
  );
}

/**
 * A section header with an eyebrow, used to introduce each band of the page.
 */
export function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="font-mono text-[10px] tracking-[0.26em] text-fg-subtle uppercase">
          {eyebrow}
        </p>
        <h2 className="mt-3 font-display text-[clamp(1.4rem,2.6vw,1.9rem)] leading-[1.15] font-bold tracking-tight">
          {title}
          {accent ? <span className="text-gradient"> {accent}</span> : null}
        </h2>
        {description ? (
          <p className="mt-2.5 max-w-md text-[13px] leading-relaxed text-fg-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
