"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";

/** How many cards are visible behind the front one before the stack fades out. */
const VISIBLE = 3;
/** Vertical offset per card of depth, in px. */
const STEP_Y = 14;
/** How much each card of depth shrinks. */
const STEP_SCALE = 0.05;

/** Where the front card is thrown on its way to the back. */
const THROW = { x: 150, y: -70, rotation: 10, scale: 1.04 };

export interface StackedCarouselProps {
  items: { id: string; content: React.ReactNode }[];
  /** Accessible name for the group. */
  label?: string;
  /** Show the "1 / 6" counter. */
  counter?: boolean;
  /** Show the dot indicators under the stack. */
  dots?: boolean;
  className?: string;
}

/** The resting place of a card sitting `offset` behind the front one. */
function resting(offset: number, count: number) {
  const depth = Math.min(offset, VISIBLE);
  return {
    x: 0,
    y: depth * STEP_Y,
    rotation: 0,
    scale: 1 - depth * STEP_SCALE,
    opacity: offset > VISIBLE ? 0 : 1,
    zIndex: count - offset,
  };
}

/**
 * A stack of cards you page through, where the front one is thrown off and
 * lands at the back.
 *
 * Every card is absolutely positioned and the stack is built entirely from
 * transforms, so the order on screen owes nothing to the order in the DOM.
 *
 * The throw is the point. Advancing by cross-fading two cards says a value
 * changed; lifting the front card out, turning it, and dropping it behind the
 * others says *this one is done, here is the next* — and because it travels the
 * same arc every time, you learn the gesture after one press.
 *
 * Going back is the same motion in reverse: the incoming card is placed at the
 * thrown position and flies home, rather than the stack shuffling underneath
 * it.
 *
 * Needs `gsap`, loaded on demand. Under reduced motion the stack still pages,
 * it simply cuts. The resting layout is also written inline on first render, so
 * there is never a frame of raw unstacked DOM order before the animation
 * library arrives.
 */
export function StackedCarousel({
  items,
  label = "Features",
  counter = true,
  dots = true,
  className,
}: StackedCarouselProps) {
  const count = items.length;
  const [active, setActive] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const gsapRef = useRef<typeof import("gsap").gsap | null>(null);
  const busyRef = useRef(false);
  // The animations read the current index from a ref, because they are built
  // inside callbacks that would otherwise close over a stale one.
  const activeRef = useRef(0);
  activeRef.current = active;
  const reduced = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    void import("gsap").then(({ gsap }) => {
      if (!cancelled) gsapRef.current = gsap;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Puts every card where it belongs relative to `front`. */
  const layout = useCallback(
    (front: number, animate: boolean) => {
      const gsap = gsapRef.current;
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const offset = (i - front + count) % count;
        const to = resting(offset, count);
        if (!gsap) {
          // No gsap yet: place them with plain styles so the stack is correct
          // from the first paint.
          card.style.transform = `translate(${to.x}px, ${to.y}px) scale(${to.scale})`;
          card.style.opacity = String(to.opacity);
          card.style.zIndex = String(to.zIndex);
          return;
        }
        gsap.to(card, {
          ...to,
          duration: animate && !reduced ? 0.5 : 0,
          ease: "power2.out",
        });
      });
    },
    [count, reduced],
  );

  useEffect(() => {
    layout(active, false);
    // Only on mount and when the set changes — paging drives its own layout so
    // that the throw is not cut short by a re-layout landing on top of it.
  }, [layout, count]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = useCallback(() => {
    if (busyRef.current) return;
    const gsap = gsapRef.current;
    const front = cardRefs.current[activeRef.current];

    if (!gsap || reduced || !front) {
      const to = (activeRef.current + 1) % count;
      setActive(to);
      layout(to, false);
      return;
    }

    busyRef.current = true;
    gsap
      .timeline({
        onComplete: () => {
          busyRef.current = false;
        },
      })
      // Out and up, turning as it goes.
      .to(front, { ...THROW, duration: 0.34, ease: "power2.out" })
      // Then down onto the back of the stack. Dropped to the bottom of the
      // z-order as it starts back, so it passes behind the others rather than
      // sliding across their faces.
      .to(front, {
        x: 0,
        y: VISIBLE * STEP_Y,
        rotation: 0,
        scale: 1 - VISIBLE * STEP_SCALE,
        duration: 0.45,
        ease: "power2.inOut",
        onStart: () => gsap.set(front, { zIndex: 0 }),
      })
      // The rest of the stack comes forward while the thrown card is still in
      // the air, which is what keeps the two halves reading as one movement.
      .add(() => {
        const to = (activeRef.current + 1) % count;
        setActive(to);
        layout(to, true);
      }, 0.34);
  }, [count, layout, reduced]);

  const prev = useCallback(() => {
    if (busyRef.current) return;
    const gsap = gsapRef.current;
    const to = (activeRef.current - 1 + count) % count;
    const incoming = cardRefs.current[to];

    if (!gsap || reduced || !incoming) {
      setActive(to);
      layout(to, false);
      return;
    }

    busyRef.current = true;
    setActive(to);
    // Placed where the throw ends, then flown home: the same arc, run backwards.
    gsap.set(incoming, { ...THROW, zIndex: count, opacity: 1 });
    layout(to, true);
    gsap.to(incoming, {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      duration: 0.5,
      ease: "power2.out",
      onComplete: () => {
        busyRef.current = false;
      },
    });
  }, [count, layout, reduced]);

  return (
    <div
      className={cn("flex flex-col items-center gap-4", className)}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div className="flex w-full items-center justify-center gap-3 sm:gap-6">
        <StepButton onClick={prev} label="Previous" dir="prev" />

        <div className="relative h-[var(--card-h,280px)] w-[var(--card-w,240px)] shrink-0">
          {items.map((item, i) => {
            const initial = resting((i - 0 + count) % count, count);
            return (
              <div
                key={item.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                aria-hidden={i !== active}
                // Written once for the first paint; gsap owns it from then on.
                style={{
                  transform: `translate(0px, ${initial.y}px) scale(${initial.scale})`,
                  opacity: initial.opacity,
                  zIndex: initial.zIndex,
                }}
                className="absolute inset-0 origin-center rounded-2xl border border-line bg-bg-raised shadow-xl"
              >
                {item.content}
              </div>
            );
          })}

          {counter ? (
            <span className="absolute top-3 right-4 z-[99] font-mono text-[11px] text-fg-subtle">
              {active + 1} / {count}
            </span>
          ) : null}
        </div>

        <StepButton onClick={next} label="Next" dir="next" />
      </div>

      {dots ? (
        <div className="flex items-center gap-1.5">
          {items.map((item, i) => (
            <span
              key={item.id}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === active ? "w-5 bg-accent" : "w-1.5 bg-line-strong",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StepButton({
  onClick,
  label,
  dir,
}: {
  onClick: () => void;
  label: string;
  dir: "prev" | "next";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={dir === "prev" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
      </svg>
    </button>
  );
}
