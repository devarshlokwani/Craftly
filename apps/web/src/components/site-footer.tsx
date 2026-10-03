import Link from "next/link";

const COLUMNS = [
  {
    heading: "Library",
    links: [
      { label: "Components", href: "/components" },
      { label: "Blocks", href: "/blocks" },
      { label: "Docs", href: "/docs" },
    ],
  },
  {
    heading: "Categories",
    links: [
      { label: "3D & WebGL", href: "/components" },
      { label: "Text animations", href: "/components" },
      { label: "Loaders", href: "/components" },
      { label: "SVG & drawing", href: "/components" },
    ],
  },
  {
    heading: "Project",
    links: [
      { label: "GitHub", href: "https://github.com/devarshlokwani/Craftly" },
      {
        label: "Issues",
        href: "https://github.com/devarshlokwani/Craftly/issues",
      },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-16 overflow-hidden border-t border-line bg-bg-raised">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <p className="font-display text-[15px] font-bold">Craftly</p>
          <p className="mt-2.5 max-w-xs text-[12.5px] leading-relaxed text-fg-muted">
            Animated React components and visual effects, built from scratch and
            given away as source you own.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.heading}>
            <p className="text-[12.5px] font-semibold">{column.heading}</p>
            <ul className="mt-3.5 space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="link-wipe text-[12.5px] text-fg-muted transition-colors hover:text-fg"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Oversized wordmark bleeding off the bottom edge, clipped by the
          footer's overflow. Decorative only, so it is hidden from the a11y tree. */}
      <div
        aria-hidden="true"
        className="pointer-events-none relative z-10 px-5 pb-6 text-center font-display text-[12vw] leading-[0.95] font-bold tracking-tighter text-fg/[0.05] select-none"
      >
        craftly
      </div>
    </footer>
  );
}
