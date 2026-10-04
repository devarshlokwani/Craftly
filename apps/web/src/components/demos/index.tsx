"use client";

import { useRef, useState } from "react";

import { BrainScene } from "@craftly/registry/components/brain-scene";
import { FannedDeck } from "@craftly/registry/components/fanned-deck";
import { FlightTrail } from "@craftly/registry/components/flight-trail";
import { GearLoader } from "@craftly/registry/components/gear-loader";
import { LiquidFillLoader } from "@craftly/registry/components/liquid-fill-loader";
import { PixelTrail } from "@craftly/registry/components/pixel-trail";
import { RecoilCursor } from "@craftly/registry/components/recoil-cursor";
import { ScrambleText } from "@craftly/registry/components/scramble-text";
import { SketchScenery } from "@craftly/registry/components/sketch-scenery";
import { StackedCarousel } from "@craftly/registry/components/stacked-carousel";
import { StrokeWriter } from "@craftly/registry/components/stroke-writer";
import { TapedCard } from "@craftly/registry/components/taped-card";
import {
  WipeTransition,
  type WipeTransitionHandle,
} from "@craftly/registry/components/wipe-transition";

/** The "F" letterform from Foundr, the mark this effect was first built for. */
const F_GLYPH = "M25 17 h18 v6 h-12 v7 h10 v6 h-10 v12 h-6 z";

/**
 * The loader repeats in place rather than being remounted on a key. Remounting
 * left a blank frame between passes — the mark visibly vanished for a beat —
 * because the old instance had already faded itself out before the new one
 * mounted.
 */
export function LiquidFillLoaderDemo() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#ECEAE3]">
      <LiquidFillLoader
        overlay={false}
        repeat
        glyphPath={F_GLYPH}
        label="Foundr"
        liquidColor="#2D4A3E"
        liquidDeepColor="#1F3329"
        surfaceColor="#FAFAF7"
      />
    </div>
  );
}

export function GearLoaderDemo() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <GearLoader label="Loading" />
    </div>
  );
}

/** Hoisted so the array identity is stable across renders. */
const CARD_WORDS = ["remember", "revisit", "rebuild"];
const HERO_WORDS = ["remember", "screenshot", "steal"];

export function ScrambleTextDemo() {
  return (
    <div className="flex h-full w-full items-center justify-center px-6">
      <ScrambleText
        words={CARD_WORDS}
        loop
        className="font-display text-2xl font-bold tracking-tight text-accent"
      />
    </div>
  );
}

/** The hero headline finishing itself, at display size. */
export function HeroScramble() {
  return <ScrambleText words={HERO_WORDS} loop />;
}

/**
 * A script "C" with a swash and an underline — three strokes, drawn in order,
 * which is enough to show the sequencing without shipping a traced typeface.
 */
const SWASH_STROKES = [
  "M232 44 C214 18 176 10 146 20 C96 36 70 86 84 120 C96 150 142 156 176 140 C196 130 208 112 212 96",
  "M212 96 C224 104 244 102 256 92",
  "M60 142 C120 162 210 160 262 146",
];

export function StrokeWriterDemo() {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <StrokeWriter
        strokes={SWASH_STROKES}
        viewBox="0 0 300 180"
        penWidth={7}
        color="var(--accent)"
        loop
        className="h-full w-full max-w-[210px]"
      />
    </div>
  );
}

export function BrainSceneDemo() {
  return (
    <div className="flex h-full w-full items-center justify-center p-2">
      <BrainScene
        size={360}
        className="max-h-full max-w-[230px]"
        fallback={
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase">
              loading 3d
            </span>
          </div>
        }
      />
    </div>
  );
}

export function BrainThreadsDemo() {
  return (
    <div className="flex h-full w-full items-center justify-center p-2">
      <BrainScene
        size={360}
        threads
        className="max-h-full max-w-[230px]"
        fallback={
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase">
              loading 3d
            </span>
          </div>
        }
      />
    </div>
  );
}

export function FlightTrailDemo() {
  return (
    <div className="flex h-full w-full items-center justify-center px-6">
      <FlightTrail className="h-20 w-[260px]" />
    </div>
  );
}

export function TapedCardDemo() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#d9d2c4] p-6">
      <TapedCard rotation={-1.5} className="w-[15rem] scale-[0.78]">
        <p className="font-mono text-[11px]" style={{ color: "#8a7c5e" }}>
          Feb 2026 — Jul 2026 · Sydney
        </p>
        <h3 className="mt-2 font-display text-[15px] font-semibold">
          Software Engineer
        </h3>
        <p
          className="mt-0.5 font-mono text-[11px]"
          style={{ color: "#b8622f" }}
        >
          Robotic Marketer
        </p>
        <p
          className="mt-2.5 text-[11.5px] leading-relaxed"
          style={{ color: "#4a4235" }}
        >
          Owned the Contacts module of a fully interconnected CRM, full-stack
          across a Django and PostgreSQL codebase.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["Django", "Python", "PostgreSQL"].map((tag) => (
            <span
              key={tag}
              className="rounded-full px-2 py-0.5 font-mono text-[9px]"
              style={{ border: "1px solid #c9bda2", color: "#5c5245" }}
            >
              {tag}
            </span>
          ))}
        </div>
      </TapedCard>
    </div>
  );
}

