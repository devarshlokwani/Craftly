import Link from "next/link";

import { ComponentCard } from "@/components/component-card";
import { HeroScramble } from "@/components/demos";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { CursorField } from "@/components/cursor-field";
import { PageFrame } from "@/components/page-frame";
import { Container, SectionHeading } from "@/components/site-shell";
import { COMPONENT_ITEMS } from "@/lib/components-data";

export default function HomePage() {
  return (
    <>
      <PageFrame />
      <CursorField />
      <SiteNav />

      <main className="relative">
        <Hero />
        <Showcase />
        <Principles />
      </main>

      <SiteFooter />
    </>
  );
}

function Hero() {
  const [featured, ...rest] = COMPONENT_ITEMS;

  return (
    <section className="relative overflow-hidden">
      <Container className="pt-12 pb-14 lg:pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 py-0.5 pr-2.5 pl-0.5 text-[11.5px] text-fg-muted backdrop-blur transition-colors hover:border-line-strong hover:text-fg"
          >
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-fg">
              New
            </span>
            {COMPONENT_ITEMS.length} components are live
            <span aria-hidden="true">→</span>
          </Link>

          <h1 className="mt-6 font-display text-[clamp(1.9rem,4.2vw,3rem)] leading-[1.05] font-bold tracking-[-0.03em]">
            The effects behind
            <br />
            interfaces people
          </h1>

          {/* The headline finishes itself — the library demonstrating its own
              component rather than describing it. */}
          <div className="text-gradient flex justify-center font-display text-[clamp(1.9rem,4.2vw,3rem)] leading-[1.05] font-bold tracking-[-0.03em]">
            <HeroScramble />
          </div>

          <p className="mx-auto mt-5 max-w-md text-[13.5px] leading-relaxed text-fg-muted">
            Animated React components and visual effects, each one built from
            scratch for a real product. Install the source into your project and
            change anything you like.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/components"
              className="btn-accent rounded-lg px-4 py-2 text-[13px] font-semibold text-accent-fg shadow-[0_6px_20px_-8px_var(--glow)] transition-transform hover:-translate-y-px"
            >
              Browse components →
            </Link>
            <Link
              href="/docs"
              className="rounded-lg border border-line bg-surface px-4 py-2 text-[13px] font-semibold transition-colors hover:border-line-strong hover:bg-surface-hover"
            >
              Read the docs
            </Link>
          </div>

          <code className="mx-auto mt-5 block w-fit rounded-lg border border-line bg-surface px-3 py-1.5 font-mono text-[11.5px] text-fg-muted">
            npx shadcn@latest add @craftly/liquid-fill-loader
          </code>
        </div>

        {/* Featured demo runs wide, the rest sit beside it — a bento that leads
            the eye to one component instead of presenting four equal tiles. */}
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {featured ? (
            <ComponentCard
              component={featured}
              className="lg:col-span-2"
              stageClassName="h-[240px]"
            />
          ) : null}
          <div className="grid gap-4">
            {rest.slice(0, 1).map((component) => (
              <ComponentCard
                key={component.slug}
                component={component}
                stageClassName="h-[240px]"
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function Showcase() {
  return (
    <section className="relative py-16">
      <div aria-hidden="true" className="rail-x mx-auto h-px max-w-7xl" />
      <Container className="pt-16">
        <SectionHeading
          eyebrow="The library"
          title="Every component,"
          accent="running live."
          description="Rendered from the same source the install command gives you. No screenshots, no video."
          action={
            <Link
              href="/docs"
              className="text-[12.5px] font-medium text-fg-muted transition-colors hover:text-fg"
            >
              View all →
            </Link>
          }
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {COMPONENT_ITEMS.map((component) => (
            <ComponentCard key={component.slug} component={component} />
          ))}
        </div>
      </Container>
    </section>
  );
}

const PRINCIPLES = [
  {
    title: "Source, not a black box",
    body: "Every component lands in your repo as readable TypeScript. Change the easing, swap the colours, delete the half you don't need.",
  },
  {
    title: "Heavy deps stay optional",
    body: "GSAP and Three are peer dependencies loaded on demand. A component that needs neither adds nothing to your bundle.",
  },
  {
    title: "Motion you can turn off",
    body: "Every animation honours prefers-reduced-motion and degrades to a sensible static state, rather than freezing mid-way.",
  },
];

function Principles() {
  return (
    <section className="relative py-16">
      <div aria-hidden="true" className="rail-x mx-auto h-px max-w-7xl" />
      <Container className="pt-16">
        <SectionHeading
          eyebrow="How it is built"
          title="Opinionated where it"
          accent="matters."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PRINCIPLES.map((principle, i) => (
            <div
              key={principle.title}
              className="rounded-card border border-line bg-bg-raised p-5"
            >
              <span className="font-mono text-[10px] text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-[14px] font-semibold">
                {principle.title}
              </h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-fg-muted">
                {principle.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
