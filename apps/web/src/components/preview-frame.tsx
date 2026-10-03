import { cn } from "@/lib/cn";

/**
 * The card every component demo sits in. Deliberately plain — a demo is meant
 * to be the loudest thing on the page, so the frame around it stays quiet.
 */
export function PreviewFrame({
  label,
  description,
  className,
  bodyClassName,
  children,
}: {
  label: string;
  description?: string;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <figure
      className={cn(
        "group overflow-hidden rounded-card border border-line bg-ink-raised transition-colors hover:border-line-strong",
        className,
      )}
    >
      <div
        className={cn(
          // Grid rather than flex centering: a single grid area lets a demo
          // either centre itself or stretch edge to edge, which flex centring
          // would not allow without every demo opting into `self-stretch`.
          "relative grid min-h-[260px] place-items-center overflow-hidden [&>*]:col-start-1 [&>*]:row-start-1 [&>*]:h-full [&>*]:w-full",
          bodyClassName,
        )}
      >
        {children}
      </div>
      <figcaption className="border-t border-line px-4 py-3">
        <p className="font-display text-sm font-semibold">{label}</p>
        {description ? (
          <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
            {description}
          </p>
        ) : null}
      </figcaption>
    </figure>
  );
}
