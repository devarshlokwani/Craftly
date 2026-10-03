import type { Metadata } from "next";
import Link from "next/link";

import { CursorField } from "@/components/cursor-field";
import { Gallery, GalleryHeading } from "@/components/gallery";
import { PageFrame } from "@/components/page-frame";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { Container } from "@/components/site-shell";
import { BLOCK_ITEMS } from "@/lib/components-data";

export const metadata: Metadata = {
  title: "Blocks",
  description:
    "Whole composed sections you drop in and fill with copy, built from Craftly components.",
};

export default function BlocksPage() {
  return (
    <>
      <PageFrame />
      <CursorField />
      <SiteNav />

      <main className="relative">
        <Container className="py-14">
          <GalleryHeading
            eyebrow="Composed"
            title="Ready-made"
            accent="blocks."
            description="A block owns its own layout and usually several components. Components slot into your page; blocks are the page."
          />

          {BLOCK_ITEMS.length === 0 ? (
            <div className="mt-12 rounded-card border border-dashed border-line-strong px-6 py-14 text-center">
              <p className="font-display text-[15px] font-semibold">
                Nothing here yet.
              </p>
              <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-fg-muted">
                Everything built so far does a single job, so it is filed as a
                component. Blocks land here as whole sections get extracted —
                hero, footer and pricing bands are next.
              </p>
              <Link
                href="/components"
                className="mt-6 inline-block rounded-lg border border-line bg-surface px-4 py-2 text-[13px] font-semibold transition-colors hover:border-line-strong hover:bg-surface-hover"
              >
                Browse components instead →
              </Link>
            </div>
          ) : (
            <Gallery items={BLOCK_ITEMS} />
          )}
        </Container>
      </main>

      <SiteFooter />
    </>
  );
}
