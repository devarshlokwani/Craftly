"use client";

import { useEffect, useRef } from "react";

import { cn } from "../../lib/cn";

interface TrailSquare {
  x: number;
  y: number;
  key: string;
  opacity: number;
  fadeRate: number;
}

export interface PixelTrailProps {
  /** Size of one grid cell, in px. The trail snaps to this lattice. */
  gridSize?: number;
  /** How many cells stay lit before the oldest are dropped. */
  length?: number;
  /** Fill colour for a lit cell. Alpha is supplied by the trail itself. */
  color?: string;
  /** Opacity of a cell at a standstill, and at full speed. */
  minOpacity?: number;
  maxOpacity?: number;
  /** How much opacity a cell loses per frame. */
  fadeRate?: number;
  /**
   * How much of the distance to the pointer the trail head closes each frame.
   * Matches `recoil-cursor` by default so the two sit together.
   */
  follow?: number;
  /**
   * Keep the trail inside its parent instead of covering the viewport.
   *
   * Fixed is right when the trail *is* the page's background. Anywhere else —
   * a demo tile, a card, a hero panel — it has to be contained, or dropping one
   * component onto a page silently hands it the whole screen. The parent needs
   * `position: relative` and should clip.
   */
  contained?: boolean;
  className?: string;
}

/**
 * A trail of grid cells that light up behind the pointer and fade out.
 *
 * The lattice is the whole idea. A free-floating trail is a smear; snapping
 * every mark to a fixed grid makes the same motion read as something being
 * *revealed* — the grid was always there, the cursor just lights part of it.
 *
 * Three things keep it from looking mechanical. Cells are brighter the faster
 * you move, so a flick leaves a hot streak and a drift leaves almost nothing. A
 * cell ahead of the pointer lights at reduced strength, which reads as the trail
 * anticipating the direction of travel. And cells either side light only on a
 * genuine change in acceleration, so turns and stops leave a wider mark than
 * straight runs do.
 *
 * One canvas, one rAF loop, and a list that never grows past `length + 6`.
 * Inert for coarse pointers and under reduced motion.
 */
export function PixelTrail({
  gridSize = 35,
  length = 3,
  color = "228, 217, 255",
  minOpacity = 0.08,
  maxOpacity = 0.6,
  fadeRate = 0.006,
  follow = 0.12,
  contained = false,
  className,
}: PixelTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fine = window.matchMedia("(pointer: fine)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || calm) return;

    // Measured from the canvas itself, not the window: fixed to the viewport
    // these are the same number, and contained they are the only correct one.
    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let squares: TrailSquare[] = [];
    let mouseX = 0;
    let mouseY = 0;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let headX = -100;
    let headY = -100;
    let velocityX = 0;
    let velocityY = 0;
    let moving = false;
    let onPage = false;
    let stopTimer = 0;

    const light = (x: number, y: number, opacity: number) => {
      const key = `${x},${y}`;
      const existing = squares.find((s) => s.key === key);
      if (existing) {
        // Re-lighting a cell only ever brightens it — a slow pass should not
        // dim a mark a fast one just made.
        if (opacity > existing.opacity) existing.opacity = opacity;
        return;
      }
      squares.push({ x, y, key, opacity, fadeRate });
      // A small buffer over `length`: the proximity cells are extra marks that
      // should not push the trail's own head off the list.
      if (squares.length > length + 6) squares.shift();
    };

    const onMove = (event: PointerEvent) => {
      onPage = true;
      moving = true;
      window.clearTimeout(stopTimer);
      stopTimer = window.setTimeout(() => {
        moving = false;
      }, 50);

      // Pointer position in the canvas's own space.
      const rect = canvas.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;

      // Contained, a pointer outside the box is not this trail's business.
      if (
        contained &&
        (localX < 0 ||
          localY < 0 ||
          localX > rect.width ||
          localY > rect.height)
      ) {
        onPage = false;
        moving = false;
        return;
      }

      if (headX === -100 && headY === -100) {
        headX = localX;
        headY = localY;
      }
      prevMouseX = mouseX;
      prevMouseY = mouseY;
      mouseX = localX;
      mouseY = localY;
    };

    const onLeave = () => {
      onPage = false;
      moving = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);

      const rawVX = mouseX - prevMouseX;
      const rawVY = mouseY - prevMouseY;
      // Smoothed, so a single jittery sample cannot spike the brightness.
      const lastVX = velocityX;
      const lastVY = velocityY;
      velocityX = velocityX * 0.7 + rawVX * 0.3;
      velocityY = velocityY * 0.7 + rawVY * 0.3;
      const speed = Math.hypot(velocityX, velocityY);

      headX += (mouseX - headX) * follow;
      headY += (mouseY - headY) * follow;

      if (onPage && moving) {
        const gx = Math.floor(headX / gridSize);
        const gy = Math.floor(headY / gridSize);

        const fast = Math.min(speed / 15, 1);
        const head = minOpacity + fast * (maxOpacity - minOpacity);
        light(gx, gy, head);

        if (fast > 0.2) {
          const moveAngle = Math.atan2(velocityY, velocityX);

          // One cell ahead, at reduced strength: the trail leaning into the
          // direction of travel.
          const fx = Math.round(Math.cos(moveAngle));
          const fy = Math.round(Math.sin(moveAngle));
          if (fx !== 0 || fy !== 0) light(gx + fx, gy + fy, head * 0.4);

          // Cells either side, but only on a real change of acceleration — so
          // turning or stopping spreads the mark, while a straight run does not.
          if (
            Math.abs(velocityX - lastVX) > 2 ||
            Math.abs(velocityY - lastVY) > 2
          ) {
            const perp = moveAngle + Math.PI / 2;
            const sx = Math.round(Math.cos(perp));
            const sy = Math.round(Math.sin(perp));
            light(gx + sx, gy + sy, head * 0.25);
            light(gx - sx, gy - sy, head * 0.25);
          }
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Walked backwards so a cell can be removed without skipping the next.
      for (let i = squares.length - 1; i >= 0; i--) {
        const square = squares[i];
        if (!square) continue;
        ctx.fillStyle = `rgba(${color}, ${square.opacity})`;
        ctx.fillRect(
          square.x * gridSize,
          square.y * gridSize,
          gridSize,
          gridSize,
        );
        square.opacity -= square.fadeRate;
        if (square.opacity <= 0) squares.splice(i, 1);
      }
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.clearTimeout(stopTimer);
      squares = [];
    };
  }, [
    gridSize,
    length,
    color,
    minOpacity,
    maxOpacity,
    fadeRate,
    follow,
    contained,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none h-full w-full",
        contained ? "absolute inset-0" : "fixed inset-0",
        className,
      )}
    />
  );
}
