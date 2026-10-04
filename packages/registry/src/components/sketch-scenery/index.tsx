"use client";

import { useEffect, useMemo, useRef } from "react";

import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";

const INK = "var(--craftly-scenery-ink, #b8622f)";
const INK_SOFT = "var(--craftly-scenery-ink-soft, #c98b5c)";
/** The paper the scene is drawn on. Nearer landforms are filled with it so
 *  they *occlude* whatever sits behind them. Without that, two ridgelines
 *  simply cross each other into an X instead of one standing in front. */
const PAPER = "var(--craftly-scenery-paper, #f4ecd8)";

/** Deterministic RNG: the same track width always draws the same map, so
 *  the landscape doesn't reshuffle itself on every re-render or resize. */
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Horizontal occupancy for one depth band. Everything placed on the ground
 * goes through one of these, so a barn can't land on a church and a paddock
 * can't be dropped across a field, the generator asks for a span and is
 * told whether it's free, rather than trusting spacing arithmetic.
 */
class Lane {
  private spans: [number, number][] = [];

  claim(x: number, halfWidth: number, gap = 14) {
    const a = x - halfWidth - gap;
    const b = x + halfWidth + gap;
    for (const [s, e] of this.spans) {
      if (a < e && b > s) return false;
    }
    this.spans.push([a, b]);
    return true;
  }
}

/* ------------------------------------------------------------------ *
 * Primitives: each draws around its own local origin at ground level
 * (0,0 = where the thing meets the earth), so placing one is just a
 * translate to the spot it should stand on.
 * ------------------------------------------------------------------ */

function Pine({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0,0 L0,-5" />
      <path d="M-7,-4 L0,-15 L7,-4 Z" />
      <path d="M-6,-11 L0,-21 L6,-11 Z" />
      <path d="M-4.5,-17 L0,-27 L4.5,-17 Z" />
    </g>
  );
}

function Broadleaf({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0,0 L0,-9" />
      <path d="M-8,-9 Q-11,-17 -5,-20 Q-2,-25 3,-22 Q10,-22 9,-13 Q9,-8 0,-9 Z" />
    </g>
  );
}

function House({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-13,0 L-13,-14 L13,-14 L13,0 Z" fill={PAPER} />
      <path d="M-17,-14 L0,-26 L17,-14 Z" fill={PAPER} />
      <path d="M-4,0 L-4,-9 L4,-9 L4,0" />
      <path d="M-10,-11 L-10,-6 L-6.5,-6 L-6.5,-11 Z" />
      <path d="M6.5,-11 L6.5,-6 L10,-6 L10,-11 Z" />
    </g>
  );
}

function Church({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-16,0 L-16,-13 L8,-13 L8,0 Z" fill={PAPER} />
      <path d="M-19,-13 L-4,-24 L11,-13 Z" fill={PAPER} />
      <path d="M8,0 L8,-30 L20,-30 L20,0 Z" fill={PAPER} />
      <path d="M8,-30 L14,-40 L20,-30 Z" fill={PAPER} />
      <path d="M14,-40 L14,-45 M11.5,-43 L16.5,-43" />
      <path d="M-8,0 L-8,-8 Q-4,-11 0,-8 L0,0" />
      <path d="M12,-20 L12,-15 L16,-15 L16,-20 Z" />
    </g>
  );
}

function Barn({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-20,0 L-20,-15 L20,-15 L20,0 Z" fill={PAPER} />
      <path d="M-23,-15 L-12,-27 L12,-27 L23,-15 Z" fill={PAPER} />
      <path d="M-7,0 L-7,-11 L7,-11 L7,0 Z" />
      <path d="M0,-11 L0,0" opacity={0.7} />
      <path d="M-16,-11 L-16,-5 L-11,-5 L-11,-11 Z" />
      <path d="M11,-11 L11,-5 L16,-5 L16,-11 Z" />
    </g>
  );
}

