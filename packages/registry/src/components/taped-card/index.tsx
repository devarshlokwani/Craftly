"use client";

import { useId } from "react";

import { cn } from "../../lib/cn";

export interface TapedCardProps {
  children: React.ReactNode;
  /** Per-card tilt in degrees, so a set reads as hand-placed rather than laid out. */
  rotation?: number;
  /** Tilt of the tape itself, independent of the card's. */
  tapeRotation?: number;
  /** Paper colour. */
  paper?: string;
  /** Ink colour, inherited by whatever you put inside. */
  ink?: string;
  /** The two tones of the washi tape's diagonal weave, plus its edge. */
  tape?: { light: string; dark: string; edge: string };
  /** Hide the tape and render the paper on its own. */
  taped?: boolean;
  className?: string;
}

const DEFAULT_TAPE = { light: "#e4d9ba", dark: "#d3c69f", edge: "#b9ac86" };

/**
 * A strip of washi tape: a diagonal two-tone weave with a drawn edge.
 *
 * The weave is rotated inside pattern space rather than the rect being rotated,
 * so the threads keep their angle no matter how the strip is tilted.
 */
function WashiTape({
  tape,
  rotation,
}: {
  tape: NonNullable<TapedCardProps["tape"]>;
  rotation: number;
}) {
  // Pattern ids are document-global; two taped cards on one page would
  // otherwise fight over the same one.
  const patternId = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 96 34"
      aria-hidden="true"
      className="absolute top-0 left-1/2 z-10 h-8 w-24 drop-shadow-sm"
      style={{
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      }}
    >
      <defs>
        <pattern
          id={patternId}
          width="7"
          height="7"
          patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse"
        >
          <rect width="7" height="7" fill={tape.light} />
          <rect width="3.5" height="7" fill={tape.dark} />
        </pattern>
      </defs>
      <rect
        x="1"
        y="1"
        width="94"
        height="32"
        fill={`url(#${patternId})`}
        stroke={tape.edge}
        strokeWidth="0.75"
        opacity="0.92"
      />
    </svg>
  );
}

/**
 * A note taped to a board: cream paper, a slight tilt, and a strip of washi
 * tape straddling the top edge.
 *
 * Deliberately unopinionated about its contents — it supplies the paper, the
 * tape and the tilt, and whatever goes inside inherits the ink colour.
 *
 * The corner radius is nearly square (2px) on purpose. Paper is cut, not
 * rounded, and at a UI-typical 12px the whole thing stops reading as a note and
 * goes back to being a card.
 *
 * No animation, no dependencies.
 */
export function TapedCard({
  children,
  rotation = 0,
  tapeRotation = -3,
  paper = "#f4ecd8",
  ink = "#2b241c",
  tape = DEFAULT_TAPE,
  taped = true,
  className,
}: TapedCardProps) {
  return (
    <div
      className={cn("relative", className)}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {taped ? <WashiTape tape={tape} rotation={tapeRotation} /> : null}
      <div
        className="rounded-[2px] p-6 pt-8 shadow-2xl"
        style={{ background: paper, color: ink }}
      >
        {children}
      </div>
    </div>
  );
}
