import Link from "next/link";

import { ComponentDemo } from "@/components/component-demo";
import type { ComponentMeta } from "@/lib/components-data";
import { cn } from "@/lib/cn";

/**
 * The card a component is shown in, on both the landing page and the index.
 *
 * The demo gets a fixed-height stage of its own and the metadata sits under a
 * hairline, so cards of different content still line up as a grid. The gradient
 * ring only appears on hover — on every card at once it would compete with the
 * demos, which are the thing worth looking at.
 */
export function ComponentCard({
  component,
  className,
  stageClassName,
}: {
  component: ComponentMeta;
  className?: string;
  stageClassName?: string;
}) {
  return (
    <article
      className={cn(
        "gradient-ring group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-bg-raised transition-all duration-300",
        // The ring is always faintly there and lifts on hover, rather than
        // appearing from nothing — a border that pops in reads as a glitch.
        "before:opacity-30 before:transition-opacity before:duration-300 hover:before:opacity-100",
        "hover:shadow-[0_18px_50px_-24px_var(--glow)]",
        className,
      )}
    >
      <div
        className={cn(
          "stage-glow relative flex h-[200px] flex-1 items-center justify-center overflow-hidden border-b border-line",
          stageClassName,
        )}
      >
        {component.href ? (
          /* A block owns the viewport, so the card shows a still and sends you
             to the real thing rather than pretending to run it in 200px. */
          <Link
            href={component.href}
            className="group/preview flex h-full w-full flex-col items-center justify-center gap-2"
          >
            <span className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase">
              full-screen block
            </span>
            <span className="text-[12.5px] font-semibold text-accent transition-transform group-hover/preview:translate-x-0.5">
              View the block →
            </span>
          </Link>
        ) : (
          <ComponentDemo slug={component.slug} />
        )}
      </div>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-[13.5px] font-semibold">
            {component.name}
          </h3>
          <DependencyBadge dependencies={component.dependencies} />
        </div>
        <p className="mt-1.5 text-[12px] leading-relaxed text-fg-muted">
          {component.description}
        </p>
        <p className="mt-2.5 font-mono text-[10px] text-fg-subtle">
          {component.origin}
        </p>
      </div>
    </article>
  );
}

/**
 * Says up front what a component will drag into the consumer's bundle. "Zero
 * deps" is a real selling point for the ones that have none, and the rest
 * should be honest about what they need.
 */
function DependencyBadge({ dependencies }: { dependencies: string[] }) {
  const zero = dependencies.length === 0;
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-1.5 py-0.5 font-mono text-[9.5px]",
        zero
          ? "border-accent-2/40 text-accent-2"
          : "border-line-strong text-fg-subtle",
      )}
    >
      {zero ? "zero deps" : dependencies.join(" · ")}
    </span>
  );
}