/** Round thatched hut: the roof drawn as a fan of straws, not a plain cone. */
function Hut({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-14,0 L-14,-10 L14,-10 L14,0" fill={PAPER} />
      <path d="M-19,-10 Q0,-30 19,-10 Z" fill={PAPER} />
      <g opacity={0.55} strokeWidth={1.1}>
        <path d="M-13,-11 Q-7,-23 -1,-27" />
        <path d="M-6,-11 Q-3,-23 0,-27" />
        <path d="M6,-11 Q3,-23 0,-27" />
        <path d="M13,-11 Q7,-23 1,-27" />
      </g>
      <path d="M-4,0 L-4,-7 Q0,-9 4,-7 L4,0" />
    </g>
  );
}

function Windmill({
  x,
  y,
  s = 1,
  bladeRef,
}: {
  x: number;
  y: number;
  s?: number;
  bladeRef?: (el: SVGGElement | null) => void;
}) {
  const blade = "M0,-4 L-3.5,-7 L-2,-27 L2,-27 L3.5,-7 Z";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-9,0 L9,0 L5,-48 L-5,-48 Z" fill={PAPER} />
      <path d="M-7.5,-13 L7.5,-13" opacity={0.55} />
      <path d="M-6,-29 L6,-29" opacity={0.55} />
      <path d="M-3,0 L-3,-9 Q0,-12 3,-9 L3,0" />
      <path d="M-6,-48 L0,-57 L6,-48 Z" fill={PAPER} />
      <g transform="translate(0 -52)">
        <g ref={bladeRef} fill={INK_SOFT} strokeWidth={1.2}>
          <path d={blade} />
          <path d={blade} transform="rotate(90)" />
          <path d={blade} transform="rotate(180)" />
          <path d={blade} transform="rotate(270)" />
        </g>
        <circle r={1.8} fill={INK} stroke="none" />
      </g>
    </g>
  );
}

function Grass({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} strokeWidth={1.4}>
      <path d="M-4,0 Q-6,-5 -8,-8" />
      <path d="M0,0 Q0,-6 -1,-11" />
      <path d="M4,0 Q6,-5 8,-8" />
    </g>
  );
}

/** Tilled plot in the near valley: outlined, with furrows running across. */
function Field({
  x,
  y,
  w,
  h,
  skew = 10,
  rows = 6,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  skew?: number;
  rows?: number;
}) {
  const furrows = Array.from({ length: rows }, (_, i) => {
    const t = (i + 1) / (rows + 1);
    const yy = -h * t;
    const off = skew * t;
    return `M${-w / 2 + off},${yy} L${w / 2 + off},${yy}`;
  });
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d={`M${-w / 2},0 L${w / 2},0 L${w / 2 + skew},${-h} L${-w / 2 + skew},${-h} Z`}
        fill={PAPER}
      />
      <g opacity={0.5} strokeWidth={1.1}>
        {furrows.map((f, i) => (
          <path key={i} d={f} />
        ))}
      </g>
    </g>
  );
}

function Fence({
  x,
  y,
  w,
  s = 1,
}: {
  x: number;
  y: number;
  w: number;
  s?: number;
}) {
  const posts = Math.max(2, Math.round(w / 20));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} strokeWidth={1.3}>
      <path d={`M0,-4 L${w},-4`} />
      <path d={`M0,-9 L${w},-9`} />
      {Array.from({ length: posts + 1 }, (_, i) => (
        <path key={i} d={`M${(w / posts) * i},1 L${(w / posts) * i},-12`} />
      ))}
    </g>
  );
}

function Sheep({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} strokeWidth={1.3}>
      <path d="M-7,-5 Q-9,-11 -3,-11 Q0,-14 4,-11 Q9,-11 7,-5 Z" fill={PAPER} />
      <path d="M7,-8 Q11,-9 10,-5 Q9,-3 7,-4" fill={PAPER} />
      <path d="M-4,-5 L-4,0 M2,-5 L2,0 M5,-4 L5,0" />
    </g>
  );
}

