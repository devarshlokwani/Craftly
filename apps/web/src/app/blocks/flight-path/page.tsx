import type { Metadata } from "next";
import Link from "next/link";

import { FlightPathDemo } from "@/components/demos/flight-path-demo";
import { SiteNav } from "@/components/site-nav";
import { Container } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Flight Path",
  description:
    "A scroll-driven journey across a sheet of paper, built from the sketch scenery, flight trail and taped card.",
};

/**
 * The block gets a page of its own rather than a card.
 *
 * It pins the viewport and turns scroll into horizontal travel, so there is no
 * honest way to show it inside a 200px preview — and the page deliberately
 * carries no cursor field or page frame, because the block owns the whole
 * screen while it is pinned.
 */
export default function FlightPathBlockPage() {
  return (
    <>
      <SiteNav />

      <main>
        <Container className="py-10">
          <Link
            href="/blocks"
            className="font-mono text-[11px] text-fg-subtle transition-colors hover:text-fg"
          >
            ← Blocks
          </Link>
          <h1 className="mt-3 font-display text-[clamp(1.75rem,3.4vw,2.4rem)] leading-[1.08] font-bold tracking-tight">
            Flight <span className="text-gradient">Path.</span>
          </h1>
          <p className="mt-3 max-w-lg text-[13.5px] leading-relaxed text-fg-muted">
            Three components doing one job: the sketch scenery draws the land,
            the path inks itself in behind the plane, and a taped card rides
            each checkpoint. Keep scrolling.
          </p>
          <code className="mt-5 block w-fit rounded-lg border border-line bg-surface px-3 py-1.5 font-mono text-[11.5px] text-fg-muted">
            npx shadcn@latest add @craftly/flight-path
          </code>
        </Container>

        <FlightPathDemo />

        <Container className="py-20">
          <p className="text-[13px] text-fg-muted">
            That is the end of the route. The block releases the pin and the
            page carries on as normal.
          </p>
        </Container>
      </main>
    </>
  );
}
