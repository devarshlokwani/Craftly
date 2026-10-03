"use client";

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Tracks the user's reduced-motion preference, and keeps tracking it — the OS
 * setting can be toggled while the page is open, so this subscribes rather than
 * reading once.
 *
 * Returns `false` during SSR and on the first client render. That is deliberate:
 * it matches what the server rendered, so hydration stays stable, and the effect
 * corrects it before any animation is allowed to start. Every Craftly component
 * must branch on this and render a sensible static state when it is `true`.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    setReduced(mql.matches);

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
