"use client";

import { useEffect, useId, useRef } from "react";

import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";

/**
 * The dot pattern for the route: a short dash under a round cap, which draws as
 * a dot with air after it.
 *
 * The dash has a real length rather than the hairline that would make each mark
 * perfectly circular. Blink drops a near-zero-length dash wherever the curve
 * turns tightest, so the crests of the wave come out bare while the straights
 * are fine.
 */
const DOTS = "1 8";

/**
 * Builds the route: a wave, flown left to right.
 *
 * Generated rather than written out because the numbers matter to each other —
 * every control point is a fraction of one half turn, so changing the crest or
 * the count keeps the curve smooth instead of needing eight coordinates retuned
 * by hand. Controls sit at roughly a third and two thirds of each half turn,
 * which leaves the tangent flat at every crest; that flat top is what makes it
 * read as a wave rather than a zigzag with rounded corners.
 */
function waveRoute(w: number, h: number, crest: number, turns: number) {
  const startX = 12;
  const endX = w - 14;
  const span = (endX - startX) / turns;
  const crestY = (i: number) => h / 2 + (i % 2 === 0 ? crest : -crest);

  let d = `M${startX},${crestY(0)}`;
  for (let i = 0; i < turns; i += 1) {
    const x = startX + span * i;
    d += ` C${x + span * 0.36},${crestY(i)} ${x + span * 0.64},${crestY(i + 1)} ${x + span},${crestY(i + 1)}`;
  }
  return d;
}

export interface FlightTrailProps {
  /** Width of the SVG's coordinate space. */
  width?: number;
  /** Height of the SVG's coordinate space. */
  height?: number;
  /** How far above and below the middle the route swings. */
  crest?: number;
  /** How many half turns of the wave fit across the width. */
  turns?: number;
  /** Your own route instead of the generated wave. Must run left to right. */
  path?: string;
  /** Seconds for one pass. Brisk by default: it is a cue, not a scene. */
  duration?: number;
  /** Ink colour for the route and the craft. */
  color?: string;
  /** Fill behind the craft, so the dotted trail does not show through it. */
  bodyColor?: string;
  /**
   * Replace the paper dart. Draw it nose-along +x centred on the origin and it
   * drops straight into the tangent rotation with no offset.
   */
  craft?: React.ReactNode;
  className?: string;
}

/**
 * A small craft that flies its route when you scroll past it, drawing the trail
 * in behind it.
 *
 * The path is walked with `getPointAtLength` rather than a motion-path plugin,
 * so it carries no extra dependency: the same call gives both the position and,
 * sampled a pixel either side, the heading to point along.
 *
 * The trail is the same path twice — one faint for the way still to go, one
 * bright clipped to how far the craft has flown. A dashed line cannot be
 * revealed with `stroke-dashoffset` the way a solid one can, because the dashes
 * are already spending the pattern, so the lit copy is clipped at the craft's
 * own x instead.
 *
 * Fired by scroll rather than scrubbed to it. Tying position to scroll position
 * means it crawls or jerks at whatever pace the page happens to be moving and
 * stops dead whenever the reader does; triggering a fixed flight reads the same
 * every time. Needs `gsap` and its ScrollTrigger, both loaded on demand.
 */
export function FlightTrail({
  width = 260,
  height = 64,
  crest = 15,
  turns = 3,
  path,
  duration = 1.15,
  color = "var(--color-fg, currentColor)",
  bodyColor = "var(--color-bg, #000)",
  craft,
  className,
}: FlightTrailProps) {
  const rootRef = useRef<SVGSVGElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const flownRef = useRef<SVGRectElement>(null);
  const craftRef = useRef<SVGGElement>(null);
  const reduced = useReducedMotion();
  const clipId = useId().replace(/:/g, "");

  const route = path ?? waveRoute(width, height, crest, turns);

  useEffect(() => {
    const line = routeRef.current;
    const flown = flownRef.current;
    const flyer = craftRef.current;
    if (!line || !flown || !flyer) return;

    const length = line.getTotalLength();

    /** Puts the craft at `t` along the route, nose along the tangent. */
    const place = (t: number) => {
      const at = length * t;
      const here = line.getPointAtLength(at);
      // Points either side give the heading. At the very ends there is nothing
      // beyond, so the sample clamps and the direction comes out the same.
      const ahead = line.getPointAtLength(Math.min(length, at + 1));
      const behind = line.getPointAtLength(Math.max(0, at - 1));
      const angle =
        (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
      flyer.setAttribute(
        "transform",
        `translate(${here.x} ${here.y}) rotate(${angle})`,
      );
      flown.setAttribute("width", String(Math.max(0, here.x)));
    };

    if (reduced) {
      place(1);
      return;
    }

    place(0);

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void import("gsap").then(async ({ gsap }) => {
      if (cancelled || !rootRef.current) return;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled || !rootRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        const progress = { t: 0 };
        const flight = gsap.timeline({ paused: true });
        flight.fromTo(
          progress,
          { t: 0 },
          {
            t: 1,
            duration,
            ease: "power2.inOut",
            onUpdate: () => place(progress.t),
          },
        );

        // Played and reversed rather than restarted and reset. The trigger
        // fires while the craft is still on screen, so snapping it back to the
        // start is a jump the reader watches happen; flying it back the way it
        // came reads as the same journey undone, and both pick up from wherever
        // it currently is.
        ScrollTrigger.create({
          trigger: rootRef.current,
          start: "top 82%",
          onEnter: () => flight.play(),
          onLeaveBack: () => flight.reverse(),
        });
      }, rootRef);

      cleanup = () => ctx.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [reduced, route, duration]);

  return (
    <svg
      ref={rootRef}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <rect ref={flownRef} x={0} y={0} width={0} height={height} />
        </clipPath>
      </defs>

      {/* Round dots with air between them: a route marked out the way a flight
          is drawn on a map, and the shape that survives being two pixels wide. */}
      <path
        d={route}
        fill="none"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeDasharray={DOTS}
        opacity={0.24}
        ref={routeRef}
      />
      <g clipPath={`url(#${clipId})`}>
        <path
          d={route}
          fill="none"
          stroke={color}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeDasharray={DOTS}
          opacity={0.85}
        />
      </g>

      <g ref={craftRef}>
        {craft ?? (
          /* A folded dart drawn as line art: the silhouette, the keel down the
             middle, and one crease across each wing, every line running back
             from the nose the way the folds in a real one do. Outlined rather
             than filled so it reads as paper. */
          <g
            fill="none"
            stroke={color}
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            <path
              d="M16,0 L-12,-10 L-5,0 L-12,10 Z"
              fill={bodyColor}
              strokeWidth={1.6}
            />
            <path d="M16,0 L-5,0" strokeWidth={1.1} opacity={0.9} />
            <path d="M16,0 L-10.2,-5.4" strokeWidth={0.9} opacity={0.55} />
            <path d="M16,0 L-10.2,5.4" strokeWidth={0.9} opacity={0.55} />
          </g>
        )}
      </g>
    </svg>
  );
}
