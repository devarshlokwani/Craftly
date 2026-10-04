"use client";

import { PixelTrail } from "../../components/pixel-trail";
import { RecoilCursor } from "../../components/recoil-cursor";
import { cn } from "../../lib/cn";

export interface PixelCard {
  id: string;
  icon?: React.ReactNode;
  title: string;
  body: string;
}

export interface PixelPlaygroundProps {
  cards: PixelCard[];
  /** The lattice both the trail and the breaks are drawn on. */
  gridSize?: number;
  /** Accent for the cursor and the trail. */
  color?: string;
  /** Shown in the cursor over a card. */
  hoverLabel?: React.ReactNode;
  className?: string;
}

/**
 * A grid of cards wired to both pixel pieces at once.
 *
 * The trail lights the lattice behind the pointer, the cursor chases it and
 * recoils, and over a card it squares up into a label.
 *
 * Both are independent components and work alone — this is the arrangement they
 * were built for. They are left in viewport mode here on purpose: a block owns
 * the page it is dropped into, which is exactly the case `contained` exists to
 * rule out everywhere else.
 *
 * `data-hoverable` is what the cursor looks for. It is on the cards rather than
 * baked into the cursor so you can mark anything else on the page the same way.
 */
export function PixelPlayground({
  cards,
  gridSize = 35,
  color = "#e4d9ff",
  hoverLabel = "View",
  className,
}: PixelPlaygroundProps) {
  // The canvas takes rgb channels, not a hex string.
  const rgb = hexToRgbList(color);

  return (
    <div className={cn("relative", className)}>
      <PixelTrail gridSize={gridSize} color={rgb} />
      <RecoilCursor
        target="[data-hoverable]"
        label={hoverLabel}
        color={color}
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.id} className="rounded-2xl">
            <div
              data-hoverable
              className="flex h-full cursor-none flex-col items-center rounded-2xl border-2 p-8 text-center transition-transform duration-300 hover:-translate-x-1 hover:-translate-y-1"
              style={{
                borderColor: color,
                background: "var(--craftly-pixel-surface, #252935)",
                boxShadow: `6px 6px 0 ${color}`,
              }}
            >
              {card.icon ? (
                <div className="mb-4 text-4xl">{card.icon}</div>
              ) : null}
              <h3 className="text-lg font-bold" style={{ color }}>
                {card.title}
              </h3>
              <p className="mt-2 text-sm opacity-80">{card.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** "#e4d9ff" → "228, 217, 255". Passes anything already in channel form through. */
function hexToRgbList(color: string) {
  const hex = color.trim().replace("#", "");
  if (hex.length !== 6) return color;
  const n = Number.parseInt(hex, 16);
  if (Number.isNaN(n)) return color;
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}
