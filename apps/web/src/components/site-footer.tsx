import Link from "next/link";

const COLUMNS = [
  {
    heading: "Components",
    links: [
      { label: "Browse all", href: "/components" },
      { label: "Loaders", href: "/components?collection=loaders" },
      { label: "WebGL", href: "/components?collection=webgl" },
      { label: "Text", href: "/components?collection=text" },
      { label: "Motion", href: "/components?collection=motion" },
    ],
  },
  {
    heading: "Docs",
    links: [
      { label: "Getting started", href: "/docs" },
      { label: "Installation", href: "/docs/installation" },
      { label: "Theming", href: "/docs/theming" },
      { label: "CLI", href: "/docs/cli" },
    ],
  },
  {
    heading: "Project",
    links: [
      { label: "GitHub", href: "https://github.com/devarshlokwani/craftly" },
      { label: "Changelog", href: "/changelog" },
      { label: "Contributing", href: "/docs/contributing" },
      { label: "License", href: "/license" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-32 overflow-hidden border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <p className="font-display text-lg font-bold">Craftly</p>
          <p className="mt-3 max-w-xs text-[13.5px] leading-relaxed text-fg-muted">
            Animated React components and visual effects, built from scratch and
            given away as source you own.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.heading}>
            <p className="text-[13px] font-semibold">{column.heading}</p>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-fg-muted transition-colors hover:text-fg"
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
        className="pointer-events-none select-none px-5 text-center font-display text-[18vw] font-bold leading-[0.78] tracking-tighter text-fg/[0.035]"
      >
        craftly
      </div>
    </footer>
  );
}
