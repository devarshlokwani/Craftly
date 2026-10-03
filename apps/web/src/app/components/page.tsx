import type { Metadata } from "next";

import { CursorField } from "@/components/cursor-field";
import { Gallery, GalleryHeading } from "@/components/gallery";
import { PageFrame } from "@/components/page-frame";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { Container } from "@/components/site-shell";
import { COMPONENT_ITEMS, FEATURED } from "@/lib/components-data";

export const metadata: Metadata = {
  title: "Components",
  description:
    "Every animated React component in Craftly, grouped by category and running live.",
};

export default function ComponentsPage() {
  // Featured items appear twice on purpose — once up top, once in their own
  // category — so the categories stay complete when read on their own.
  return (
    <>
      <PageFrame />
      <CursorField />
      <SiteNav />

      <main className="relative">
        <Container className="py-14">
          <GalleryHeading
            eyebrow="The library"
            title="Crafted"
            accent="components."
            description="Each one was built for a shipped product first and generalised second. Every card below is the component itself, running."
          />
          <Gallery items={COMPONENT_ITEMS} featured={FEATURED} />
        </Container>
      </main>

      <SiteFooter />
    </>
  );
}
