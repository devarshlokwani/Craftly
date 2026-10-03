"use client";

import { useEffect, useRef } from "react";

import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";

export interface StrokeWriterProps {
  /**
   * The strokes to write, in order, as SVG path `d` strings. Each must be its
   * own path: `stroke-dasharray` restarts at every subpath, so several strokes
   * inside one `d` would all draw at once no matter the offset.
   */
  strokes: string[];
  viewBox: string;
  /**
   * Optional filled outlines of the same shapes, cross-faded in at the end. A
   * single pen width cannot both fill a thick stem and keep a counter open, so
   * for lettering the true shapes settle it once the pen has all but finished.
   */
  settleShapes?: string[];
  /** Pen width, in viewBox units. */
  penWidth?: number;
  color?: string;
  /** Seconds for the whole set of strokes. */
  duration?: number;
  /** Where the settle layer starts fading in, as a fraction of the draw. */
  settleAt?: number;
  /**
   * Replay whenever the element re-enters the viewport. Needs `gsap`'s
   * ScrollTrigger. With this off the animation runs once on mount and needs
   * no scroll plugin at all.
   */
  replayOnScroll?: boolean;
  /** Write it over and over, pausing `loopDelay` between passes. */
  loop?: boolean;
  /** Seconds the finished shape is held before a looping pass restarts. */
  loopDelay?: number;
  className?: string;
}

/**
 * Paths that write themselves, one stroke after another, like a hand.
 *
 * The strokes are advanced along a single shared progress value rather than
 * tweened individually: each one's share of the total length decides when it
 * starts and finishes, which is what makes the sequence read as one continuous
 * motion instead of a queue of separate animations.
 *
 * Needs `gsap`, loaded through a dynamic import. Under reduced motion the
 * finished shapes are shown immediately.
 */
export function StrokeWriter({
  strokes,
  viewBox,
  settleShapes,
  penWidth = 8,
  color = "currentColor",
  duration = 2.2,
  settleAt = 0.88,
  replayOnScroll = false,
  loop = false,
  loopDelay = 1.2,
  className,
}: StrokeWriterProps) {
  const rootRef = useRef<SVGSVGElement>(null);
  const reduced = useReducedMotion();

  // Keyed on content, not identity: callers pass the stroke array inline, which
  // is a fresh object every render and would otherwise restart the draw forever.
  const strokesKey = JSON.stringify(strokes);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const paths = Array.from(
      root.querySelectorAll<SVGPathElement>("[data-stroke]"),
    );
    const settle = root.querySelector<SVGGElement>("[data-settle]");
    if (paths.length === 0) return;

    const lengths = paths.map((p) => p.getTotalLength());
    const total = lengths.reduce((a, c) => a + c, 0);

    /** Puts the pen at `p` (0–1) through the whole set. */
    const place = (p: number) => {
      const reached = p * total;
      let start = 0;
      paths.forEach((path, i) => {
        const len = lengths[i] ?? 0;
        const local = Math.max(0, Math.min(1, (reached - start) / len));
        path.style.strokeDasharray = String(len);
        path.style.strokeDashoffset = String(len * (1 - local));
        start += len;
      });
    };

    if (reduced) {
      paths.forEach((p) => {
        p.style.strokeDasharray = "none";
        p.style.strokeDashoffset = "0";
      });
      if (settle) settle.style.opacity = "1";
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void import("gsap").then(async ({ gsap }) => {
      if (cancelled || !rootRef.current) return;

      const ctx = gsap.context(() => {
        const at = { p: 0 };
        place(0);

        const draw = gsap.timeline({
          paused: true,
          repeat: loop ? -1 : 0,
          repeatDelay: loop ? loopDelay : 0,
        });
        draw.to(at, {
          p: 1,
          duration,
          ease: "power1.inOut",
          onUpdate: () => place(at.p),
        });
        if (settle) {
          draw.set(settle, { opacity: 0 }, 0);
          draw.to(
            settle,
            { opacity: 1, duration: duration * (1 - settleAt), ease: "none" },
            duration * settleAt,
          );
        }

        if (!replayOnScroll) {
          draw.play();
          return;
        }

        void import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
          if (cancelled) return;
          gsap.registerPlugin(ScrollTrigger);
          // Wound all the way back on exit rather than paused, so the next
          // arrival starts from a blank line instead of resuming a half-written
          // one.
          const rewind = () => {
            draw.pause(0);
            place(0);
            if (settle) settle.style.opacity = "0";
          };
          ScrollTrigger.create({
            trigger: root,
            start: "top 85%",
            end: "bottom 15%",
            onEnter: () => draw.restart(),
            onEnterBack: () => draw.restart(),
            onLeave: rewind,
            onLeaveBack: rewind,
          });
        });
      }, root);

      cleanup = () => ctx.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
    // `strokes` is tracked by `strokesKey`, see above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    strokesKey,
    duration,
    settleAt,
    replayOnScroll,
    loop,
    loopDelay,
    reduced,
  ]);

  return (
    <svg
      ref={rootRef}
      viewBox={viewBox}
      className={cn("overflow-visible", className)}
      aria-hidden="true"
    >
      {strokes.map((d, i) => (
        <path
          // Strokes are a fixed ordered set with no identity of their own, so
          // the index is the only stable key available.
          key={i}
          data-stroke
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={penWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {settleShapes && settleShapes.length > 0 ? (
        <g data-settle style={{ opacity: 0 }}>
          {settleShapes.map((d, i) => (
            <path key={i} d={d} fill={color} />
          ))}
        </g>
      ) : null}
    </svg>
  );
}
