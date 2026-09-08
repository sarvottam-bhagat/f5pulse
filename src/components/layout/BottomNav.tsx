"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/chat", label: "Chat", icon: "💬" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-40 flex justify-center pb-3 pt-2">
      <ul className="flex items-center gap-1 rounded-full bg-[#1d1d1f] p-1 shadow-lg">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`tap-target flex items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors ${
                  active ? "bg-white text-[#1d1d1f]" : "text-white/70"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
