"use client";

import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";

/**
 * A few narrow lowercase letters mixed into every pool, so a short word still
 * has something to cycle through.
 */
const FILLER = "aeorsnc";

/**
 * What a word scrambles through on its way in: its own letters, plus the filler.
 *
 * Drawing from the word's own letters rather than a fixed alphabet is what keeps
 * the line from lurching. A pool of capitals and symbols measures up to ~1.9x the
 * finished word in a proportional face; the same letters in a different order
 * hold the widest frame to about 1.1x.
 */
function poolFor(word: string) {
  const letters = new Set(
    (word.toLowerCase() + FILLER).replace(/[^a-z0-9]/g, ""),
  );
  return [...letters].join("") || FILLER;
}

export interface ScrambleTextProps {
  /** Words to cycle through, in order. A single word just scrambles in once. */
  words: string[];
  /** Seconds each word takes to resolve. */
  duration?: number;
  /** Seconds a resolved word is held before the next one starts. */
  hold?: number;
  /** Cycle back to the first word instead of stopping on the last. */
  loop?: boolean;
  /** Fired when the last word resolves. Never fires while `loop` is set. */
  onDone?: () => void;
  className?: string;
}

/**
 * Text that resolves out of noise, one word after another.
 *
 * Driven by `requestAnimationFrame` rather than a tween plugin, so it carries no
 * animation dependency at all. Characters resolve left to right: each index gets
 * a threshold along the word's progress, and until progress passes it the slot
 * shows a random character from the pool.
 *
 * The finished word is also rendered invisibly underneath, which reserves its
 * width — without it the box resizes on every frame and any centred layout
 * jitters. Under reduced motion the last word is shown immediately.
 */
export function ScrambleText({
  words,
  duration = 0.9,
  hold = 1.1,
  loop = false,
  onDone,
  className,
}: ScrambleTextProps) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState(() => words[0] ?? "");

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // The widest word reserves the box, so the layout never moves as words of
  // different lengths cycle through.
  const widest = words.reduce((a, b) => (b.length > a.length ? b : a), "");

  // Depend on the words' *content*, not the array's identity. Callers write
  // `words={["a", "b"]}` inline, which is a fresh array every render — keying
  // the effect on it would restart the animation on every frame it schedules,
  // which is an infinite render loop rather than a missed update.
  const wordsKey = JSON.stringify(words);

  // A changed word list invalidates the position in the old one.
  useEffect(() => {
    setIndex(0);
  }, [wordsKey]);

  useEffect(() => {
    const word = words[index];
    if (!word) return;

    if (reduced) {
      setDisplay(word);
      if (index === words.length - 1) onDoneRef.current?.();
      return;
    }

    const pool = poolFor(word);
    const chars = [...word];
    const start = performance.now();
    const ms = duration * 1000;

    let frame = 0;
    let holdTimer = 0;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);

      setDisplay(
        chars
          .map((char, i) => {
            if (char === " ") return " ";
            // Each slot resolves at its own point along the word, so the text
            // settles left to right rather than all at once.
            const threshold = (i + 1) / chars.length;
            if (p >= threshold) return char;
            return pool[Math.floor(Math.random() * pool.length)] ?? char;
          })
          .join(""),
      );

      if (p < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }

      setDisplay(word);

      const last = index === words.length - 1;
      if (last && !loop) {
        onDoneRef.current?.();
        return;
      }
      holdTimer = window.setTimeout(
        () => setIndex((n) => (n + 1) % words.length),
        hold * 1000,
      );
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(holdTimer);
    };
    // `words` is intentionally absent: `wordsKey` tracks its content, and
    // depending on the array itself would restart the effect every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, wordsKey, duration, hold, loop, reduced]);

  return (
    <span className={cn("relative inline-block", className)}>
      {/* Reserves the box. Hidden from both the eye and the a11y tree. */}
      <span aria-hidden="true" className="invisible block whitespace-pre">
        {widest}
      </span>
      <span
        aria-live="polite"
        className="absolute top-0 left-0 block w-full text-left whitespace-pre [will-change:contents]"
      >
        {display}
      </span>
    </span>
  );
}
