import { GlowField } from "@/components/glow-field";

/**
 * The page body's field: fixed to the viewport, inset below the nav and inside
 * the side rails, and capped by the footer as it scrolls up.
 *
 * There is exactly one of these. The nav and footer are deliberately outside it
 * and stay plain — when the cursor crosses into them the light cannot follow, so
 * it pins to that border and flattens along it, which is the point: it looks
 * like it is trying to leave the frame and cannot.
 */
export function CursorField() {
  return (
    <div className="pointer-events-none fixed top-[var(--nav-h)] right-[var(--frame)] bottom-0 left-[var(--frame)] z-0">
      <GlowField bottomBoundary="footer" />
    </div>
  );
}
