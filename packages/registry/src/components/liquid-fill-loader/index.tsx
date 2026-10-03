"use client";

import { useEffect, useId, useRef, type CSSProperties } from "react";

import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";

/** A rounded square — the default mark, used when no `shapePath` is given. */
const DEFAULT_SHAPE = "M2 2 h60 v60 h-60 z";
const DEFAULT_RADIUS = 16;

/**
 * Four droplets, launched on arcs away from the mark once the liquid settles.
 * Coordinates are relative to the centre of the stage, in px.
 */
const DEFAULT_DROPS: DropSpec[] = [
  { fromX: 56, fromY: -14, toX: 88, toY: -34 },
  { fromX: 52, fromY: 40, toX: 80, toY: 70 },
  { fromX: -52, fromY: 40, toX: -80, toY: 70 },
  { fromX: -56, fromY: -14, toX: -88, toY: -34 },
];

const DROP_PATH =
  "M4.5 0 C4.5 0 0 6 0 8.7 a4.5 4.5 0 0 0 9 0 C9 6 4.5 0 4.5 0 z";

export interface DropSpec {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface LiquidFillLoaderProps {
  /**
   * SVG path for the mark's outline. The liquid is clipped to this shape, so it
   * doubles as the container silhouette. Defaults to a rounded square.
   */
  shapePath?: string;
  /**
   * Optional path for a glyph sitting inside the mark (a letterform, say). Where
   * the liquid passes behind it the glyph is painted in `surfaceColor`, so it
   * reads as a knockout rather than a flat overlay. This is what gives the
   * effect its depth — omit it and you get a plain filling shape.
   */
  glyphPath?: string;
  /** viewBox for both paths. Defaults to the 64×64 grid the paths above use. */
  viewBox?: string;
  /** Corner radius for the default rounded-square shape. Ignored if `shapePath` is set. */
  cornerRadius?: number;
  /** Text under the mark. Omit for a mark-only loader. */
  label?: string;
  /** Degrees the mark is tilted before it settles upright. */
  tilt?: number;
  /** Seconds the liquid takes to fill. Everything else is timed off this. */
  fillDuration?: number;
  /** Droplets flung out when the mark settles. Pass `[]` to disable. */
  drops?: DropSpec[];
  liquidColor?: string;
  /** Darker shade for the trailing wave crest. Give the liquid its volume. */
  liquidDeepColor?: string;
  /** Page/overlay colour, and the knockout colour for `glyphPath`. */
  surfaceColor?: string;
  labelColor?: string;
  /** Render as a fixed full-screen overlay. Set false to embed inline. */
  overlay?: boolean;
  /** Called once the exit fade finishes — unmount the loader here. */
  onDone?: () => void;
  /**
   * Play continuously instead of once. Intended for showing the effect off; a
   * real intro should stay one-shot and use `onDone`. Repeating keeps a single
   * mounted instance rather than remounting, so there is no blank frame between
   * passes, and `onDone` is never called.
   */
  repeat?: boolean;
  /** Seconds the faded-out state is held before a repeating pass restarts. */
  repeatDelay?: number;
  className?: string;
}

/**
 * An intro loader where liquid rises to fill a logo mark, the mark settles
 * upright with a spring, and a few droplets scatter off it.
 *
 * Needs `gsap` installed. The animation is built once on mount and torn down on
 * unmount; under `prefers-reduced-motion` it skips straight to the filled state
 * and fades out, so `onDone` still fires and the page is never left blocked.
 */
export function LiquidFillLoader({
  shapePath,
  glyphPath,
  viewBox = "0 0 64 64",
  cornerRadius = DEFAULT_RADIUS,
  label,
  tilt = -12,
  fillDuration = 1.9,
  drops = DEFAULT_DROPS,
  liquidColor = "var(--craftly-liquid, #2D4A3E)",
  liquidDeepColor = "var(--craftly-liquid-deep, #1F3329)",
  surfaceColor = "var(--craftly-surface, #FAFAF7)",
  labelColor,
  overlay = true,
  onDone,
  repeat = false,
  repeatDelay = 0.35,
  className,
}: LiquidFillLoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Clip paths are referenced by url(#id), which is document-global — two
  // loaders on one page would otherwise fight over the same ids.
  const uid = useId().replace(/:/g, "");
  const shapeClip = `${uid}-shape`;
  const glyphClip = `${uid}-glyph`;

  // onDone is called from a GSAP callback created once on mount, so it is held
  // in a ref to avoid re-running the whole timeline when the parent re-renders
  // with a new closure.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    // Dynamic import keeps gsap out of the bundle for anyone who never renders
    // this component, and keeps it an optional peer dependency.
    void import("gsap").then(({ gsap }) => {
      if (cancelled || !rootRef.current) return;

      const q = gsap.utils.selector(root);
      const finish = () => onDoneRef.current?.();

      const ctx = gsap.context(() => {
        const liquidGroups = q("[data-liquid-y]");
        const rotGroups = q("[data-liquid-rot]");

        if (reduced) {
          gsap.set(liquidGroups, { y: -14 });
          gsap.set(rotGroups, { rotation: 0, svgOrigin: "32 32" });
          gsap.set(q("[data-mark]"), { rotation: 0 });
          gsap.set(q("[data-label]"), { opacity: 1, y: 0 });
          gsap.to(root, {
            opacity: 0,
            duration: 0.5,
            delay: 0.5,
            onComplete: finish,
          });
          return;
        }

        // The two crests drift in opposite directions at different speeds, which
        // is what stops the surface reading as a single sliding shape.
        gsap.to(q("[data-crest='lead']"), {
          x: -24,
          duration: 1.1,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
        gsap.to(q("[data-crest='trail']"), {
          x: 24,
          duration: 0.85,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        const settleAt = fillDuration + 0.05;
        const tl = gsap.timeline({
          onComplete: repeat ? undefined : finish,
          repeat: repeat ? -1 : 0,
          repeatDelay: repeat ? repeatDelay : 0,
        });

        // Reset everything the previous pass left behind. Without this a
        // repeating loop restarts from a faded-out overlay littered with spent
        // droplets, which reads as the mark vanishing for a beat.
        tl.set(root, { opacity: 1 }, 0);
        // The settle tweens animate *to* zero rotation, so a second pass has
        // nothing left to move unless the tilt is wound back first. Same for the
        // label, which otherwise stays visible from the previous cycle.
        tl.set(q("[data-mark]"), { rotation: tilt }, 0);
        tl.set(rotGroups, { rotation: -tilt, svgOrigin: "32 32" }, 0);
        tl.set(q("[data-label]"), { opacity: 0 }, 0);
        tl.call(
          () => {
            root.querySelectorAll("[data-drop]").forEach((el) => el.remove());
          },
          undefined,
          0,
        );

        tl.fromTo(
          liquidGroups,
          { y: 70 },
          { y: -14, duration: fillDuration, ease: "power1.inOut" },
          0,
        );
        tl.to(
          q("[data-label]"),
          { opacity: 1, y: 0, duration: 0.5 },
          fillDuration * 0.53,
        );
        // The mark and the liquid inside it must unrotate together, or the
        // surface visibly shears against the shape it is sitting in.
        tl.to(
          q("[data-mark]"),
          { rotation: 0, duration: 0.6, ease: "back.out(1.7)" },
          settleAt,
        );
        tl.to(
          rotGroups,
          {
            rotation: 0,
            duration: 0.6,
            ease: "back.out(1.7)",
            svgOrigin: "32 32",
          },
          settleAt,
        );

        if (drops.length > 0) {
          tl.call(
            () => {
              const stage = root.querySelector("[data-mark]");
              if (!stage) return;
              drops.forEach((drop, i) => {
                const el = document.createElement("div");
                el.setAttribute("data-drop", "");
                el.style.cssText =
                  "position:absolute;top:50%;left:50%;width:9px;height:13px;opacity:0;pointer-events:none";
                el.innerHTML = `<svg viewBox="0 0 9 13" width="9" height="13"><path d="${DROP_PATH}" fill="${liquidColor}"/></svg>`;
                stage.appendChild(el);

                const peakY = Math.min(drop.fromY, drop.toY) - 24;
                gsap
                  .timeline({ delay: i * 0.06 })
                  .set(el, {
                    x: drop.fromX,
                    y: drop.fromY,
                    opacity: 1,
                    scale: 0.5,
                    rotation: gsap.utils.random(-25, 25),
                  })
                  .to(el, {
                    x: (drop.fromX + drop.toX) / 2,
                    y: peakY,
                    scale: 1,
                    duration: 0.28,
                    ease: "power2.out",
                  })
                  .to(el, {
                    x: drop.toX,
                    y: drop.toY,
                    duration: 0.34,
                    ease: "power1.in",
                  })
                  .to(el, { opacity: 0, duration: 0.18 }, "-=0.18");
              });
            },
            undefined,
            settleAt + 0.15,
          );
        }

        const endAt = settleAt + 1.05;

        if (repeat) {
          // Wind the whole thing back out in view rather than fading it away:
          // the liquid drains, the mark tips back to its resting angle and the
          // label clears, which hands straight over to the next fill. Fading
          // out and remounting is what made the mark vanish for a beat.
          tl.to(
            liquidGroups,
            { y: 70, duration: 0.75, ease: "power1.in" },
            endAt,
          );
          tl.to(
            q("[data-label]"),
            { opacity: 0, duration: 0.4, ease: "none" },
            endAt,
          );
          tl.to(
            q("[data-mark]"),
            { rotation: tilt, duration: 0.6, ease: "power2.inOut" },
            endAt,
          );
          tl.to(
            rotGroups,
            {
              rotation: -tilt,
              duration: 0.6,
              ease: "power2.inOut",
              svgOrigin: "32 32",
            },
            endAt,
          );
        } else {
          tl.to(
            root,
            { opacity: 0, duration: 0.55, ease: "power1.inOut" },
            endAt,
          );
        }
      }, root);

      cleanup = () => ctx.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [reduced, fillDuration, drops, liquidColor, repeat, repeatDelay, tilt]);

  const useDefaultShape = !shapePath;
  const path = shapePath ?? DEFAULT_SHAPE;

  return (
    <div
      ref={rootRef}
      role="status"
      aria-live="polite"
      aria-label={label ? `Loading ${label}` : "Loading"}
      className={cn(
        "flex h-full w-full items-center justify-center",
        // Purely decorative: never swallow a click meant for the page beneath,
        // which is a real bug when someone reaches a button before the intro ends.
        "pointer-events-none",
        overlay && "fixed inset-0 z-[9999]",
        className,
      )}
      style={
        { background: overlay ? surfaceColor : undefined } as CSSProperties
      }
    >
      <div className="relative flex flex-col items-center gap-5">
        <div className="relative h-[104px] w-[104px]">
          <div
            data-mark
            className="relative h-full w-full"
            style={{ transform: `rotate(${tilt}deg)` }}
          >
            <svg
              viewBox={viewBox}
              className="block h-full w-full overflow-visible"
              aria-hidden="true"
            >
              <defs>
                <clipPath id={shapeClip}>
                  {useDefaultShape ? (
                    <rect
                      x="2"
                      y="2"
                      width="60"
                      height="60"
                      rx={cornerRadius}
                    />
                  ) : (
                    <path d={path} />
                  )}
                </clipPath>
                {glyphPath ? (
                  <clipPath id={glyphClip}>
                    <path d={glyphPath} />
                  </clipPath>
                ) : null}
              </defs>

              {useDefaultShape ? (
                <rect
                  x="2"
                  y="2"
                  width="60"
                  height="60"
                  rx={cornerRadius}
                  fill="none"
                  stroke={liquidColor}
                  strokeWidth="3"
                />
              ) : (
                <path
                  d={path}
                  fill="none"
                  stroke={liquidColor}
                  strokeWidth="3"
                />
              )}

              {glyphPath ? (
                <path d={glyphPath} fill={liquidColor} opacity="0.18" />
              ) : null}

              {/* Liquid, clipped to the mark. */}
              <g clipPath={`url(#${shapeClip})`}>
                <g data-liquid-rot transform={`rotate(${-tilt} 32 32)`}>
                  <g data-liquid-y>
                    <rect
                      x="-40"
                      y="20"
                      width="150"
                      height="120"
                      fill={liquidColor}
                    />
                    <path
                      data-crest="lead"
                      d="M-40 20 q12 -5 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 v8 h-168 z"
                      fill={liquidColor}
                    />
                    <path
                      data-crest="trail"
                      d="M-40 21 q12 5 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 v8 h-168 z"
                      fill={liquidDeepColor}
                      opacity="0.4"
                    />
                  </g>
                </g>
              </g>

              {/* The same liquid again, clipped to the glyph and painted in the
                  surface colour, so the glyph knocks out of the rising liquid. */}
              {glyphPath ? (
                <g clipPath={`url(#${glyphClip})`}>
                  <g clipPath={`url(#${shapeClip})`}>
                    <g data-liquid-rot transform={`rotate(${-tilt} 32 32)`}>
                      <g data-liquid-y>
                        <rect
                          x="-40"
                          y="20"
                          width="150"
                          height="120"
                          fill={surfaceColor}
                        />
                        <path
                          data-crest="lead"
                          d="M-40 20 q12 -5 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 v8 h-168 z"
                          fill={surfaceColor}
                        />
                      </g>
                    </g>
                  </g>
                </g>
              ) : null}
            </svg>
          </div>
        </div>

        {label ? (
          <div
            data-label
            className="w-full text-center text-[22px] opacity-0"
            style={{ color: labelColor ?? liquidColor }}
          >
            {label}
          </div>
        ) : null}
      </div>
    </div>
  );
}
