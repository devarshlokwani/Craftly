"use client";

import { FlightPath } from "@craftly/registry/blocks/flight-path";
import { TapedCard } from "@craftly/registry/components/taped-card";

const STOPS = [
  {
    id: "robotic-marketer",
    period: "Feb 2026 — Jul 2026 · Sydney",
    role: "Software Engineer",
    company: "Robotic Marketer",
    body: "Owned the Contacts module of a fully interconnected CRM, full-stack across a Django and PostgreSQL codebase.",
    tags: ["Django", "Python", "PostgreSQL"],
  },
  {
    id: "foundr",
    period: "2025 — present · Remote",
    role: "Founder",
    company: "Foundr",
    body: "A finance tracker that shows solo founders their runway, burn and cash left, at a glance.",
    tags: ["Lit", "GSAP", "Express"],
  },
  {
    id: "memora",
    period: "2026 · Remote",
    role: "Founder",
    company: "Memora",
    body: "Turns course material into five card formats, so recognition and recall both get practised.",
    tags: ["Next.js", "Three", "Supabase"],
  },
];

/**
 * The block as it is meant to be used: the flight path supplying the journey,
 * taped cards riding the checkpoints.
 */
export function FlightPathDemo() {
  return (
    <FlightPath
      accent="#ff5a3c"
      heading={
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-mono text-[10px] tracking-[0.26em] text-fg-subtle uppercase">
            The block
          </p>
          <h2 className="mt-2 font-display text-[clamp(1.4rem,2.6vw,2rem)] font-bold tracking-tight">
            Scroll to fly the route.
          </h2>
        </div>
      }
      stops={STOPS.map((stop) => ({
        id: stop.id,
        content: (
          <TapedCard
            rotation={stop.id === "foundr" ? 2 : -2.5}
            className="w-[19rem] max-w-[78vw]"
          >
            <p className="font-mono text-[11px]" style={{ color: "#8a7c5e" }}>
              {stop.period}
            </p>
            <h3 className="mt-2 font-display text-[17px] font-semibold">
              {stop.role}
            </h3>
            <p
              className="mt-0.5 font-mono text-[12px]"
              style={{ color: "#b8622f" }}
            >
              {stop.company}
            </p>
            <p
              className="mt-2.5 text-[12.5px] leading-relaxed"
              style={{ color: "#4a4235" }}
            >
              {stop.body}
            </p>
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {stop.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-2 py-0.5 font-mono text-[9.5px]"
                  style={{ border: "1px solid #c9bda2", color: "#5c5245" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </TapedCard>
        ),
      }))}
    />
  );
}