/** Five faces, enough to show the arc without crowding a card-sized stage. */
const DECK = [
  {
    id: "flashcard",
    kicker: "Self graded",
    title: "Flashcards",
    foot: "Recall",
  },
  {
    id: "mcq",
    kicker: "Four options",
    title: "Multiple choice",
    foot: "Recognition",
  },
  {
    id: "fill",
    kicker: "Typed answer",
    title: "Fill the blanks",
    foot: "Precision",
  },
  {
    id: "match",
    kicker: "Tap to pair",
    title: "Match pairs",
    foot: "Connections",
  },
  {
    id: "jargon",
    kicker: "From memory",
    title: "Jargon drill",
    foot: "Vocabulary",
  },
];

export function FannedDeckDemo() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <FannedDeck
        label="Card formats"
        // The card stage is 200px tall and the deck reserves card height + 5rem,
        // so anything over ~112px gets clipped at the bottom.
        cardWidth="80px"
        cardHeight="112px"
        openStep="48px"
        closedStep="8px"
        cards={DECK.map((card) => ({
          id: card.id,
          face: (
            <div className="flex h-full w-full flex-col justify-between rounded-xl border border-line bg-bg-raised p-3 shadow-lg">
              <p className="font-mono text-[7.5px] tracking-[0.18em] text-fg-subtle uppercase">
                {card.kicker}
              </p>
              <p className="font-display text-[11px] leading-tight font-semibold">
                {card.title}
              </p>
              <p className="font-mono text-[7.5px] tracking-[0.18em] text-accent uppercase">
                {card.foot}
              </p>
            </div>
          ),
        }))}
      />
    </div>
  );
}

export function SketchSceneryDemo() {
  return (
    <div
      className="h-full w-full overflow-hidden"
      style={{ background: "#f4ecd8" }}
    >
      <SketchScenery width={900} height={300} />
    </div>
  );
}

/**
 * The wipe covers the whole viewport by design, which is not something a card
 * can show. The demo runs it for real and reports what happened instead, so the
 * card stays honest about what you are installing.
 */
export function WipeTransitionDemo() {
  const wipe = useRef<WipeTransitionHandle>(null);
  const [state, setState] = useState<"idle" | "running" | "done">("idle");

  return (
    <div className="flex h-full w-full items-center justify-center">
      <WipeTransition ref={wipe} color="var(--accent)" />
      <button
        type="button"
        onClick={() => {
          setState("running");
          wipe.current?.run(() => setState("done"));
        }}
        className="rounded-lg border border-line bg-surface px-3.5 py-2 text-[12.5px] font-semibold transition-colors hover:border-line-strong hover:bg-surface-hover"
      >
        {state === "running"
          ? "sweeping…"
          : state === "done"
            ? "swap happened mid-sweep — run again"
            : "Run the wipe"}
      </button>
    </div>
  );
}

/** The six numbers Foundr's features section pages through. */
const METRICS = [
  {
    id: "burn",
    icon: "🔥",
    title: "Burn rate",
    body: "See exactly how fast you're spending, month over month.",
  },
  {
    id: "runway",
    icon: "🛬",
    title: "Runway",
    body: "How many months you have left at your current burn.",
  },
  {
    id: "mrr",
    icon: "📈",
    title: "MRR",
    body: "Recurring revenue, separated from the one-off payments.",
  },
  {
    id: "margin",
    icon: "✂️",
    title: "Margin",
    body: "What's actually left after the cost of delivering.",
  },
  {
    id: "cash",
    icon: "🏦",
    title: "Cash left",
    body: "The number in the bank, not the number on an invoice.",
  },
  {
    id: "spend",
    icon: "🧾",
    title: "Top spend",
    body: "Where the money went, biggest line first.",
  },
];

export function StackedCarouselDemo() {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={
        { "--card-w": "150px", "--card-h": "168px" } as React.CSSProperties
      }
    >
      <StackedCarousel
        label="Founder metrics"
        items={METRICS.map((m) => ({
          id: m.id,
          content: (
            <div className="flex h-full flex-col p-4">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[13px]"
                style={{ background: "var(--accent-soft)" }}
              >
                {m.icon}
              </span>
              <p className="mt-3 font-display text-[13px] font-semibold">
                {m.title}
              </p>
              <p className="mt-1.5 text-[10.5px] leading-relaxed text-fg-muted">
                {m.body}
              </p>
            </div>
          ),
        }))}
      />
    </div>
  );
}

/**
 * The trail and the cursor are both fixed to the viewport, so a card can only
 * show what they do — it cannot contain them. Each demo says so and the block
 * page runs them for real.
 */
export function PixelTrailDemo() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#1e2749]">
      {/* Contained: a demo tile must not hand the trail the whole page. */}
      <PixelTrail color="228, 217, 255" contained />
      <p className="px-6 text-center font-mono text-[10px] tracking-[0.2em] text-[#e4d9ff]/70 uppercase">
        move inside this tile
      </p>
    </div>
  );
}

export function RecoilCursorDemo() {
  return (
    <div
      data-hoverable
      className="absolute inset-0 flex cursor-none items-center justify-center bg-[#1e2749]"
    >
      <RecoilCursor contained />
      <p className="px-6 text-center font-mono text-[10px] tracking-[0.2em] text-[#e4d9ff]/70 uppercase">
        move here, then hover
      </p>
    </div>
  );
}
