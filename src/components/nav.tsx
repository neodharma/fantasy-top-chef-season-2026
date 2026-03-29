"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/standings", label: "Standings" },
  { href: "/episodes", label: "Episodes" },
  { href: "/scoring", label: "Scoring" },
  { href: "/results", label: "Draft Results" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
        <Link
          href="/standings"
          className="font-display text-base font-bold tracking-tight text-foreground"
        >
          Fantasy Top Chef
        </Link>
        <div className="flex items-center gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-mustard/15 text-mustard-dark"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
