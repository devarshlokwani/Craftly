"use client";

import {
  BrainSceneDemo,
  BrainThreadsDemo,
  FannedDeckDemo,
  FlightTrailDemo,
  GearLoaderDemo,
  LiquidFillLoaderDemo,
  ScrambleTextDemo,
  PixelTrailDemo,
  RecoilCursorDemo,
  SketchSceneryDemo,
  StackedCarouselDemo,
  StrokeWriterDemo,
  TapedCardDemo,
  WipeTransitionDemo,
} from "@/components/demos";

/**
 * Picks the demo for a slug.
 *
 * The switch lives in a client component on purpose. A server component cannot
 * index a record of client components and render the result — what it holds is
 * a module reference, not a component — so the lookup has to happen on this side
 * of the boundary. Server pages pass the slug and nothing else.
 */
export function ComponentDemo({ slug }: { slug: string }) {
  switch (slug) {
    case "liquid-fill-loader":
      return <LiquidFillLoaderDemo />;
    case "brain-scene":
      return <BrainSceneDemo />;
    case "brain-threads":
      return <BrainThreadsDemo />;
    case "flight-trail":
      return <FlightTrailDemo />;
    case "taped-card":
      return <TapedCardDemo />;
    case "fanned-deck":
      return <FannedDeckDemo />;
    case "sketch-scenery":
      return <SketchSceneryDemo />;
    case "wipe-transition":
      return <WipeTransitionDemo />;
    case "stacked-carousel":
      return <StackedCarouselDemo />;
    case "pixel-trail":
      return <PixelTrailDemo />;
    case "recoil-cursor":
      return <RecoilCursorDemo />;
    case "gear-loader":
      return <GearLoaderDemo />;
    case "scramble-text":
      return <ScrambleTextDemo />;
    case "stroke-writer":
      return <StrokeWriterDemo />;
    default:
      return null;
  }
}
