"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";

import { SketchScenery } from "../../components/sketch-scenery";
import { cn } from "../../lib/cn";
import {
  buildFlightPath,
  sampleFlightPath,
  type PathPoint,
} from "./flight-path-math";
import { PaperPlaneIcon } from "./paper-plane-icon";

export interface FlightStop {
  id: string;
  /** Whatever rides at this checkpoint — a TapedCard reads best. */
  content: React.ReactNode;
}

export interface FlightPathProps {
  /** One checkpoint per stop, in the order they are flown. */
  stops: FlightStop[];
  /** Locked at the top of the pinned view, above the paper. */
  heading?: React.ReactNode;
  /** The crayon the trail is drawn in. */
  accent?: string;
  paper?: string;
  className?: string;
}

interface Checkpoint {
  x: number;
  y: number;
  arcLength: number;
}

interface Geometry {
  totalWidth: number;
  laneHeight: number;
  d: string;
  totalLength: number;
  samples: ReturnType<typeof buildFlightPath>["samples"];
  checkpoints: Checkpoint[];
}

function buildGeometry(
  viewportWidth: number,
  laneHeight: number,
  count: number,
): Geometry {
  const midY = laneHeight / 2;
  const amplitude = laneHeight * 0.16;
  const marginX = viewportWidth * 0.32;
  const segmentWidth = viewportWidth * 0.85;
  const totalWidth = marginX * 2 + segmentWidth * count;

  const points: PathPoint[] = [{ x: 0, y: midY }];
  for (let i = 0; i < count; i++) {
    points.push({
      x: marginX + segmentWidth * (i + 0.5),
      y: i % 2 === 0 ? midY - amplitude : midY + amplitude,
    });
  }
  points.push({ x: totalWidth, y: midY });

  const { d, totalLength, samples, pointLengths } = buildFlightPath(points, {
    jitterAmplitude: 5,
  });
  // Checkpoint x/y are read back off the jittered samples so each marker sits
  // exactly on the hand-wobbled line, not on the original clean control point.
  const checkpoints: Checkpoint[] = points.slice(1, -1).map((_p, i) => {
    const arcLength = pointLengths[i + 1] ?? 0;
    const { x, y } = sampleFlightPath(samples, arcLength);
    return { x, y, arcLength };
  });

  return { totalWidth, laneHeight, d, totalLength, samples, checkpoints };
}

/**
 * A journey across a sheet of paper, driven by scroll.
 *
 * The section pins with `heading` locked at the top, and further scroll becomes
 * horizontal travel: a paper plane glides along a wandering path over a drawn
 * countryside, inking a dotted trail behind it, and whatever you hang at each
 * checkpoint fades up as the plane arrives and back out as it leaves.
 *
 * The camera is three phases from one clamp. The plane enters from the left
 * margin while the track sits still; once it reaches centre the camera locks on
 * and pans with it; and once holding centre would run past the end of the
 * track, the camera freezes and lets the plane fly on off the right edge.
 * Clamping camera-x to `[2 * centreX - totalWidth, 0]` produces all three
 * phases and both handoffs for free, with no branching.
 *
 * Needs `gsap` and its ScrollTrigger, both loaded on demand. Composed from
 * `sketch-scenery` for the land — pair it with `taped-card` for the stops.
 */
