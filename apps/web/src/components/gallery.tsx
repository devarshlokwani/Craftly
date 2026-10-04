import { ComponentCard } from "@/components/component-card";
import type { ComponentMeta } from "@/lib/components-data";
import { byCollection, COLLECTIONS } from "@/lib/components-data";

/**
 * The page heading used by both galleries.
 *
 * The accent half of the title carries the shared gradient rather than a flat
 * colour, which is what ties these headings to the buttons and card rings.
 */
export function GalleryHeading({
  eyebrow,
  title,
  accent,
  description,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
}) {
  return (
    <header>
      <p className="font-mono text-[10px] tracking-[0.26em] text-fg-subtle uppercase">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-display text-[clamp(1.9rem,3.6vw,2.6rem)] leading-[1.06] font-bold tracking-tight">
        {title} <span className="text-gradient">{accent}</span>
      </h1>
      <p className="mt-3 max-w-lg text-[13.5px] leading-relaxed text-fg-muted">
        {description}
      </p>
    </header>
  );
}

/** A labelled band of cards, with a rule running out to the right of the title. */
export function GallerySection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-[13.5px] font-semibold">{title}</h2>
        <span className="rounded-full border border-line px-1.5 py-0.5 font-mono text-[9.5px] text-fg-subtle">
          {count}
        </span>
        <div className="rail-x h-px flex-1" />
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/**
 * Featured runs two-up with taller stages so the strongest effects get room;
 * everything after is a three-column grid grouped by category.
 */
export function Gallery({
  items,
  featured,
}: {
  items: ComponentMeta[];
  featured?: ComponentMeta[];
}) {
  const groups = byCollection(items);

  return (
    <>
      {featured && featured.length > 0 ? (
        <GallerySection title="Featured" count={featured.length}>
          <div className="grid gap-4 md:grid-cols-2">
            {featured.map((item) => (
              <ComponentCard
                key={item.slug}
                component={item}
                stageClassName="min-h-[260px]"
              />
            ))}
          </div>
        </GallerySection>
      ) : null}

      {groups.map(([collection, list]) => (
        <GallerySection
          key={collection}
          title={COLLECTIONS[collection]}
          count={list.length}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((item) => (
              <ComponentCard key={item.slug} component={item} />
            ))}
          </div>
        </GallerySection>
      ))}
    </>
  );
}
