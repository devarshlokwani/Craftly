import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

const NAV_LINKS = [
  { label: "Components", href: "/components" },
  { label: "Blocks", href: "/blocks" },
  { label: "Docs", href: "/docs" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg">
      <nav className="mx-auto flex h-[var(--nav-h)] max-w-6xl items-center gap-7 px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-display text-[14px] font-bold tracking-tight"
        >
          <CraftlyMark />
          Craftly
        </Link>

        <ul className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className="link-wipe text-[13px] text-fg-muted transition-colors hover:text-fg"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <div className="mr-1 hidden items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1 text-[12px] text-fg-subtle sm:flex">
            <SearchIcon />
            Search
            <kbd className="ml-3 rounded border border-line-strong px-1.5 py-0.5 font-mono text-[10px]">
              ⌘K
            </kbd>
          </div>

          <ThemeToggle />

          <a
            href="https://github.com/devarshlokwani/Craftly"
            target="_blank"
            rel="noreferrer"
            aria-label="Craftly on GitHub"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
          >
            <GitHubIcon />
          </a>
        </div>
      </nav>
    </header>
  );
}

function CraftlyMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[19px] w-[19px]"
      aria-hidden="true"
      fill="none"
    >
      <rect
        x="1.5"
        y="1.5"
        width="21"
        height="21"
        rx="6"
        stroke="var(--accent)"
        strokeWidth="2"
      />
      <path d="M4 14 q3.5 -3 7 0 t7 0 v6 h-14 z" fill="var(--accent)" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.6 4.6 18.6 5 18.6 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}
