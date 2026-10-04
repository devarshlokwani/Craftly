"use client";

import { useRef, useState } from "react";

import { cn } from "../../lib/cn";

export interface FannedDeckProps {
  /** One entry per card. Keys come from `id`; `face` is rendered inside it. */
  cards: { id: string; face: React.ReactNode }[];
  /** Accessible name for the group. */
  label: string;
  /** Card width and height. Any CSS length — clamp() is encouraged. */
  cardWidth?: string;
  cardHeight?: string;
  /** Horizontal step between cards when the deck is open, and when closed. */
  openStep?: string;
  closedStep?: string;
  className?: string;
}

/**
 * A set of cards held as a deck rather than laid out as a grid.
 *
 * A grid of panels with a paragraph in each is a list of features, and nobody
 * reads the fifth one. A deck is something you handle: it sits closed, spreads
 * under the pointer, and whichever card you are over straightens up and comes
 * to the front.
 *
 * It is a fan, not a row. Every card is turned a little further than the one
 * inside it and rides a little lower — dropped by the *square* of its distance
 * from the middle, which is what puts the set on an arc rather than a slope.
 * Sliding upright rectangles apart is the version of this that looks like a
 * slideshow; the turn is what makes it look held.
 *
 * Three numbers do all of it and all three are written onto the element: how
 * far along a card sits, how far it is turned, and how far it has dropped.
 * React writes them, CSS tweens them, and there is no animation code here — so
 * it carries no dependencies at all.
 *
 * It spreads rather than snaps: the further out a card is, the longer it takes
 * to arrive, so the deck opens from the middle and the ends trail after it. One
 * duration for all of them made the whole thing move as a single object, which
 * is the one thing a deck of loose cards is not.
 */
export function FannedDeck({
  cards,
  label,
  cardWidth = "clamp(174px, 19vw, 264px)",
  cardHeight = "clamp(312px, 27vw, 368px)",
  openStep = "clamp(18px, 8.4vw, 148px)",
  closedStep = "clamp(10px, 1.1vw, 16px)",
  className,
}: FannedDeckProps) {
  /* Opens on the middle. A fan with the outermost card raised out of it is
     lopsided, and the card nobody can see past is the one at the end. */
  const [active, setActive] = useState(Math.floor(cards.length / 2));
  const [over, setOver] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const mid = (cards.length - 1) / 2;

  const move = (to: number) => {
    const next = (to + cards.length) % cards.length;
    setActive(next);
    cardRefs.current[next]?.focus();
  };

  /* Whichever card is under the pointer is the one at the front; the one
     clicked is where it returns to when the pointer goes. Pinning the front to
     the click alone meant running along the deck lifted nothing — the card you
     were actually pointing at stayed buried under its neighbour. */
  const front = over ?? active;
  const open = over !== null;

  return (
    <div
      style={
        {
          "--card-w": cardWidth,
          "--card-h": cardHeight,
          "--step": open ? openStep : closedStep,
        } as React.CSSProperties
      }
      /*
        `w-full` is load-bearing, not cosmetic. Every card is absolutely
        positioned, so this box has no intrinsic width — dropped into a flex or
        grid parent it shrink-wraps to zero, and `overflow-x: clip` on a
        zero-width box makes the cards unhittable. They still paint, so it looks
        fine and silently stops responding to the pointer, while keyboard focus
        carries on working.

        Clipped sideways and nowhere else: the fan is wider than a phone, and a
        page that scrolls sideways is a broken page.
      */
      className={cn("w-full overflow-x-clip", className)}
    >
      <div
        role="tablist"
        aria-label={label}
        onMouseLeave={() => setOver(null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setOver(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") move(active + 1);
          else if (event.key === "ArrowLeft") move(active - 1);
          else return;
          event.preventDefault();
        }}
        className="relative mx-auto h-[calc(var(--card-h)+5rem)] w-full"
      >
        {cards.map((card, i) => {
          const here = i === front;
          const n = i - mid;
          const out = Math.abs(n);

          // Turned further the further out it sits, dropped by the square of
          // that. The one at the front straightens and stands up out of the
          // fan: a card being looked at is a card square to you.
          const turn = n * (open ? 6 : 1.2);
          const arc = open ? out * out * 13 : 0;
          const lift = here ? (open ? -30 : -14) : 0;

          // The middle leaves first and the ends trail it; on the way back the
          // ends come home first. Cards that all set off together are one
          // object moving — cards that go in order are a deck being spread.
          const stagger = open ? out * 62 : (mid - out) * 52;

          return (
            <button
              key={card.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              role="tab"
              type="button"
              aria-selected={i === active}
              tabIndex={i === active ? 0 : -1}
              onMouseEnter={() => setOver(i)}
              onFocus={() => setOver(i)}
              onClick={() => setActive(i)}
              style={{
                zIndex: cards.length - Math.abs(i - front),
                transform: `translateX(calc(-50% + (${n}) * var(--step))) translateY(${arc + lift}px) rotate(${turn}deg)`,
                transitionDelay: `${stagger}ms`,
              }}
              className={cn(
                "absolute top-8 left-1/2 h-[var(--card-h)] w-[var(--card-w)]",
                "origin-bottom cursor-pointer rounded-xl text-left",
                // Eased so it carries a shade past where it is going and settles
                // back. A deck opens with some weight in it; a straight ease
                // looks like panes of glass sliding on a rail.
                "transition-transform duration-[620ms] ease-[cubic-bezier(.22,1.2,.36,1)]",
                "focus-visible:outline-2 focus-visible:outline-offset-4",
                "motion-reduce:transition-none",
              )}
            >
              {card.face}
            </button>
          );
        })}
      </div>
    </div>
  );
}