export function FlightPath({
  stops,
  heading,
  accent = "var(--craftly-flight-accent, #ff5a3c)",
  paper = "#f4ecd8",
  className,
}: FlightPathProps) {
  const pinRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const clipRectRef = useRef<SVGRectElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const markerRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Filter and clip ids are document-global; two of these on a page would
  // otherwise share them and clip each other.
  const uid = useId().replace(/:/g, "");
  const grainId = `${uid}-grain`;
  const sketchId = `${uid}-sketch`;
  const clipId = `${uid}-clip`;

  const [geometry, setGeometry] = useState<Geometry | null>(null);

  useLayoutEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const compute = () => {
      const laneHeight = canvasEl.clientHeight || window.innerHeight;
      setGeometry(buildGeometry(window.innerWidth, laneHeight, stops.length));
    };
    compute();

    let resizeTimer: number;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(compute, 200);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
    };
  }, [stops.length]);

  useLayoutEffect(() => {
    if (!geometry) return;
    const pinEl = pinRef.current;
    const canvasEl = canvasRef.current;
    const track = trackRef.current;
    const plane = planeRef.current;
    if (!pinEl || !canvasEl || !track || !plane) return;

    const { totalWidth, totalLength, samples, checkpoints } = geometry;
    const travel = Math.max(1, totalWidth - window.innerWidth);

    // Each checkpoint's visible window reaches about 65% of the way to its
    // nearest neighbour either side: a modest crossfade rather than a hard cut,
    // without adjacent cards both sitting at full opacity.
    const cpProgress = checkpoints.map((cp) => cp.arcLength / totalLength);
    const halfWindows = cpProgress.map((p, i) => {
      const prevGap = i === 0 ? p : p - (cpProgress[i - 1] ?? 0);
      const nextGap =
        i === cpProgress.length - 1 ? 1 - p : (cpProgress[i + 1] ?? 1) - p;
      return Math.min(prevGap, nextGap) * 0.65;
    });

    // Centred on the canvas's own width, not the viewport's — the canvas sits
    // inset inside a max-width layout and is narrower than window.innerWidth.
    const centerX = canvasEl.clientWidth / 2;
    const camMin = 2 * centerX - totalWidth;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled || !pinRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const applyProgress = (progress: number) => {
        const { x, y, angleDeg } = sampleFlightPath(
          samples,
          progress * totalLength,
        );
        const camX = Math.max(camMin, Math.min(0, centerX - x));
        gsap.set(track, { x: camX });
        gsap.set(plane, { x: x - 28, y: y - 12, rotation: angleDeg });
        clipRectRef.current?.setAttribute("width", String(Math.max(0, x)));

        checkpoints.forEach((_cp, i) => {
          const dist = Math.abs(progress - (cpProgress[i] ?? 0));
          const strength = Math.max(0, 1 - dist / (halfWindows[i] || 1));
          const card = cardRefs.current[i];
          if (card) {
            card.style.opacity = String(strength);
            card.style.pointerEvents = strength > 0.5 ? "auto" : "none";
          }
          const marker = markerRefs.current[i];
          if (marker) {
            marker.style.transform = `translate(-50%, -50%) scale(${1 + strength * 0.35})`;
          }
        });
      };

      const ctx = gsap.context(() => {
        // The tween's target is a throwaway proxy — the camera is set directly
        // inside applyProgress, so all this needs to provide is a scrubbed
        // progress value.
        const scrub = { progress: 0 };
        const tween = gsap.to(scrub, {
          progress: 1,
          ease: "none",
          scrollTrigger: {
            trigger: pinEl,
            start: "top top",
            end: `+=${travel}`,
            pin: true,
            refreshPriority: 1,
            /*
              Pinning by transform rather than position. A leftover GSAP
              transform on any ancestor would otherwise become the containing
              block for `position: fixed` and pin this relative to that
              ancestor instead of the viewport — and this is the standard
              recommendation alongside smooth-scroll libraries regardless.
            */
            pinType: "transform",
            scrub: 0.4,
            invalidateOnRefresh: true,
            onUpdate: (self) => applyProgress(self.progress),
          },
        });
        applyProgress(tween.scrollTrigger?.progress ?? 0);
      }, pinEl);

      cleanup = () => ctx.revert();
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [geometry]);

  return (
    <div
      ref={pinRef}
      className={cn(
        "relative flex h-screen w-full flex-col overflow-hidden",
        className,
      )}
    >
      {heading ? (
        <div className="shrink-0 pt-14 md:pt-16">{heading}</div>
      ) : null}

      <div ref={canvasRef} className="relative flex-1 overflow-hidden">
        {/* The paper itself. Sized to the canvas rather than the much wider
            track, so it sits still while everything travels across it. */}
        <div className="absolute inset-0">
          <svg
            className="h-full w-full"
            viewBox="0 0 1600 900"
            preserveAspectRatio="xMidYMax slice"
            aria-hidden="true"
          >
            <defs>
              {/* A static paper grain: turbulence used as a bump map and
                  multiplied over the flat paper colour. A fixed crease level,
                  not an animated crumple. */}
              <filter id={grainId} x="-5%" y="-15%" width="110%" height="130%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.004 0.007"
                  numOctaves={4}
                  seed={7}
                  result="noise"
                />
                <feDiffuseLighting
                  in="noise"
                  surfaceScale={4}
                  diffuseConstant={1.05}
                  lightingColor="#fff8ec"
                  result="light"
                >
                  <feDistantLight azimuth={235} elevation={55} />
                </feDiffuseLighting>
                <feComposite
                  in="light"
                  in2="SourceGraphic"
                  operator="in"
                  result="clippedLight"
                />
                <feBlend
                  in="clippedLight"
                  in2="SourceGraphic"
                  mode="multiply"
                />
              </filter>
            </defs>
            <rect
              x={0}
              y={0}
              width={1600}
              height={900}
              rx={24}
              fill={paper}
              filter={`url(#${grainId})`}
            />
          </svg>
        </div>

        {geometry && (
          <div
            ref={trackRef}
            className="relative h-full"
            style={{ width: geometry.totalWidth }}
          >
            {/* The drawn country, in the track's own coordinate space so it is
                anchored to the paper: the camera pans across it as the plane
                travels, revealing new ground the whole way. */}
            <div
              className="absolute top-0 left-0"
              style={{
                width: geometry.totalWidth,
                height: geometry.laneHeight,
              }}
            >
              <SketchScenery
                width={geometry.totalWidth}
                height={geometry.laneHeight}
              />
            </div>

            <svg
              className="absolute top-0 left-0"
              width={geometry.totalWidth}
              height={geometry.laneHeight}
              aria-hidden="true"
            >
              <defs>
                <clipPath id={clipId}>
                  <rect
                    ref={clipRectRef}
                    x={0}
                    y={0}
                    width={0}
                    height={geometry.laneHeight}
                  />
                </clipPath>
                {/* The path already has a hand-wobble baked into its geometry;
                    this adds fine surface irregularity on top so it reads as a
                    scribbled crayon line rather than a clean stroke. */}
                <filter
                  id={sketchId}
                  x="-10%"
                  y="-60%"
                  width="120%"
                  height="220%"
                >
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.04 0.09"
                    numOctaves={2}
                    seed={11}
                    result="wobble"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="wobble"
                    scale={1.6}
                    xChannelSelector="R"
                    yChannelSelector="G"
                  />
                </filter>
              </defs>

              {/* A soft glow underneath, the main crayon dashes, then a thin
                  dark fleck on top: a layered waxy trail rather than one flat
                  dashed line. All three clipped to how far the plane has flown. */}
              <g filter={`url(#${sketchId})`}>
                <path
                  d={geometry.d}
                  fill="none"
                  stroke="#ffcda0"
                  strokeWidth={5.5}
                  strokeLinecap="round"
                  strokeDasharray="1 13"
                  opacity={0.55}
                  clipPath={`url(#${clipId})`}
                />
                <path
                  d={geometry.d}
                  fill="none"
                  stroke={accent}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeDasharray="2 11"
                  opacity={0.9}
                  clipPath={`url(#${clipId})`}
                />
                <path
                  d={geometry.d}
                  fill="none"
                  stroke="#8a3f18"
                  strokeWidth={1}
                  strokeLinecap="round"
                  strokeDasharray="1.5 12.5"
                  opacity={0.4}
                  clipPath={`url(#${clipId})`}
                />

                {geometry.checkpoints.map((cp, i) => (
                  <circle
                    key={stops[i]?.id ?? i}
                    cx={cp.x}
                    cy={cp.y}
                    r={5}
                    fill={paper}
                    stroke={accent}
                    strokeWidth={2}
                  />
                ))}
              </g>
            </svg>

            <div
              ref={planeRef}
              className="absolute top-0 left-0 h-6 w-14 will-change-transform"
            >
              <PaperPlaneIcon className="h-full w-full drop-shadow-[0_4px_10px_rgba(255,90,60,0.4)]" />
            </div>

            {geometry.checkpoints.map((cp, i) => (
              <div
                key={`marker-${stops[i]?.id ?? i}`}
                ref={(el) => {
                  markerRefs.current[i] = el;
                }}
                aria-hidden="true"
                className="absolute h-2.5 w-2.5 rounded-full"
                style={{
                  left: cp.x,
                  top: cp.y,
                  background: accent,
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))}

            {geometry.checkpoints.map((cp, i) => (
              <div
                key={`card-${stops[i]?.id ?? i}`}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="absolute opacity-0 transition-opacity duration-150 ease-out"
                style={{
                  left: cp.x,
                  // Alternating above and below the line, so consecutive stops
                  // never cover each other as the plane passes between them.
                  ...(i % 2 === 0
                    ? { bottom: geometry.laneHeight * 0.06 }
                    : { top: geometry.laneHeight * 0.08 }),
                  transform: "translateX(-50%)",
                }}
              >
                {stops[i]?.content}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
