/**
 * Categories a component is filed under.
 *
 * These are about *what the effect is*, not what it is built with — someone
 * browsing wants "text animations", not "things that use GSAP". Dependencies
 * are shown on the card instead.
 */
export type Collection = "3d" | "text" | "loaders" | "drawing" | "motion";

/**
 * What a registry entry *is*, which decides where it is listed.
 *
 * A `component` is one primitive with a props API — it does a single visual job
 * and composes into your own layout. A `block` is a whole composed section you
 * drop in and fill with copy: it owns its layout and usually several components.
 * The line that matters in practice: if it dictates page structure it is a
 * block; if it slots into yours it is a component.
 */
export type Kind = "component" | "block";

export interface ComponentMeta {
  slug: string;
  name: string;
  description: string;
  kind: Kind;
  collection: Collection;
  /** Lifts it into the Featured row at the top of the gallery. */
  featured?: boolean;
  /** Extra packages the consumer has to install. Empty means zero-dependency. */
  dependencies: string[];
  /** Where the effect was originally built, shown as provenance on the card. */
  origin: string;
  /**
   * A page of its own. Blocks that take over the viewport cannot be shown
   * honestly inside a card, so they link out to a full-width demo instead.
   */
  href?: string;
}

export const COLLECTIONS: Record<Collection, string> = {
  "3d": "3D & WebGL",
  text: "Text Animations",
  loaders: "Loaders",
  drawing: "SVG & Drawing",
  motion: "Motion",
};

/** Order the gallery renders categories in. Most striking first. */
export const COLLECTION_ORDER: Collection[] = [
  "3d",
  "text",
  "loaders",
  "drawing",
  "motion",
];

export const COMPONENTS: ComponentMeta[] = [
  {
    slug: "brain-scene",
    name: "Brain Scene",
    description:
      "A brain generated from maths rather than a model file, turning slowly and leaning toward your cursor.",
    kind: "component",
    collection: "3d",
    featured: true,
    dependencies: ["three"],
    origin: "Built for Memora's creator panel",
  },
  {
    slug: "liquid-fill-loader",
    name: "Liquid Fill Loader",
    description:
      "Liquid rises to fill a logo mark, the mark settles upright with a spring, and droplets scatter off it.",
    kind: "component",
    collection: "loaders",
    featured: true,
    dependencies: ["gsap"],
    origin: "Built for Foundr's intro screen",
  },
  {
    slug: "stroke-writer",
    name: "Stroke Writer",
    description:
      "SVG paths that write themselves in sequence, like a hand, with an optional settle layer that fills them in.",
    kind: "component",
    collection: "drawing",
    featured: true,
    dependencies: ["gsap"],
    origin: "Built for the portfolio's signature wall",
  },
  {
    slug: "scramble-text",
    name: "Scramble Text",
    description:
      "Words resolve out of noise, left to right, cycling one into the next. No animation dependency at all.",
    kind: "component",
    collection: "text",
    featured: true,
    dependencies: [],
    origin: "Built for the portfolio's intro sequence",
  },
  {
    slug: "flight-trail",
    name: "Flight Trail",
    description:
      "A paper plane flies a generated wave route on scroll, inking the dotted trail in behind it.",
    kind: "component",
    collection: "motion",
    featured: true,
    dependencies: ["gsap"],
    origin: "Built for the portfolio's experience section",
  },
  {
    slug: "fanned-deck",
    name: "Fanned Deck",
    description:
      "Cards held as a deck rather than laid out as a grid — it spreads from the middle under the pointer, and the card you are over squares up.",
    kind: "component",
    collection: "motion",
    dependencies: [],
    origin: "Built for Memora's formats section",
  },
  {
    slug: "brain-threads",
    name: "Brain with Threads",
    description:
      "The same generated brain, wrapped in a tangle of threads that draw themselves in and then drift.",
    kind: "component",
    collection: "3d",
    dependencies: ["three"],
    origin: "Built for Memora's hero",
  },
  {
    slug: "taped-card",
    name: "Taped Card",
    description:
      "Cream paper held down by a strip of washi tape, tilted as though placed by hand. No dependencies.",
    kind: "component",
    collection: "drawing",
    dependencies: [],
    origin: "Built for the portfolio's flight path",
  },
  {
    slug: "sketch-scenery",
    name: "Sketch Scenery",
    description:
      "A hand-inked countryside generated from a seed — ridges, hills, hamlets and windmills whose sails actually turn.",
    kind: "component",
    collection: "drawing",
    featured: true,
    dependencies: ["gsap"],
    origin: "Built for the portfolio's flight path",
  },
  {
    slug: "wipe-transition",
    name: "Wipe Transition",
    description:
      "A skewed panel sweeps across, hides the swap behind itself and keeps going. Router-agnostic.",
    kind: "component",
    collection: "motion",
    dependencies: ["gsap"],
    origin: "Built for the portfolio's route changes",
  },
  {
    slug: "stacked-carousel",
    name: "Stacked Carousel",
    description:
      "Page a stack of cards: the front one lifts out, turns, and drops in behind the others. Reverses on the way back.",
    kind: "component",
    collection: "motion",
    dependencies: ["gsap"],
    origin: "Built for Foundr's features section",
  },
  {
    slug: "flight-path",
    name: "Flight Path",
    description:
      "A pinned, scroll-driven journey across paper: the land is drawn, the route inks in behind the plane, and a card rides each checkpoint.",
    kind: "block",
    collection: "motion",
    dependencies: ["gsap"],
    origin: "Built for the portfolio's experience section",
    href: "/blocks/flight-path",
  },
  {
    slug: "gear-loader",
    name: "Gear Loader",
    description:
      "Two procedurally drawn gears that actually mesh — a 12:8 ratio, turning opposite ways so the teeth interleave.",
    kind: "component",
    collection: "loaders",
    dependencies: ["gsap"],
    origin: "Built for the portfolio's waiting states",
  },
];

export const COMPONENT_ITEMS = COMPONENTS.filter((c) => c.kind === "component");
export const BLOCK_ITEMS = COMPONENTS.filter((c) => c.kind === "block");
export const FEATURED = COMPONENT_ITEMS.filter((c) => c.featured);

/** Groups items by category, in `COLLECTION_ORDER`, skipping empty ones. */
export function byCollection(items: ComponentMeta[]) {
  return COLLECTION_ORDER.map(
    (collection) =>
      [collection, items.filter((i) => i.collection === collection)] as const,
  ).filter(([, list]) => list.length > 0);
}
