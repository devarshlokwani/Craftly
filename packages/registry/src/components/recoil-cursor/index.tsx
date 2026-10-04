"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "../../lib/cn";

export interface RecoilCursorProps {
  /** Edge length of the resting square, in px. */
  size?: number;
  /** Edge length once it is over a target. */
  hoverSize?: number;
  /** Shown inside the square while it is over a target. */
  label?: React.ReactNode;
  /** What counts as a target. Any CSS selector. */
  target?: string;
  color?: string;
  /** Text colour for the label. */
  labelColor?: string;
  /**
   * How far behind the pointer it trails at a standstill, in px. Speed eats
   * into this — see the recoil note below.
   */
  trail?: number;
  /**
   * Keep the cursor inside its parent instead of over the whole viewport.
   *
   * Fixed is right when it replaces the page's cursor. Anywhere else — a demo
   * tile, a card — it has to be contained, or dropping one component onto a
   * page silently hands it the whole screen. The parent needs
   * `position: relative`.
   */
  contained?: boolean;
  className?: string;
}

/**
 * A small square that chases the pointer, leans into the turn, and recoils.
 *
 * The recoil is the part worth keeping. It does not sit at a fixed distance
 * behind the pointer: the faster you move, the *closer* it pulls in, so a flick
 * snaps it to your heel and a slow drift lets it fall back. Inverting the
 * obvious relationship is what makes it feel like it has mass rather than like
 * it is on a rubber band.
 *
 * It rotates to face its own direction of travel, with the angle interpolated
 * the short way round, so crossing from +179° to -179° turns two degrees rather
 * than spinning the whole way back.
 *
 * Over a target it stops rotating, grows, rounds off and shows `label` — a
 * square that kept tumbling while it said "View" read as a glitch rather than a
 * state.
 *
 * Carries no dependencies. Hidden for coarse pointers and under reduced motion,
 * where the real cursor is left to do its job.
 */
export function RecoilCursor({
  size = 16,
  hoverSize = 35,
  label = "View",
  target = "[data-hoverable]",
  color = "var(--craftly-cursor, #e4d9ff)",
  labelColor = "var(--craftly-cursor-label, #1e2749)",
  trail = 30,
  contained = false,
  className,
}: RecoilCursorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState(false);
  // The rAF loop needs the current hover state without being torn down and
  // rebuilt every time it flips.
  const overRef = useRef(false);
  overRef.current = over;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fine = window.matchMedia("(pointer: fine)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || calm) return;

    let mouseX = 0;
    let mouseY = 0;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let x = -100;
    let y = -100;
    let velocityX = 0;
    let velocityY = 0;
    let smoothAngle = 0;
    let rotation = 0;
    let targetAngle = 0;
    let moving = false;
    let onPage = false;
    let stopTimer = 0;

    const onMove = (event: PointerEvent) => {
      // Positioned in its own containing block. Fixed, that is the viewport and
      // the offsets are zero; contained, it is the parent's box.
      const host = contained ? el.offsetParent : null;
      const rect = host?.getBoundingClientRect();
      const localX = event.clientX - (rect?.left ?? 0);
      const localY = event.clientY - (rect?.top ?? 0);

      // Contained, a pointer outside the box is not this cursor's business.
      if (
        rect &&
        (localX < 0 ||
          localY < 0 ||
          localX > rect.width ||
          localY > rect.height)
      ) {
        onPage = false;
        moving = false;
        el.style.opacity = "0";
        return;
      }

      onPage = true;
      moving = true;
      el.style.opacity = "1";
      window.clearTimeout(stopTimer);
      stopTimer = window.setTimeout(() => {
        moving = false;
      }, 50);

      if (x === -100 && y === -100) {
        x = localX;
        y = localY;
      }
      prevMouseX = mouseX;
      prevMouseY = mouseY;
      mouseX = localX;
      mouseY = localY;
    };

    const onLeave = () => {
      onPage = false;
      moving = false;
      el.style.opacity = "0";
    };

    const onOver = (event: PointerEvent) => {
      const hit = (event.target as Element | null)?.closest?.(target);
      if (hit) setOver(true);
    };
    const onOut = (event: PointerEvent) => {
      const from = (event.target as Element | null)?.closest?.(target);
      const to = (event.relatedTarget as Element | null)?.closest?.(target);
      if (from && !to) setOver(false);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (!onPage) return;

      velocityX = velocityX * 0.7 + (mouseX - prevMouseX) * 0.3;
      velocityY = velocityY * 0.7 + (mouseY - prevMouseY) * 0.3;
      const speed = Math.hypot(velocityX, velocityY);

      if (moving) {
        const instant = Math.atan2(mouseY - y, mouseX - x);
        // Taken the short way round, so the turn never takes the long route.
        let diff = instant - smoothAngle;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        smoothAngle += diff * 0.15;
      }

      // Recoil: the faster it is going, the less it lags. At rest it sits a
      // full `trail` behind; at speed it pulls almost onto the pointer.
      const recoil = Math.min(speed * 0.8, trail * 0.83);
      const lag = trail - recoil;
      const toX = mouseX - Math.cos(smoothAngle) * lag;
      const toY = mouseY - Math.sin(smoothAngle) * lag;

      x += (toX - x) * 0.12;
      y += (toY - y) * 0.12;

      if (moving) targetAngle = (smoothAngle * 180) / Math.PI;
      let spin = targetAngle - rotation;
      while (spin > 180) spin -= 360;
      while (spin < -180) spin += 360;
      rotation += spin * 0.08;

      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      // Held square while it is a label: a box that keeps tumbling under a word
      // reads as a bug, not a state.
      el.style.transform = overRef.current
        ? "translate(-50%, -50%)"
        : `translate(-50%, -50%) rotate(${rotation}deg)`;
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      window.clearTimeout(stopTimer);
    };
  }, [target, trail, contained]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "pointer-events-none z-[10000] flex items-center justify-center opacity-0",
        contained ? "absolute" : "fixed",
        "transition-[width,height,border-radius,opacity] duration-200",
        className,
      )}
      style={{
        width: over ? hoverSize : size,
        height: over ? hoverSize : size,
        background: color,
        color: labelColor,
        borderRadius: over ? 4 : 0,
        fontSize: "0.72rem",
        fontWeight: 700,
        boxShadow: `0 0 15px ${color}4d, 0 0 30px ${color}33`,
      }}
    >
      {over ? label : null}
    </div>
  );
}
