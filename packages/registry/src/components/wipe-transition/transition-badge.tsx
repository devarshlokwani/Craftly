"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export interface TransitionBadgeHandle {
  /**
   * Instant: a hard cut, not a fade, so it reads as the sweeping wall
   * uncovering something already there rather than a separately-timed fade-in
   * of its own. Also (re)starts the meter's empty-to-full fill.
   */
  show: () => void;
  hide: () => void;
}

export interface TransitionBadgeProps {
  /** The dark plate behind the hub. */
  plateColor?: string;
  /** The hub and its centre dot. */
  hubColor?: string;
  /** The thin meter ring that fills on each show(). */
  meterColor?: string;
}

const SPARK_COUNT = 16;

const METER_RADIUS = 25;
const METER_CIRCUMFERENCE = 2 * Math.PI * METER_RADIUS;
/**
 * How much of the ring shows at rest, before a fill starts — "just a little",
 * not empty, so the mark reads as a meter and not a blank ring.
 */
const METER_START_FRACTION = 0.08;
const METER_START_OFFSET = METER_CIRCUMFERENCE * (1 - METER_START_FRACTION);

const PLATE_POINTS =
  "0,-48 37.53,-29.93 46.81,10.68 20.83,43.25 -20.83,43.25 -46.81,10.68 -37.53,-29.93";
const HUB_RING_POINTS =
  "0,-17 13.29,-10.6 16.58,3.78 7.38,15.32 -7.38,15.32 -16.58,3.78 -13.29,-10.6";

/**
 * The heptagon badge shown centred in the viewport mid-transition. The wipe
 * owns exactly when it shows and hides relative to the sweeping wall.
 *
 * Three layers: the dark plate, a thin meter ring that fills from a sliver to a
 * full circle each time `show()` fires, and a hollow hub (the same seven-sided
 * shape as the plate, scaled down, with a punched-out centre and a dot).
 *
 * The sparks run continuously from mount rather than starting on `show()` —
 * cheap for something this small, and it means there is never a warm-up lag to
 * account for: whatever moment the wall reveals it, sparks are already
 * mid-flight, as though they had been going the whole time.
 */
export const TransitionBadge = forwardRef<
  TransitionBadgeHandle,
  TransitionBadgeProps
>(function TransitionBadge(
  {
    plateColor = "#101013",
    hubColor = "var(--craftly-transition-hub, #ff6a45)",
    meterColor = "#f4f3ef",
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const meterRef = useRef<SVGCircleElement>(null);
  const sparkRefs = useRef<(HTMLSpanElement | null)[]>([]);
  // gsap is an optional peer dependency, so it is fetched on mount and kept
  // here rather than imported at the top. Until it lands, show()/hide() still
  // work — the badge appears, its meter simply does not animate.
  const gsapRef = useRef<typeof import("gsap").gsap | null>(null);
  const meterTweenRef = useRef<{ kill: () => void } | null>(null);

  useImperativeHandle(ref, () => ({
    show: () => {
      if (rootRef.current) rootRef.current.style.visibility = "visible";
      const gsap = gsapRef.current;
      if (!gsap || !meterRef.current) return;
      meterTweenRef.current?.kill();
      // Every show() resets the ring to its starting sliver first, rather than
      // animating from wherever a previous (possibly interrupted) fill left
      // off: otherwise a fast back-to-back navigation could start the next fill
      // already half full.
      gsap.set(meterRef.current, { strokeDashoffset: METER_START_OFFSET });
      meterTweenRef.current = gsap.to(meterRef.current, {
        strokeDashoffset: 0,
        duration: 0.4,
        ease: "power2.out",
      });
    },
    hide: () => {
      if (rootRef.current) rootRef.current.style.visibility = "hidden";
    },
  }));

  useEffect(() => {
    let cancelled = false;
    let kill: (() => void) | undefined;

    void import("gsap").then(({ gsap }) => {
      if (cancelled) return;
      gsapRef.current = gsap;

      /*
        Sparks originate near the badge's right-hand arc — roughly facing the
        wall's incoming direction — and fly outward with a strong leftward bias
        plus a little fall, like debris thrown off something moving fast to the
        left: the same direction the wall itself exits in, so the burst reads as
        illustrating that motion.

        Both ends are absolute function-based values, not `+=` relative ones,
        re-rolled every cycle via repeatRefresh. A relative delta on a repeating
        tween keeps adding onto wherever the previous cycle ended rather than
        resetting, so it silently drifts thousands of pixels off-screen after a
        few loops.
      */
      const tweens = sparkRefs.current.map((el) => {
        if (!el) return null;
        return gsap.fromTo(
          el,
          {
            x: () => gsap.utils.random(0, 40),
            y: () => gsap.utils.random(-28, 28),
            rotate: () => gsap.utils.random(-20, 20),
            opacity: 1,
            scaleX: 0.5,
          },
          {
            // scaleX grows rather than shrinks: a streak that is stretching as
            // it flies reads as accelerating, not as a dot shrinking away.
            x: () => gsap.utils.random(-95, -50),
            y: () => gsap.utils.random(-10, 48),
            opacity: 0,
            scaleX: () => gsap.utils.random(1.6, 2.2),
            duration: () => gsap.utils.random(0.24, 0.42),
            ease: "power1.out",
            repeat: -1,
            repeatRefresh: true,
            delay: () => gsap.utils.random(0, 0.5),
          },
        );
      });
      kill = () => tweens.forEach((t) => t?.kill());
    });

    return () => {
      cancelled = true;
      kill?.();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      style={{ visibility: "hidden" }}
      className="pointer-events-none fixed inset-0 z-[301] flex items-center justify-center"
    >
      <div className="relative h-20 w-20 md:h-28 md:w-28">
        {Array.from({ length: SPARK_COUNT }).map((_, i) => (
          <span
            key={i}
            ref={(el) => {
              sparkRefs.current[i] = el;
            }}
            className="absolute top-1/2 left-1/2 h-[3.5px] w-8 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, #ffe2a8 40%, #fffdf5 75%, #ffffff)",
              boxShadow: "0 0 12px 2.5px rgba(255, 226, 168, 0.95)",
            }}
          />
        ))}
        <svg
          viewBox="-52 -52 104 104"
          className="h-full w-full drop-shadow-[0_4px_16px_rgba(0,0,0,0.35)]"
        >
          <polygon points={PLATE_POINTS} fill={plateColor} />
          <circle
            ref={meterRef}
            r={METER_RADIUS}
            fill="none"
            stroke={meterColor}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={METER_CIRCUMFERENCE}
            strokeDashoffset={METER_START_OFFSET}
            transform="rotate(-90)"
            opacity={0.95}
          />
          <path
            fillRule="evenodd"
            fill={hubColor}
            d={`M ${HUB_RING_POINTS.split(" ").join(" L ")} Z M 9.5,0 A 9.5,9.5 0 1 0 -9.5,0 A 9.5,9.5 0 1 0 9.5,0 Z`}
          />
          <circle r="3.2" fill={hubColor} />
        </svg>
      </div>
    </div>
  );
});
