"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "craftly-theme";

/**
 * Runs before first paint to stamp the stored choice onto <html>, so a user who
 * picked dark never sees a white flash while React boots. Kept as a string and
 * injected in the document head — a client component cannot run early enough.
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {}
})();
`;

export function ThemeToggle() {
  // Undefined until the effect reads the real value: the server has no way to
  // know the theme, so rendering a specific icon here would guarantee a
  // hydration mismatch on half of all loads.
  const [theme, setTheme] = useState<Theme | undefined>(undefined);

  useEffect(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "light" || attr === "dark") {
      setTheme(attr);
      return;
    }
    setTheme(
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light",
    );
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode and blocked storage: the choice just won't persist.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        theme
          ? `Switch to ${theme === "dark" ? "light" : "dark"} theme`
          : "Switch theme"
      }
      className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
    >
      {/* Both icons are rendered and cross-faded with CSS so the button is
          never empty on the first frame, before the theme is known. */}
      <span className="relative block h-3.5 w-3.5">
        <SunIcon
          className={`absolute inset-0 transition-opacity duration-200 ${
            theme === "dark" ? "opacity-100" : "opacity-0"
          }`}
        />
        <MoonIcon
          className={`absolute inset-0 transition-opacity duration-200 ${
            theme === "dark" ? "opacity-0" : "opacity-100"
          }`}
        />
      </span>
    </button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}