function Cow({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} strokeWidth={1.3}>
      <path d="M-9,-6 L-9,-12 L7,-12 L7,-6 Z" fill={PAPER} />
      <path d="M7,-12 L12,-13 L13,-8 L7,-7" fill={PAPER} />
      <path d="M12,-13 L11,-16 M13,-11 L15,-13" />
      <path d="M-7,-6 L-7,0 M-3,-6 L-3,0 M3,-6 L3,0 M6,-6 L6,0" />
      <path d="M-9,-11 Q-13,-10 -12,-6" />
      <path d="M-4,-11 Q-2,-8 0,-11" opacity={0.6} />
    </g>
  );
}

function Bird({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} strokeWidth={1.2}>
      <path d="M-6,0 Q-3,-3.5 0,0 Q3,-3.5 6,0" />
    </g>
  );
}

/* ------------------------------------------------------------------ *
 * Scene generation
 * ------------------------------------------------------------------ */

interface Placement {
  kind:
    | "pine"
    | "broadleaf"
    | "house"
    | "church"
    | "barn"
    | "hut"
    | "grass"
    | "windmill";
  x: number;
  y: number;
  s: number;
}

interface Ridge {
  d: string;
  snow: string[];
  folds: string[];
  hatch: string[];
}

interface Hills {
  d: string;
  crestAt: (x: number) => number;
}

interface SceneParts {
  ridges: { ridge: Ridge; opacity: number; width: number }[];
  hillFar: Hills;
  hillNear: Hills;
  birds: { x: number; y: number; s: number }[];
  village: Placement[];
  fields: {
    x: number;
    y: number;
    w: number;
    h: number;
    skew: number;
    rows: number;
  }[];
  paddocks: {
    x: number;
    y: number;
    w: number;
    stock: { x: number; s: number; cow: boolean }[];
  }[];
  grass: Placement[];
  road: { d1: string; d2: string };
}

/**
 * One mountain range.
 *
 * Each massif is built around a triangle: the summit, a foot on the left,
 * and the saddle it falls into on the right. The drawn flanks then bulge
 * *outward* from that triangle rather than cutting inside it, which makes
 * the triangle a guaranteed subset of the silhouette.
 *
 * That is the whole point of building it this way. Every piece of interior
 * detail, the ridges off the summit and the shading on the flank, is then
 * placed in barycentric coordinates on that triangle, so it cannot leave the
 * mountain it belongs to. The previous version positioned detail by
 * measuring down from the summit in raw pixels, which put most of it outside
 * the silhouette: fold lines ran past the flanks into open sky and across
 * the range behind, and every crossing read as a mistake, which is what made
 * the skyline look tangled rather than drawn.
 *
 * Massifs are also narrower and more numerous than they were. At a half
 * width of five hundred pixels a peak is wider than the canvas is tall and
 * reads as a dune; a range needs its summits close enough together to be
 * seen as one landform.
 */
type Pt = [number, number];

