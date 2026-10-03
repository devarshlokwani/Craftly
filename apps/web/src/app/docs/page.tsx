import type { Metadata } from "next";
import Link from "next/link";

import { CursorField } from "@/components/cursor-field";
import { GalleryHeading } from "@/components/gallery";
import { PageFrame } from "@/components/page-frame";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { Container } from "@/components/site-shell";
import {
  COLLECTION_ORDER,
  COLLECTIONS,
  COMPONENT_ITEMS,
} from "@/lib/components-data";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "How to install Craftly components, theme them, and what the project expects of every component.",
};

const STEPS = [
  {
    step: "01",
    title: "Install a component",
    body: "Every component is distributed as source through the shadcn registry. The command drops readable TypeScript into your project — not a dependency you have to fight.",
    code: "npx shadcn@latest add @craftly/liquid-fill-loader",
  },
  {
    step: "02",
    title: "Install its peers",
    body: "Each card lists exactly what it needs. Components that need nothing are badged zero deps, and GSAP and Three are only ever loaded on demand.",
    code: "pnpm add gsap",
  },
  {
    step: "03",
    title: "Theme it",
    body: "Colours come from CSS custom properties, so a component picks up your palette without edits. Pass explicit props to override one in place.",
    code: "--craftly-liquid: #2D4A3E;",
  },
];

export default function DocsPage() {
  return (
    <>
      <PageFrame />
      <CursorField />
      <SiteNav />

      <main className="relative">
        <Container className="py-14">
          <GalleryHeading
            eyebrow="Documentation"
            title="Getting"
            accent="started."
            description="Craftly ships source, not a black box. Three steps to go from an empty project to a component you can edit."
          />

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-card border border-line bg-bg-raised p-5"
              >
                <span className="font-mono text-[10px] text-accent">
                  {item.step}
                </span>
                <h2 className="mt-3 font-display text-[14px] font-semibold">
                  {item.title}
                </h2>
                <p className="mt-2 text-[12.5px] leading-relaxed text-fg-muted">
                  {item.body}
                </p>
                <code className="mt-4 block overflow-x-auto rounded-lg border border-line bg-surface px-2.5 py-1.5 font-mono text-[11px] whitespace-nowrap text-fg-muted">
                  {item.code}
                </code>
              </div>
            ))}
          </div>

          <section className="mt-16">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-[13.5px] font-semibold">
                Browse by category
              </h2>
              <div className="rail-x h-px flex-1" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {COLLECTION_ORDER.map((collection) => {
                const count = COMPONENT_ITEMS.filter(
                  (c) => c.collection === collection,
                ).length;
                if (count === 0) return null;
                return (
                  <Link
                    key={collection}
                    href="/components"
                    className="group flex items-center justify-between rounded-card border border-line bg-bg-raised px-4 py-3 transition-colors hover:border-line-strong hover:bg-surface-hover"
                  >
                    <span className="text-[13px] font-medium">
                      {COLLECTIONS[collection]}
                    </span>
                    <span className="font-mono text-[10px] text-fg-subtle transition-colors group-hover:text-accent">
                      {count} →
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="mt-16">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-[13.5px] font-semibold">
                What every component guarantees
              </h2>
              <div className="rail-x h-px flex-1" />
            </div>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                "Honours prefers-reduced-motion, degrading to a sensible static state rather than freezing.",
                'Safe to render on the server — no window access during render, marked "use client" where needed.',
                "Heavy dependencies are optional peers, imported on demand so they never reach a bundle that skips them.",
                "Props-driven and self-contained: no app state, no router, no global CSS beyond the tokens you set.",
              ].map((line) => (
                <li
                  key={line}
                  className="rounded-card border border-line bg-bg-raised p-4 text-[12.5px] leading-relaxed text-fg-muted"
                >
                  {line}
                </li>
              ))}
            </ul>
          </section>
        </Container>
      </main>

      <SiteFooter />
    </>
  );
}
