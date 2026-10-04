"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/cn";

/** How much of the remaining distance the light closes each frame. */
const FOLLOW = 0.045;

/** Grid pitch of the dot field, in px. Must match the backgroundSize below. */
const GRID = 22;

/**
 * How hard the light squashes when the pointer leaves the field.
 *
 * Each field traps its own light. When the pointer escapes one — out of the nav,
 * past a side rail — the light cannot follow, so it presses against that edge
 * and spreads along it, the way a soft body would.
 *
 * The range is deliberately shorter than the narrowest band it reacts to. The
 * side rails are 26px, so the pointer can only get about that far past the
 * frame before leaving the window — a longer range meant the sideways squash
 * never reached real strength, which is why it read as flat only at the top.
 */
const SQUASH_RANGE = 34;
const SQUASH_MAX = 0.62;

/** Thickness of the edge strokes, in px. */
const STROKE = 2;

/** Distance from an edge at which that edge's marker is fully lit. */
const EDGE_RANGE = 260;

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

export interface GlowFieldProps {
  /** Diameter of the lit pool, in px. Scale it to the band it lives in. */
  halo?: number;
  /** Length of the glowing segment that rides each edge. */
  edge?: number;
  /** Blur applied to the light. Smaller fields want less. */
  blur?: number;
  /** Draw the marker segments on the field's borders. */
  edges?: boolean;
  /**
   * CSS selector for an element whose top edge caps this field.
   *
   * The field is fixed to the viewport, but the footer scrolls up into it.
   * Without this the light would happily sit on top of the footer instead of
   * being stopped by it, so the lower bound has to be measured each frame
   * rather than baked into the element's box.
   */
  bottomBoundary?: string;
  className?: string;
}

/**
 * A dim dot grid, a light that trails the cursor, dots that brighten inside it,
 * and a marker on each border tracking where the cursor is.
 *
 * Positions itself absolutely inside its parent, so the parent decides the
 * bounds — which is what lets the nav, the page body and the footer each own an
 * independent field. The parent needs `position: relative` and
 * `overflow: hidden`.
 *
 * The lit dots are a second copy of the grid, masked to a radial falloff and
 * moved by transform, with `background-position` set to the inverse of that
 * transform. That inverse is the trick: without it the grid travels with the
 * element and the dots slide around instead of lighting up in place.
 *
 * Inert for coarse pointers and under reduced motion — there is no cursor to
 * follow on a touchscreen, and a large drifting light is the kind of motion
 * reduced-motion asks to be spared. The dim base grid stays either way.
 */