function buildRidge(
  width: number,
  baseY: number,
  peak: number,
  span: number,
  rng: () => number,
  snowline: number,
): Ridge {
  const pts: Pt[] = [];
  const snow: string[] = [];
  const folds: string[] = [];
  const hatch: string[] = [];

  let x = -span * 2;
  pts.push([x, baseY]);

  while (x < width + span) {
    const half = span * (0.55 + rng() * 0.4);
    const h = peak * (0.5 + rng() * 0.5);
    const sx = x + half;
    const sy = baseY - h;

    // The saddle this massif falls into. Deeper than it used to be, so
    // neighbouring summits read as separate peaks rather than as bumps on
    // one long swell.
    const rightHalf = half * (0.75 + rng() * 0.5);
    const saddleY = baseY - peak * (0.02 + rng() * 0.12);

    const L: Pt = [x, baseY];
    const S: Pt = [sx, sy];
    const R: Pt = [sx + rightHalf, saddleY];

    /** A point inside the massif, in barycentric coordinates on L-S-R. */
    const inside = (a: number, b: number): Pt => [
      S[0] + a * (L[0] - S[0]) + b * (R[0] - S[0]),
      S[1] + a * (L[1] - S[1]) + b * (R[1] - S[1]),
    ];

    // Flanks bulge outward from the triangle: a shoulder pushed away from
    // the interior, never into it, so the triangle stays contained.
    const lBulge = h * (0.05 + rng() * 0.07);
    const rBulge = h * (0.04 + rng() * 0.06);
    const lt = 0.42 + rng() * 0.2;
    const rt = 0.4 + rng() * 0.2;

    pts.push([
      L[0] + (S[0] - L[0]) * (1 - lt),
      L[1] + (S[1] - L[1]) * (1 - lt) + lBulge,
    ]);
    pts.push(S);
    pts.push([S[0] + (R[0] - S[0]) * rt, S[1] + (R[1] - S[1]) * rt + rBulge]);
    pts.push(R);

    if (h > peak * 0.42) {
      // Snow sits in a band just under the summit, closed off with a ragged
      // lower edge. Every vertex is barycentric, so the cap cannot spill
      // over a flank the way a free-drawn scribble could.
      if (h > peak * snowline) {
        const reach = 0.2 + rng() * 0.08;
        let cap = `M${inside(reach, 0).join(",")}`;
        const steps = 5;
        for (let k = 1; k <= steps; k++) {
          const t = k / steps;
          const dip = k % 2 === 0 ? 0.55 : 1;
          cap += ` L${inside(reach * (1 - t) * dip, reach * t * dip).join(",")}`;
        }
        cap += ` L${inside(0, reach).join(",")}`;
        snow.push(cap);
      }

      // Two ridges running off the summit, one down each flank, kept a
      // little inside the outline so they read as ridges on the face rather
      // than as a second silhouette.
      folds.push(`M${S.join(",")} L${inside(0.62, 0.06).join(",")}`);
      folds.push(`M${S.join(",")} L${inside(0.08, 0.54).join(",")}`);
      if (rng() > 0.5) {
        folds.push(
          `M${inside(0.12, 0.14).join(",")} L${inside(0.2, 0.46).join(",")}`,
        );
      }

      // Shading on the right flank: short strokes stepping down the face.
      const strokes = 3 + Math.floor(rng() * 3);
      for (let k = 0; k < strokes; k++) {
        const t = 0.22 + (k / strokes) * 0.4;
        const a = t * 0.16;
        hatch.push(
          `M${inside(a, t).join(",")} L${inside(a + 0.06, t + 0.12).join(",")}`,
        );
      }
    }

    x = R[0];
  }

  // `pts` is filled by the loop above and is never empty here. The
  // assertions are only for noUncheckedIndexedAccess, which cannot see it.
  let d = `M${pts[0]![0]},${pts[0]![1]}`;
  for (let i = 1; i < pts.length; i++) d += ` L${pts[i]![0]},${pts[i]![1]}`;
  // Filled well below its own base, so this range cleanly buries the feet of
  // whatever stands behind it instead of tangling with it.
  // Closed off beyond the last foot the loop can reach, not at a fixed
  // margin: a massif whose right foot ran past the closing corner would fold
  // the fill back on itself and notch the far end of the range.
  d += ` L${Math.max(pts[pts.length - 1]![0]!, width + span * 2)},${baseY + peak + 520}`;
  d += ` L${-span * 2},${baseY + peak + 520} Z`;

  return { d, snow, folds, hatch };
}

/**
 * Soft rolling ground, built from a few sine waves laid over each other
 * rather than a chain of quadratic bumps.
 *
 * The chained version could only ever produce one hump per step, all of much
 * the same size, and its curve flattened out so far that the hills rendered
 * as an almost straight line: the farmland seated on them looked like it was
 * floating on blank paper. Summing a long wave, a slow envelope and a short
 * ripple gives ground that genuinely rolls, and lets the crest be read back
 * exactly rather than interpolated between stored samples.
 */
