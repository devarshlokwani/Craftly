import type { Metadata } from "next";
import Link from "next/link";

import { PixelPlaygroundDemo } from "@/components/demos/pixel-playground-demo";
import { SiteNav } from "@/components/site-nav";
import { Container } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Pixel Playground",
  description:
    "The pixel trail and recoil cursor wired together over a card grid.",
};

/**
 * Its own page, like the flight path: the trail and the cursor both take over
 * the viewport, so they need the whole screen to show what they do.
 */
export default function PixelPlaygroundBlockPage() {
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
            Pixel <span className="text-gradient">Playground.</span>
          </h1>
          <p className="mt-3 max-w-lg text-[13.5px] leading-relaxed text-fg-muted">
            Move the pointer to light the lattice. The cursor pulls closer the
            faster you go, and squares up into a label over a card.
          </p>
          <code className="mt-5 block w-fit rounded-lg border border-line bg-surface px-3 py-1.5 font-mono text-[11.5px] text-fg-muted">
            npx shadcn@latest add @craftly/pixel-playground
          </code>
        </Container>

        <PixelPlaygroundDemo />
      </main>
    </>
  );
}
