"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "../../lib/cn";
import { brainLights, buildBrain } from "./brain-mesh";

export interface BrainSceneProps {
  /** Radians per second the brain turns on its own. */
  spin?: number;
  /** Render resolution of the square canvas, in CSS pixels before DPR. */
  size?: number;
  /** How far the brain leans toward the pointer. 0 disables the tilt. */
  tiltStrength?: number;
  /** Shown while three.js loads, and permanently if WebGL is unavailable. */
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * A brain mesh, built from maths rather than a model file, turning slowly and
 * leaning toward the pointer.
 *
 * Three things make this safe to drop on a marketing page. `three` is imported
 * dynamically and only once the element is within a screen of the viewport, so
 * nobody downloads a 3D engine to read a heading. The render loop pauses when
 * the canvas is off screen. And every failure path — no `three` installed, no
 * WebGL, a locked-down browser — falls back to whatever you pass as `fallback`
 * instead of throwing.
 *
 * The geometry is generated in `brain-geometry.ts`, so there is no asset to
 * host and nothing to keep in sync.
 */
export function BrainScene({
  spin = 0.16,
  size = 460,
  tiltStrength = 1,
  fallback,
  className,
}: BrainSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let teardown: (() => void) | undefined;

    const start = async (): Promise<(() => void) | undefined> => {
      let THREE: typeof import("three");
      try {
        THREE = await import("three");
      } catch {
        // `three` is an optional peer dependency — not having it is a
        // configuration choice, not a crash.
        if (!cancelled) setFailed(true);
        return;
      }
      if (cancelled) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        // No WebGL: a phone with it switched off, or a locked-down browser.
        if (!cancelled) setFailed(true);
        return;
      }

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      // Above and slightly to one side: the fissure and the folds are on top,
      // and level with it you see a plain silhouette and none of the relief.
      camera.position.set(0.3, 0.72, 3.3);
      camera.lookAt(0, -0.04, 0);

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(size, size, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
      host.appendChild(renderer.domElement);

      const { group: brain, dispose: releaseBrain } = buildBrain(THREE);
      brain.rotation.y = 1.15;
      scene.add(brain);
      for (const light of brainLights(THREE)) scene.add(light);

      const spent: { dispose: () => void }[] = [
        renderer,
        { dispose: releaseBrain },
      ];

      if (cancelled) {
        for (const item of spent) item.dispose();
        renderer.domElement.remove();
        return;
      }
      setReady(true);

      const still = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const pointer = { x: 0, y: 0 };
      const tilt = { x: 0, y: 0 };

      /* Tracked from the window rather than the canvas, because the canvas
         takes no pointer events at all: it is a square box laid over other
         things, and a decoration that swallows a click on a real link is not
         worth a tilt. The pull falls off with distance instead, so it answers a
         cursor near it and ignores one across the page. */
      const follow = (event: PointerEvent) => {
        const box = host.getBoundingClientRect();
        if (!box.width) return;
        const dx =
          (event.clientX - (box.left + box.width / 2)) / (box.width / 2);
        const dy =
          (event.clientY - (box.top + box.height / 2)) / (box.height / 2);
        const near = Math.max(0, 1 - Math.hypot(dx, dy) / 2.4);
        pointer.x = Math.max(-1, Math.min(1, dx)) * near * tiltStrength;
        pointer.y = Math.max(-1, Math.min(1, dy)) * near * tiltStrength;
      };
      if (!still)
        window.addEventListener("pointermove", follow, { passive: true });

      // Only turning while it is on screen: a frame loop behind the fold is
      // work nobody asked for and battery nobody gets back.
      let visible = false;
      const watcher = new IntersectionObserver(
        ([entry]) => (visible = entry?.isIntersecting ?? false),
        { threshold: 0.05 },
      );
      watcher.observe(host);

      let frame = 0;
      let last = performance.now();
      const draw = (now: number) => {
        frame = requestAnimationFrame(draw);
        const delta = Math.min((now - last) / 1000, 0.1);
        last = now;
        if (!visible) return;

        if (!still) {
          brain.rotation.y += spin * delta;
          tilt.x += (pointer.y * 0.22 - tilt.x) * Math.min(delta * 4, 1);
          tilt.y += (pointer.x * 0.3 - tilt.y) * Math.min(delta * 4, 1);
        }
        brain.rotation.x = tilt.x;
        brain.position.x = tilt.y * 0.1;
        renderer.render(scene, camera);
      };
      frame = requestAnimationFrame(draw);

      return () => {
        cancelAnimationFrame(frame);
        watcher.disconnect();
        window.removeEventListener("pointermove", follow);
        for (const item of spent) item.dispose();
        renderer.domElement.remove();
      };
    };

    /* Nothing is fetched until the element is nearly in view. three.js is a
       large thing to hand someone who has only opened the page; the margin
       gives it a screen's warning so it is ready by the time they arrive. */
    const approach = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        approach.disconnect();
        void start().then((fn) => {
          if (cancelled) fn?.();
          else teardown = fn;
        });
      },
      { rootMargin: "600px" },
    );
    approach.observe(host);

    return () => {
      cancelled = true;
      approach.disconnect();
      teardown?.();
    };
  }, [spin, size, tiltStrength]);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label="A brain, turning slowly"
      className={cn(
        "pointer-events-none relative aspect-square w-full",
        className,
      )}
    >
      {fallback ? (
        <div
          className={cn(
            "absolute inset-[18%] transition-opacity duration-500",
            ready && !failed ? "opacity-0" : "opacity-100",
          )}
        >
          {fallback}
        </div>
      ) : null}
    </div>
  );
}