function buildHills(
  width: number,
  baseY: number,
  amp: number,
  wavelength: number,
  rng: () => number,
): Hills {
  const p1 = rng() * Math.PI * 2;
  const p2 = rng() * Math.PI * 2;
  const p3 = rng() * Math.PI * 2;
  const tau = Math.PI * 2;

  const crestAt = (x: number) => {
    const long = Math.sin((x / wavelength) * tau + p1);
    const envelope =
      0.68 + 0.32 * Math.sin((x / (wavelength * 2.6)) * tau + p2);
    const ripple = Math.sin((x / (wavelength * 0.38)) * tau + p3);
    return baseY - amp * (0.5 + 0.5 * long) * envelope - amp * 0.16 * ripple;
  };

  let d = `M${-80},${crestAt(-80)}`;
  for (let x = -80 + 14; x < width + 80; x += 14) d += ` L${x},${crestAt(x)}`;
  d += ` L${width + 80},${baseY + 520} L${-80},${baseY + 520} Z`;

  return { d, crestAt };
}

function buildScene(width: number, height: number): SceneParts {
  const rng = makeRng(20260903);

  /* Bands, back to front. The ranges are stacked so each one's summits break
     the skyline of the one behind it rather than sitting alongside it, which
     is what turns three separate ridgelines into one range with depth. */
  const backBase = height * 0.44;
  const midBase = height * 0.52;
  const frontBase = height * 0.585;
  const hillFarBase = height * 0.68;
  const hillNearBase = height * 0.76;
  const villageY = height * 0.815;
  const fieldY = height * 0.9;
  const roadY = height * 0.955;

  /* Far range tall and pale, front range low and firmer: distance is carried
     by how much of each one you can see, not by opacity alone. */
  const ridges = [
    {
      ridge: buildRidge(width, backBase, height * 0.34, 205, rng, 0.62),
      opacity: 0.2,
      width: 1.3,
    },
    {
      ridge: buildRidge(width, midBase, height * 0.22, 168, rng, 0.78),
      opacity: 0.28,
      width: 1.45,
    },
    {
      ridge: buildRidge(width, frontBase, height * 0.12, 138, rng, 1.2),
      opacity: 0.36,
      width: 1.6,
    },
  ];

  /* Both runs of hills are shallower than they were, and seated lower.
     The far one used to crest above the treeline behind it, and since it is
     filled with paper to bury what it stands in front of, it was cutting the
     ground behind it in half wherever it rose. Each band now clears the one
     behind it outright, which is what lets the stack read as distance rather
     than as shapes fighting for the same strip of paper. */
  const hillFar = buildHills(width, hillFarBase, height * 0.075, 620, rng);
  const hillNear = buildHills(width, hillNearBase, height * 0.062, 780, rng);

  const birds: SceneParts["birds"] = [];
  for (let x = 140; x < width; x += 420 + rng() * 480) {
    const by = height * (0.1 + rng() * 0.12);
    const flock = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < flock; i++) {
      birds.push({
        x: x + i * (15 + rng() * 12),
        y: by + (rng() - 0.5) * 20,
        s: 0.65 + rng() * 0.5,
      });
    }
  }

  /* The valley, laid out through lanes so nothing lands on anything. */
  const buildLane = new Lane();
  const farmLane = new Lane();
  const village: Placement[] = [];
  const fields: SceneParts["fields"] = [];
  const paddocks: SceneParts["paddocks"] = [];

  /* Windmills first, before the hamlets.
     They used to be placed last and so only got whatever the villages left
     over, which on a densely settled valley was almost nothing: two of them
     across the whole panorama, and long stretches of track with none in
     view at all. Claiming first gives them the open ground they are
     supposed to stand on, and the hamlets fill in around them. */
  for (let x = 210; x < width; x += 380 + rng() * 210) {
    if (buildLane.claim(x, 26, 26)) {
      village.push({
        kind: "windmill",
        x,
        y: villageY + 6,
        s: 0.92 + rng() * 0.26,
      });
    }
  }

  /* Villages next: they take what is left of the building lane. Two plans, so a
     second hamlet is not a copy of the first one further along the valley. */
  const plans: {
    kind: Placement["kind"];
    dx: number;
    half: number;
    s: number;
  }[][] = [
    [
      { kind: "barn", dx: -148, half: 24, s: 0.92 },
      { kind: "house", dx: -74, half: 18, s: 1.02 },
      { kind: "church", dx: 4, half: 22, s: 1 },
      { kind: "house", dx: 74, half: 17, s: 0.92 },
      { kind: "hut", dx: 136, half: 20, s: 0.86 },
    ],
    [
      { kind: "hut", dx: -136, half: 18, s: 0.8 },
      { kind: "house", dx: -66, half: 18, s: 0.98 },
      { kind: "barn", dx: 16, half: 24, s: 0.86 },
      { kind: "house", dx: 96, half: 17, s: 1.06 },
      { kind: "hut", dx: 158, half: 17, s: 0.74 },
    ],
  ];
  let plan = 0;
  for (let x = 280; x < width - 200; x += 400 + rng() * 240) {
    // The modulo keeps this inside `plans`, which is a non-empty literal.
    for (const b of plans[plan % plans.length]!) {
      const bx = x + b.dx;
      if (bx < 0 || bx > width) continue;
      // a shallow, consistent stagger reads as a street line; random
      // vertical scatter reads as buildings sliding down a hill
      const y = villageY + (b.kind === "barn" || b.kind === "hut" ? 9 : 0);
      if (buildLane.claim(bx, b.half, 11))
        village.push({ kind: b.kind, x: bx, y, s: b.s });
    }
    plan++;
  }

  // outlying farmsteads: a lone house or barn well away from the hamlets
  for (let x = 120; x < width; x += 210 + rng() * 170) {
    if (!buildLane.claim(x, 22, 24)) continue;
    village.push({
      kind: rng() > 0.5 ? "house" : "barn",
      x,
      y: villageY + 6,
      s: 0.72 + rng() * 0.18,
    });
  }

  // shelter trees fill whatever building-lane gaps are left
  for (let x = 60; x < width; x += 90 + rng() * 120) {
    if (buildLane.claim(x, 12, 9)) {
      village.push({
        kind: rng() > 0.5 ? "broadleaf" : "pine",
        x,
        // Set back from the street, so a shelter tree reads as standing
        // behind the houses rather than out in the crop below them.
        y: villageY - 12,
        s: 0.72 + rng() * 0.38,
      });
    }
  }

  /* Farmland below the village. Plots vary in width and lean, and every so
     often the generator leaves one open, so the band is not wall-to-wall
     crops from one end of the valley to the other. */
  for (let x = 180; x < width - 120; x += 168 + rng() * 145) {
    const roll = rng();
    if (roll > 0.86) continue;
    if (roll > 0.3) {
      const w = 120 + rng() * 150;
      if (!farmLane.claim(x, w / 2 + 16, 22)) continue;
      fields.push({
        x,
        y: fieldY + (rng() - 0.5) * 12,
        // Short enough that the top edge stays below the village. A tall
        // plot reached up into the street and put houses and shelter trees
        // inside a crop.
        w,
        h: 24 + rng() * 18,
        skew: (rng() > 0.5 ? 1 : -1) * (10 + rng() * 16),
        rows: 4 + Math.floor(rng() * 4),
      });
    } else {
      const pw = 120 + rng() * 70;
      if (!farmLane.claim(x, pw / 2 + 16, 22)) continue;
      const cow = rng() > 0.5;
      paddocks.push({
        x: x - pw / 2,
        y: fieldY,
        w: pw,
        stock: Array.from({ length: 2 + Math.floor(rng() * 2) }, (_, i) => ({
          x: 24 + i * (32 + rng() * 24),
          s: 0.85 + rng() * 0.25,
          cow,
        })).filter((st) => st.x < pw - 22),
      });
    }
  }

  /* Undergrowth, split between the village verge and the roadside so it
     never ends up standing in the middle of a crop. */
  const grass: Placement[] = [];
  for (let x = 40; x < width; x += 75 + rng() * 110) {
    // The verge between the village and the crops is only free where no
    // plot was claimed. Asked for one that is taken, the tuft goes down to
    // the roadside instead of being drawn standing in the middle of a
    // field, which is where the old coin-flip kept putting it.
    const verge = rng() > 0.5 && farmLane.claim(x, 7, 5);
    grass.push({
      kind: "grass",
      x,
      y: verge ? villageY + 20 + rng() * 10 : roadY + 12 + rng() * 20,
      s: 0.7 + rng() * 0.5,
    });
  }

  // --- the road runs along the very front, below everything ---
  const road = (() => {
    let d1 = `M-60,${roadY}`;
    let d2 = `M-60,${roadY + 22}`;
    for (let x = -60; x < width + 60; x += 300) {
      const dip = (rng() - 0.5) * 26;
      d1 += ` C${x + 100},${roadY + dip} ${x + 200},${roadY - dip} ${x + 300},${roadY + dip * 0.35}`;
      d2 += ` C${x + 100},${roadY + 22 + dip} ${x + 200},${roadY + 22 - dip} ${x + 300},${roadY + 22 + dip * 0.35}`;
    }
    return { d1, d2 };
  })();

  return {
    ridges,
    hillFar,
    hillNear,
    birds,
    village,
    fields,
    paddocks,
    grass,
    road,
  };
}

