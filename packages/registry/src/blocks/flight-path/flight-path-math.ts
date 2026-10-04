export interface PathPoint {
  x: number;
  y: number;
}

interface PathSample extends PathPoint {
  length: number;
}

export interface FlightPath {
  /** SVG path `d` string through the same points (a fine polyline once jittered, see buildFlightPath) */
  d: string;
  totalLength: number;
  samples: PathSample[];
  /** cumulative arc length at each input point (same length/order as `points`) */
  pointLengths: number[];
}

function cubicPoint(
  p0: PathPoint,
  c1: PathPoint,
  c2: PathPoint,
  p1: PathPoint,
  t: number,
): PathPoint {
  const mt = 1 - t;
  const a = mt * mt * mt;
  const b = 3 * mt * mt * t;
  const c = 3 * mt * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * c1.x + c * c2.x + d * p1.x,
    y: a * p0.y + b * c1.y + c * c2.y + d * p1.y,
  };
}

// A handful of stacked sine waves at different frequencies/phases, a cheap,
// fully deterministic stand-in for hand-tremor noise, so the same arc length
// always wobbles the same way (no per-render flicker) without pulling in a
// noise library.
function handWobble(length: number, amplitude: number) {
  if (amplitude <= 0) return 0;
  return (
    Math.sin(length * 0.018) * amplitude * 0.55 +
    Math.sin(length * 0.05 + 1.7) * amplitude * 0.3 +
    Math.sin(length * 0.12 + 4.2) * amplitude * 0.15
  );
}

function polylineD(samples: PathSample[]) {
  return samples
    .map((s, i) => `${i === 0 ? "M" : "L"} ${s.x.toFixed(1)} ${s.y.toFixed(1)}`)
    .join(" ");
}

interface BuildFlightPathOptions {
  stepsPerSegment?: number;
  /** perpendicular hand-wobble amplitude in px, 0 for a perfectly smooth curve */
  jitterAmplitude?: number;
}

/**
 * Builds a smooth, gently wandering path through `points` (horizontal
 * tangent at every point, via the classic "control point = 1/3 of the way
 * to the neighbor, same y" trick, good enough smoothing without pulling in
 * a curve-fitting library), plus a finely-sampled arc-length table so a
 * plane can be positioned/rotated by scroll progress without touching the
 * DOM (no `getPointAtLength` calls on every scroll tick).
 *
 * With `jitterAmplitude` set, a deterministic hand-wobble is added
 * perpendicular to the curve at every sample, the line (and anything
 * tracking it, like the plane) reads as drawn rather than plotted.
 */
export function buildFlightPath(
  points: PathPoint[],
  options: BuildFlightPathOptions = {},
): FlightPath {
  const { stepsPerSegment = 32, jitterAmplitude = 0 } = options;

  // A real guard, not a type dance: a caller handing over an empty set would
  // otherwise read `points[0]` off nothing and take the page with it.
  const first = points[0];
  if (!first) {
    return { d: "", totalLength: 0, samples: [], pointLengths: [] };
  }

  const raw: PathSample[] = [{ x: first.x, y: first.y, length: 0 }];
  const pointLengths: number[] = [0];
  let cumulative = 0;

  for (let i = 0; i < points.length - 1; i++) {
    // Both reads are inside the loop's own bounds; the assertions only stand
    // in for that, since noUncheckedIndexedAccess cannot see the invariant.
    const p0 = points[i]!;
    const p1 = points[i + 1]!;
    const half = (p1.x - p0.x) / 2;
    const c1 = { x: p0.x + half, y: p0.y };
    const c2 = { x: p1.x - half, y: p1.y };

    let prev = p0;
    for (let s = 1; s <= stepsPerSegment; s++) {
      const t = s / stepsPerSegment;
      const pt = cubicPoint(p0, c1, c2, p1, t);
      cumulative += Math.hypot(pt.x - prev.x, pt.y - prev.y);
      raw.push({ x: pt.x, y: pt.y, length: cumulative });
      prev = pt;
    }
    pointLengths.push(cumulative);
  }

  if (jitterAmplitude <= 0) {
    return {
      d: polylineD(raw),
      totalLength: cumulative,
      samples: raw,
      pointLengths,
    };
  }

  const jittered: PathSample[] = raw.map((pt, i) => {
    // Both indices are clamped into range on the lines themselves.
    const prevPt = raw[Math.max(0, i - 1)]!;
    const nextPt = raw[Math.min(raw.length - 1, i + 1)]!;
    const tx = nextPt.x - prevPt.x;
    const ty = nextPt.y - prevPt.y;
    const tLen = Math.hypot(tx, ty) || 1;
    // perpendicular (normal) to the local tangent
    const nx = -ty / tLen;
    const ny = tx / tLen;
    const offset = handWobble(pt.length, jitterAmplitude);
    return { x: pt.x + nx * offset, y: pt.y + ny * offset, length: pt.length };
  });

  return {
    d: polylineD(jittered),
    totalLength: cumulative,
    samples: jittered,
    pointLengths,
  };
}

/** Interpolated position + direction of travel (degrees) at a given arc length along the sampled path. */
export function sampleFlightPath(samples: PathSample[], targetLength: number) {
  // An empty set has no position to report. Returning the origin keeps callers
  // from having to special-case a path that was never built.
  const last = samples[samples.length - 1];
  if (!last) return { x: 0, y: 0, angleDeg: 0 };

  const clamped = Math.max(0, Math.min(targetLength, last.length));

  let lo = 0;
  let hi = samples.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (samples[mid]!.length < clamped) lo = mid + 1;
    else hi = mid;
  }

  // `lo` lands inside the array by construction of the binary search above.
  const b = samples[lo]!;
  const a = samples[Math.max(0, lo - 1)]!;
  const span = b.length - a.length;
  const t = span > 0 ? (clamped - a.length) / span : 0;

  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    angleDeg: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
  };
}
