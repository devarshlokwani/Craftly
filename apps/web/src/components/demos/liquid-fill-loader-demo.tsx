"use client";

import { useCallback, useEffect, useState } from "react";

import { LiquidFillLoader } from "@craftly/registry/components/liquid-fill-loader";

/** The "F" letterform from Foundr, the mark this effect was first built for. */
const F_GLYPH = "M25 17 h18 v6 h-12 v7 h10 v6 h-10 v12 h-6 z";

/**
 * The loader is a one-shot intro: it fades itself out and calls `onDone`. To
 * demo it we remount it on a key, with a beat of empty frame between runs so
 * the start of the fill is actually visible rather than blurring into the
 * previous cycle.
 */
export function LiquidFillLoaderDemo() {
  const [run, setRun] = useState(0);
  const [playing, setPlaying] = useState(true);

  const replay = useCallback(() => {
    setPlaying(false);
    setRun((n) => n + 1);
  }, []);

  useEffect(() => {
    if (playing) return;
    const id = window.setTimeout(() => setPlaying(true), 450);
    return () => window.clearTimeout(id);
  }, [playing, run]);

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#ECEAE3]">
      {playing ? (
        <LiquidFillLoader
          key={run}
          overlay={false}
          glyphPath={F_GLYPH}
          label="Foundr"
          liquidColor="#2D4A3E"
          liquidDeepColor="#1F3329"
          surfaceColor="#FAFAF7"
          onDone={replay}
        />
      ) : null}

      <button
        type="button"
        onClick={replay}
        className="absolute bottom-3 right-3 rounded-md border border-black/10 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-[#1F3329] opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
      >
        Replay
      </button>
    </div>
  );
}