const STROKE = {
  strokeLinecap: "round",
  strokeLinejoin: "round",
  fill: "none",
} as const;

function renderPlacement(
  p: Placement,
  i: number,
  mill: (n: number) => (el: SVGGElement | null) => void,
  millIndex: { n: number },
) {
  switch (p.kind) {
    case "pine":
      return <Pine key={i} x={p.x} y={p.y} s={p.s} />;
    case "broadleaf":
      return <Broadleaf key={i} x={p.x} y={p.y} s={p.s} />;
    case "house":
      return <House key={i} x={p.x} y={p.y} s={p.s} />;
    case "church":
      return <Church key={i} x={p.x} y={p.y} s={p.s} />;
    case "barn":
      return <Barn key={i} x={p.x} y={p.y} s={p.s} />;
    case "hut":
      return <Hut key={i} x={p.x} y={p.y} s={p.s} />;
    case "grass":
      return <Grass key={i} x={p.x} y={p.y} s={p.s} />;
    case "windmill": {
      const n = millIndex.n++;
      return <Windmill key={i} x={p.x} y={p.y} s={p.s} bladeRef={mill(n)} />;
    }
  }
}

function RidgeLayer({
  ridge,
  opacity,
  width,
}: {
  ridge: Ridge;
  opacity: number;
  width: number;
}) {
  return (
    <g {...STROKE} stroke={INK} strokeWidth={width} opacity={opacity}>
      <path d={ridge.d} fill={PAPER} />
      <g strokeWidth={1} opacity={0.5}>
        {ridge.folds.map((f, i) => (
          <path key={i} d={f} />
        ))}
      </g>
      <g strokeWidth={0.9} opacity={0.4}>
        {ridge.hatch.map((h, i) => (
          <path key={i} d={h} />
        ))}
      </g>
      <g strokeWidth={1.3}>
        {ridge.snow.map((s, i) => (
          <path key={i} d={s} />
        ))}
      </g>
    </g>
  );
}

