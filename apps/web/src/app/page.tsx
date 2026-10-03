import Link from "next/link";

import { LiquidFillLoaderDemo } from "@/components/demos/liquid-fill-loader-demo";
import { PreviewFrame } from "@/components/preview-frame";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export default function HomePage() {
  return (
    <>
      <SiteNav />

      <main>
        <Hero />
        <TasteOfTheLibrary />
      </main>

      <SiteFooter />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div
        aria-hidden="true"
        className="bg-dot-field pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 lg:grid-cols-[1fr_minmax(0,520px)] lg:py-32">
        <div>
          <Link
            href="/components"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 text-[12.5px] text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
          >
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-fg">
              New
            </span>
            The first components are live
            <span aria-hidden="true">→</span>
          </Link>

          <h1 className="mt-7 max-w-xl font-display text-5xl font-bold leading-[1.05] tracking-tight lg:text-6xl">
            The effects behind
            <br />
            interfaces people{" "}
            <span className="text-accent">remember</span>.
          </h1>

          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-fg-muted">
            Animated React components and visual effects, each one built from
            scratch for a real product. Install the source into your project and
            change anything you like.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/components"
              className="rounded-lg bg-accent px-5 py-2.5 text-[14px] font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
            >
              Browse components →
            </Link>
            <Link
              href="/docs"
              className="rounded-lg border border-line bg-surface px-5 py-2.5 text-[14px] font-semibold transition-colors hover:border-line-strong hover:bg-surface-hover"
            >
              Read the docs
            </Link>
          </div>

          <code className="mt-6 block w-fit rounded-lg border border-line bg-surface px-3.5 py-2 font-mono text-[12.5px] text-fg-muted">
            npx shadcn@latest add @craftly/liquid-fill-loader
          </code>
        </div>

        <PreviewFrame
          label="Liquid Fill Loader"
          description="Liquid rises to fill a logo mark, the mark settles upright, and droplets scatter off it."
          bodyClassName="min-h-[380px]"
        >
          <LiquidFillLoaderDemo />
        </PreviewFrame>
      </div>
    </section>
  );
}

function TasteOfTheLibrary() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl font-bold tracking-tight">
            A taste of <span className="text-accent">the library</span>.
          </h2>
          <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed text-fg-muted">
            Live components, rendered from the same source the install command
            gives you. No screenshots.
          </p>
        </div>
        <Link
          href="/components"
          className="text-[13.5px] font-medium text-fg-muted transition-colors hover:text-fg"
        >
          View all components →
        </Link>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <PreviewFrame
          label="Liquid Fill Loader"
          description="A one-shot intro loader that fills any SVG mark you hand it."
        >
          <LiquidFillLoaderDemo />
        </PreviewFrame>

        <PreviewFrame
          label="More, shortly"
          description="The skill globe, the 3D brain, the flight path and the signature draw are next in the queue."
        >
          <p className="px-8 text-center text-[13px] text-fg-subtle">
            Extraction in progress
          </p>
        </PreviewFrame>
      </div>
    </section>
  );
}
