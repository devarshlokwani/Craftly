"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

import { useReducedMotion } from "../../hooks/use-reduced-motion";
import {
  TransitionBadge,
  type TransitionBadgeHandle,
} from "./transition-badge";

export { TransitionBadge, type TransitionBadgeHandle };

const SKEW_DEG = 14;
/*
  The panel is oversized relative to the clipping wrapper (which is exactly
  viewport-sized) so the skewed corners still fully cover every edge at rest
  instead of leaving a gap: horizontal overscan needs to clear
  viewportHeight * tan(SKEW_DEG), which for a typical viewport is well under
  20% of its width.
*/
const PANEL_OVERSCAN = "20%";
const PANEL_WIDTH = "140%";

export interface WipeTransitionHandle {
  /**
   * Runs one full sweep. `onCovered` fires at the moment the viewport is
   * completely hidden — swap your route, scroll position or content there.
   *
   * Returns immediately if a sweep is already running, so a double click
   * cannot start two.
   */
  run: (onCovered: () => void) => void;
}

export interface WipeTransitionProps {
  /** Panel colour. */
  color?: string;
  /** Seconds for each half of the sweep. */
  duration?: number;
  /** Show the heptagon badge while the viewport is covered. */
  badge?: boolean;
}

/**
 * A skewed panel that sweeps across the viewport, hides a change behind itself,
 * and keeps going.
 *
 * It sweeps in from the right with its leading edge angled so the top-right
 * corner arrives first, covers the viewport completely, and then continues the
 * *same* direction off the left — rather than retracing back out the way it
 * came, which reads as a bounce. The diagonal edge is what keeps this reading
 * as a directional sweep instead of a blunt block wipe.
 *
 * Deliberately router-agnostic. The original was welded to react-router; here
 * you get an imperative handle and call it from whatever navigation you use:
 *
 *     const wipe = useRef<WipeTransitionHandle>(null);
 *     wipe.current?.run(() => router.push("/next"));
 *
 * Under reduced motion the sweep is skipped entirely and `onCovered` fires at
 * once, so navigation still happens — it just happens plainly.
 *
 * Needs `gsap`, loaded on demand.
 */
export const WipeTransition = forwardRef<
  WipeTransitionHandle,
  WipeTransitionProps
>(function WipeTransition(
  { color = "var(--craftly-wipe, #ff6a45)", duration = 0.5, badge = true },
  ref,
) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<TransitionBadgeHandle>(null);
  const busyRef = useRef(false);
  const reduced = useReducedMotion();

  useImperativeHandle(ref, () => ({
    run: (onCovered: () => void) => {
      const overlay = overlayRef.current;
      if (busyRef.current) return;
      if (!overlay || reduced) {
        onCovered();
        return;
      }

      busyRef.current = true;

      void import("gsap").then(({ gsap }) => {
        /*
          `opacity` (not a transform) hides the panel until this first `set`
          runs. `xPercent` must be the *only* thing that ever establishes its
          transform, since GSAP composes x/xPercent additively with whatever
          transform was already on the element rather than replacing it, and a
          pre-existing inline translateX would otherwise double up with this.
        */
        gsap.set(overlay, { opacity: 1, skewX: SKEW_DEG, xPercent: 100 });

        const tl = gsap.timeline({
          onComplete: () => {
            busyRef.current = false;
          },
        });

        tl.to(overlay, { xPercent: 0, duration, ease: "power3.inOut" });
        /*
          With power3.inOut the panel's leading edge crosses its own halfway
          point at exactly half the tween's duration. That is also where the
          diagonal edge clears the viewport's horizontal centre, so the badge's
          reveal is timed to that instant rather than a guessed fraction.
        */
        tl.call(() => badgeRef.current?.show(), [], duration * 0.5);
        tl.call(() => onCovered());
        // A beat before leaving, so the new content has time to paint.
        tl.addLabel("exit", "+=0.08");
        tl.to(
          overlay,
          { xPercent: -100, duration, ease: "power3.inOut" },
          "exit",
        );
        // Same halfway-point logic, mirrored: the trailing edge clears centre
        // at the midpoint of this tween too.
        tl.call(() => badgeRef.current?.hide(), [], `exit+=${duration * 0.5}`);
      });
    },
  }));

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[300] overflow-hidden"
      >
        <div
          ref={overlayRef}
          className="absolute inset-y-0"
          style={{
            left: `-${PANEL_OVERSCAN}`,
            width: PANEL_WIDTH,
            background: color,
            opacity: 0,
          }}
        />
      </div>
      {badge ? <TransitionBadge ref={badgeRef} /> : null}
    </>
  );
});