export function GlowField({
  halo = 520,
  edge = 220,
  blur = 70,
  edges = true,
  bottomBoundary,
  className,
}: GlowFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const edgeRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    const lit = haloRef.current;
    const glow = glowRef.current;
    if (!root || !lit || !glow) return;

    const fine = window.matchMedia("(pointer: fine)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || calm) return;

    const box0 = root.getBoundingClientRect();
    let x = box0.left + box0.width / 2;
    let y = box0.top + box0.height / 2;
    let targetX = x;
    let targetY = y;

    let frame = 0;
    let idle = 0;

    const draw = () => {
      x += (targetX - x) * FOLLOW;
      y += (targetY - y) * FOLLOW;

      const box = root.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) {
        frame = requestAnimationFrame(draw);
        return;
      }

      // The effective floor: the field's own bottom, or the top of whatever is
      // scrolling up into it, whichever is higher.
      let floor = box.bottom;
      if (bottomBoundary) {
        const stop = document.querySelector(bottomBoundary);
        if (stop) {
          const r = stop.getBoundingClientRect();
          if (r.top < floor) floor = Math.max(box.top, r.top);
        }
      }

      const cx = clamp(x, box.left, box.right);
      const cy = clamp(y, box.top, floor);

      // The overflow *vector*: how far outside the field the pointer is, and in
      // which direction. Treating it as a vector rather than two independent
      // axes is what makes corners work — at a corner the light flattens along
      // the diagonal rather than fighting two separate squashes.
      const ox =
        x < box.left ? x - box.left : x > box.right ? x - box.right : 0;
      const oy = y < box.top ? y - box.top : y > floor ? y - floor : 0;
      const over = Math.min(Math.hypot(ox, oy) / SQUASH_RANGE, 1);

      // Rotate so the x axis points along the overflow, compress that axis and
      // let the other spread, then rotate back. Volume is roughly conserved,
      // which reads as a soft body pressing on a surface.
      const angle = over > 0 ? (Math.atan2(oy, ox) * 180) / Math.PI : 0;
      const along = 1 - over * SQUASH_MAX;
      const across = 1 + over * SQUASH_MAX * 0.8;

      glow.style.transform =
        `translate3d(${Math.round(cx - box.left)}px, ${Math.round(cy - box.top)}px, 0)` +
        ` translate(-50%, -50%)` +
        ` rotate(${angle.toFixed(2)}deg) scale(${along.toFixed(3)}, ${across.toFixed(3)}) rotate(${(-angle).toFixed(2)}deg)`;

      // The dot halo is clamped but never scaled or rotated: either would pull
      // its grid out of alignment with the base layer underneath.
      const hx = Math.round(cx - box.left - halo / 2);
      const hy = Math.round(cy - box.top - halo / 2);
      lit.style.transform = `translate3d(${hx}px, ${hy}px, 0)`;
      lit.style.backgroundPosition = `${-hx}px ${-hy}px`;

      if (edges) {
        const localX = cx - box.left;
        const localY = cy - box.top;
        const near = [
          clamp(1 - (y - box.top) / EDGE_RANGE, 0, 1),
          clamp(1 - (floor - y) / EDGE_RANGE, 0, 1),
          clamp(1 - (x - box.left) / EDGE_RANGE, 0, 1),
          clamp(1 - (box.right - x) / EDGE_RANGE, 0, 1),
        ];
        const bx = Math.round(localX - edge / 2);
        const by = Math.round(localY - edge / 2);
        const offsets = [
          `translate3d(${bx}px, 0, 0)`,
          // The bottom marker rides the floor, which moves as the footer
          // scrolls in, so it is placed rather than pinned. It is lifted by its
          // own thickness because the floor is the top edge of an opaque
          // element painted above this field — sitting *on* the line would put
          // the stroke underneath the footer and hide it completely.
          `translate3d(${bx}px, ${Math.round(floor - box.top) - STROKE}px, 0)`,
          `translate3d(0, ${by}px, 0)`,
          `translate3d(0, ${by}px, 0)`,
        ];
        edgeRefs.current.forEach((el, i) => {
          if (!el) return;
          el.style.transform = offsets[i] ?? "";
          el.style.opacity = String(near[i] ?? 0);
        });
      }

      const settled =
        Math.abs(targetX - x) < 0.5 && Math.abs(targetY - y) < 0.5;
      if (settled && ++idle > 10) {
        frame = 0;
        return;
      }
      if (!settled) idle = 0;
      frame = requestAnimationFrame(draw);
    };

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      idle = 0;
      if (!frame) frame = requestAnimationFrame(draw);
    };

    /*
      The loop parks itself once the light has caught up, which is right while
      the page is still — but the floor is the footer's top edge, and that moves
      under a stationary cursor as soon as anyone scrolls. Without this the
      bottom marker stays where the footer used to be and drifts away from it.
      Waking the loop costs a handful of frames and nothing while idle.
    */
    const onRemeasure = () => {
      idle = 0;
      if (!frame) frame = requestAnimationFrame(draw);
    };

    lit.style.opacity = "1";
    glow.style.opacity = "1";
    frame = requestAnimationFrame(draw);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onRemeasure, { passive: true });
    window.addEventListener("resize", onRemeasure, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onRemeasure);
      window.removeEventListener("resize", onRemeasure);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [halo, edge, edges, bottomBoundary]);

  const edgeBars: { cls: string; style: React.CSSProperties }[] = [
    {
      cls: "top-0 left-0 h-[2px]",
      style: {
        width: edge,
        background:
          "linear-gradient(to right, transparent, var(--edge) 30%, var(--edge-hot) 50%, var(--edge) 70%, transparent)",
      },
    },
    {
      cls: "top-0 left-0 h-[2px]",
      style: {
        width: edge,
        background:
          "linear-gradient(to right, transparent, var(--edge) 30%, var(--edge-hot) 50%, var(--edge) 70%, transparent)",
      },
    },
    {
      cls: "top-0 left-0 w-[2px]",
      style: {
        height: edge,
        background:
          "linear-gradient(to bottom, transparent, var(--edge) 30%, var(--edge-hot) 50%, var(--edge) 70%, transparent)",
      },
    },
    {
      cls: "top-0 right-0 w-[2px]",
      style: {
        height: edge,
        background:
          "linear-gradient(to bottom, transparent, var(--edge) 30%, var(--edge-hot) 50%, var(--edge) 70%, transparent)",
      },
    },
  ];

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(var(--dot) 1px, transparent 1px)",
          backgroundSize: `${GRID}px ${GRID}px`,
        }}
      />

      <div
        ref={glowRef}
        className="absolute top-0 left-0 opacity-0 transition-opacity duration-700 will-change-transform"
        style={{
          height: halo,
          width: halo,
          background:
            "radial-gradient(circle, var(--glow-core) 0%, var(--glow-mid) 38%, transparent 68%)",
          filter: `blur(${blur}px)`,
        }}
      />

      <div
        ref={haloRef}
        className="absolute top-0 left-0 opacity-0 transition-opacity duration-700 will-change-transform"
        style={{
          height: halo,
          width: halo,
          backgroundImage:
            "radial-gradient(var(--dot-lit) 1px, transparent 1px)",
          backgroundSize: `${GRID}px ${GRID}px`,
          maskImage:
            "radial-gradient(circle, #000 0%, #000 12%, transparent 48%)",
          WebkitMaskImage:
            "radial-gradient(circle, #000 0%, #000 12%, transparent 48%)",
        }}
      />

      {edges
        ? edgeBars.map((bar, i) => (
            <div
              key={bar.cls}
              ref={(el) => {
                edgeRefs.current[i] = el;
              }}
              className={cn(
                "absolute opacity-0 will-change-transform",
                bar.cls,
              )}
              style={bar.style}
            />
          ))
        : null}
    </div>
  );
}
