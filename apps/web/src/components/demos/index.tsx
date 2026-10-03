"use client";

import { BrainScene } from "@craftly/registry/components/brain-scene";
import { GearLoader } from "@craftly/registry/components/gear-loader";
import { LiquidFillLoader } from "@craftly/registry/components/liquid-fill-loader";
import { ScrambleText } from "@craftly/registry/components/scramble-text";
import { StrokeWriter } from "@craftly/registry/components/stroke-writer";

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
