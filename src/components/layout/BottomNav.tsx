"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/clients", label: "Clients" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed top-4 left-1/2 z-50 -translate-x-1/2"
    >
      <div className="navbar-blur flex items-center gap-2 rounded-full border border-[var(--color-navbar-border)] bg-[var(--color-navbar)] p-2 shadow-[0_12px_35px_rgba(29,29,31,0.08)] sm:gap-4 sm:px-3">
        <Link
          href="/"
          aria-label="F5 Pulse home"
          className="tap-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-hover"
        >
          <svg className="h-6 w-6" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle cx="16" cy="16" r="6.5" stroke="currentColor" strokeWidth="1.7" />
            <path d="M16 3v8M16 21v8M3 16h8M21 16h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <path d="m19.8 12.2-2.2 5.4-5.4 2.2 2.2-5.4 5.4-2.2Z" fill="currentColor" />
          </svg>
        </Link>
        <ul className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`tap-target flex items-center rounded-full px-5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-[#1d1d1f] text-white shadow-sm"
                    : "text-foreground hover:bg-surface-hover"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
        </ul>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-[11px] font-semibold tracking-[-0.02em] text-text-secondary"
          title="Karan, current user"
          aria-label="Karan, current user"
        >
          K
        </div>
      </div>
    </nav>
  );
}
