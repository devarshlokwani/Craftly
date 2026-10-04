"use client";

import { PixelPlayground } from "@craftly/registry/blocks/pixel-playground";

const CARDS = [
  {
    id: "data",
    icon: "📊",
    title: "Data Analysis",
    body: "Transform data into insights.",
  },
  {
    id: "automation",
    icon: "⚙️",
    title: "Automation",
    body: "Streamline the repetitive parts.",
  },
  {
    id: "graphic",
    icon: "🎨",
    title: "Graphic Design",
    body: "Create visuals people remember.",
  },
  {
    id: "uiux",
    icon: "✨",
    title: "UI/UX Design",
    body: "Design experiences, not screens.",
  },
  {
    id: "web",
    icon: "💻",
    title: "Web Design",
    body: "Build sites that load and last.",
  },
  {
    id: "seo",
    icon: "🚀",
    title: "SEO",
    body: "Be found by the people looking.",
  },
];

/**
 * The block on its own ground: the deep indigo it was designed against, so the
 * lavender trail and cursor read the way they were drawn to.
 */
export function PixelPlaygroundDemo() {
  return (
    <div
      className="px-6 py-20"
      style={{ background: "#1e2749", color: "#fafaff" }}
    >
      <div className="mx-auto max-w-6xl">
        <PixelPlayground cards={CARDS} />
      </div>
    </div>
  );
}