/**
 * The hand-inked country the flight crosses. One long panorama laid out
 * across the whole track, so it's fixed to the paper rather than to the
 * viewport: the plane flies over it and the camera pans across it,
 * revealing new ground the whole way.
 *
 * Depth is built two ways. Bands set the vertical order, three ranges, two
 * runs of rolling hills, the settled valley and the road, and
 * every landform in front is *filled with the paper color* so it occludes
 * what stands behind it, which is what stops ridgelines from crossing into
 * an X. Horizontally, everything on the ground is placed through `Lane`
 * occupancy rather than by spacing alone, so a barn never lands on a church
 * and a paddock never straddles a field.
 */
export interface SketchSceneryProps {
  /** Width of the panorama's coordinate space. Wider draws more country. */
  width?: number;
  /** Height of the coordinate space. */
  height?: number;
  className?: string;
}

export function SketchScenery({
  width = 1600,
  height = 420,
  className,
}: SketchSceneryProps) {
  const bladeRefs = useRef<(SVGGElement | null)[]>([]);
  const reducedMotion = useReducedMotion();

  const scene = useMemo(() => buildScene(width, height), [width, height]);

  useEffect(() => {
    if (reducedMotion) return undefined;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    // gsap stays an optional peer dependency: the scene draws fine without it,
    // the sails simply do not turn.
    void import("gsap").then(({ gsap }) => {
      if (cancelled) return;
      const tweens = bladeRefs.current.map((el, i) => {
        if (!el) return null;
        return gsap.to(el, {
          rotation: 360,
          // each mill runs at its own pace, in lockstep they'd read as one
          // mechanism rather than separate mills catching the same wind
          duration: 8 + (i % 5) * 2.2,
          ease: "none",
          repeat: -1,
          transformOrigin: "50% 50%",
        });
      });
      cleanup = () => tweens.forEach((t) => t?.kill());
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [reducedMotion, scene]);

  const mill = (i: number) => (el: SVGGElement | null) => {
    bladeRefs.current[i] = el;
  };
  const millIndex = { n: 0 };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("block h-full w-full", className)}
      aria-hidden="true"
      preserveAspectRatio="xMidYMax slice"
    >
      {scene.ridges.map((r, i) => (
        <RidgeLayer key={i} {...r} />
      ))}

      {/* birds up in the open sky */}
      <g {...STROKE} stroke={INK} opacity={0.26}>
        {scene.birds.map((b, i) => (
          <Bird key={i} x={b.x} y={b.y} s={b.s} />
        ))}
      </g>

      {/* upper rolling ground */}
      <g {...STROKE} stroke={INK} strokeWidth={1.5} opacity={0.26}>
        <path d={scene.hillFar.d} fill={PAPER} />
      </g>

      {/* lower rolling ground */}
      <g {...STROKE} stroke={INK} strokeWidth={1.6} opacity={0.3}>
        <path d={scene.hillNear.d} fill={PAPER} />
      </g>

      {/* the valley */}
      <g {...STROKE} stroke={INK} strokeWidth={2} opacity={0.42}>
        {scene.village.map((p, i) => renderPlacement(p, i, mill, millIndex))}

        {scene.fields.map((f, i) => (
          <Field key={`f-${i}`} {...f} />
        ))}

        {scene.paddocks.map((p, i) => (
          <g key={`p-${i}`}>
            <Fence x={p.x} y={p.y} w={p.w} />
            {p.stock.map((st, j) =>
              st.cow ? (
                <Cow key={j} x={p.x + st.x} y={p.y - 4} s={st.s} />
              ) : (
                <Sheep key={j} x={p.x + st.x} y={p.y - 4} s={st.s} />
              ),
            )}
          </g>
        ))}

        <path d={scene.road.d1} />
        <path d={scene.road.d2} />

        <g strokeWidth={1.5} opacity={0.7}>
          {scene.grass.map((p, i) => renderPlacement(p, i, mill, millIndex))}
        </g>
      </g>
    </svg>
  );
}
