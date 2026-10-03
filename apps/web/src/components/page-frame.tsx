/**
 * The frame the whole site sits inside.
 *
 * Two bare hairlines read as an accident. This is a proper margin: a band of
 * diagonal hatching down each edge, closed by a hairline on its inner side, with
 * the page content inset past it. The hatch is what makes it look like drafting
 * stock rather than a stray border, and the inset is what stops content touching
 * the screen edge.
 *
 * Fixed rather than in flow, so the frame stays put while the page scrolls
 * behind it. It sits above the content but below the nav, and ignores pointer
 * events entirely.
 */
export function PageFrame() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40">
      <Edge side="left" />
      <Edge side="right" />

      {/* Corner ticks: short accent rules that pick out the frame's corners the
          way crop marks do. Only the inner corners, so they frame the content
          rather than outlining a box. */}
      <Tick className="top-[var(--frame)] left-[var(--frame)] border-t border-l" />
      <Tick className="top-[var(--frame)] right-[var(--frame)] border-t border-r" />
      <Tick className="bottom-[var(--frame)] left-[var(--frame)] border-b border-l" />
      <Tick className="right-[var(--frame)] bottom-[var(--frame)] border-r border-b" />
    </div>
  );
}

function Edge({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={[
        "absolute inset-y-0 w-[var(--frame)] bg-bg",
        side === "left" ? "left-0 border-r" : "right-0 border-l",
        "border-line",
      ].join(" ")}
    >
      <div
        className="h-full w-full opacity-70"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, var(--line) 0 1px, transparent 1px 8px)",
          // Fade the hatch out top and bottom so the band doesn't read as a
          // hard-stopped stripe where it meets the viewport edge.
          maskImage:
            "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
        }}
      />
    </div>
  );
}

function Tick({ className }: { className: string }) {
  return <span className={`absolute h-5 w-5 border-accent/45 ${className}`} />;
}
