"use client";

import { useEffect, useRef } from "react";

import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";
import { gearPath, type GearGeometry } from "./gear-geometry";

/**
 * Two meshing gears, sized so their pitch circles touch and their teeth
 * interleave rather than pass through each other.
 *
 * The ratio is deliberately 12:8. Equal counts let the pair drift into lockstep,
 * where both gears show the same tooth at the same angle and the whole thing
 * reads as one rigid shape being spun.
 */
const DRIVER: GearGeometry = { teeth: 12, rTip: 40, rRoot: 31, rBore: 12 };
const IDLER: GearGeometry = { teeth: 8, rTip: 28, rRoot: 21, rBore: 9 };

const DRIVER_PATH = gearPath(DRIVER);
const IDLER_PATH = gearPath(IDLER);

/** Centre distance: the two root radii, so each gear's tips reach into the
 *  other's root land. */
const SPAN = DRIVER.rRoot + IDLER.rRoot;

export interface GearLoaderProps {
  /** Accessible status text, read out while the wait lasts. */
  label?: string;
  /** Seconds per turn of the larger gear. The smaller follows at the ratio. */
  period?: number;
  /** Face colour. The body behind it is derived from this. */
  color?: string;
  className?: string;
}

/**
 * A waiting state built from two meshing gears rather than a borrowed spinner.
 *
 * Each gear is drawn twice — a darker body offset down-right behind an accent
 * face — which is what makes it read as a solid disc instead of a flat sticker.
 * The offset sits *outside* the rotating group, so the shading stays put while
 * the teeth turn, the way a lit solid keeps its highlight.
 *
 * Needs `gsap`, loaded through a dynamic import so it stays optional. Under
 * reduced motion the gears render static.
 */
export function GearLoader({
  label = "Loading",
  period = 3.2,
  color = "var(--color-accent, #7f6dff)",
  className,
}: GearLoaderProps) {
  const rootRef = useRef<SVGSVGElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    if (!root) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void import("gsap").then(({ gsap }) => {
      if (cancelled || !rootRef.current) return;

      const ctx = gsap.context(() => {
        // Meshed gears turn opposite ways, at speeds inverse to their tooth
        // counts. Anything else and the teeth visibly slide through each other.
        gsap.to(gsap.utils.toArray("[data-gear='driver']"), {
          rotation: 360,
          duration: period,
          ease: "none",
          repeat: -1,
          transformOrigin: "center",
        });
        gsap.to(gsap.utils.toArray("[data-gear='idler']"), {
          rotation: -360 * (DRIVER.teeth / IDLER.teeth),
          duration: period,
          ease: "none",
          repeat: -1,
          transformOrigin: "center",
        });
      }, root);

      cleanup = () => ctx.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [reduced, period]);

  const body = `color-mix(in srgb, ${color} 55%, #000)`;
  const bore = `color-mix(in srgb, ${color} 34%, #000)`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center gap-5", className)}
    >
      <svg
        ref={rootRef}
        aria-hidden="true"
        viewBox="-56 -44 152 112"
        className="h-24 w-32 overflow-visible"
      >
        <ExtrudedGear
          d={DRIVER_PATH}
          rBore={DRIVER.rBore}
          depth={[4, 6]}
          name="driver"
          face={color}
          body={body}
          bore={bore}
        />
        <ExtrudedGear
          d={IDLER_PATH}
          rBore={IDLER.rBore}
          depth={[3, 4]}
          cx={SPAN}
          cy={-14}
          name="idler"
          face={color}
          body={body}
          bore={bore}
        />
      </svg>
      {label ? (
        <p className="font-mono text-xs tracking-[0.3em] text-fg-subtle uppercase">
          {label}
        </p>
      ) : null}
    </div>
  );
}

function ExtrudedGear({
  d,
  rBore,
  depth,
  cx = 0,
  cy = 0,
  name,
  face,
  body,
  bore,
}: {
  d: string;
  rBore: number;
  depth: [number, number];
  cx?: number;
  cy?: number;
  name: string;
  face: string;
  body: string;
  bore: string;
}) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <g transform={`translate(${depth[0]} ${depth[1]})`}>
        <g data-gear={name}>
          <path d={d} fill={body} fillRule="evenodd" />
          {/* The bore wall, darkest where the hole runs deepest. */}
          <circle r={rBore} fill="none" stroke={bore} strokeWidth={5} />
        </g>
      </g>
      <g data-gear={name}>
        <path d={d} fill={face} fillRule="evenodd" />
      </g>
    </g>
  );
}
