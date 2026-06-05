"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isPlatformOwner } from "@/lib/auth/platform-owner";
import { PRODUCT_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

const PRIMARY_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/register", label: "Sign up" },
  { href: "/login", label: "Log in" },
] as const;

const LEARN_LINKS = [
  { href: "/problem", label: "Problem" },
  { href: "/solution", label: "Solution" },
] as const;

export function Nav() {
  const pathname = usePathname();
  const [showConsole, setShowConsole] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        setShowConsole(false);
        return;
      }

      setShowConsole(await isPlatformOwner(user.id, supabase));
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  const links = showConsole
    ? [...PRIMARY_LINKS, { href: "/console", label: "Console" } as const]
    : PRIMARY_LINKS;

  return (
    <header className="nav-shell">
      <nav className="nav" aria-label="Main">
        <Link href="/" className="nav-brand">
          <span className="nav-dots" aria-hidden>
            <span />
            <span />
            <span />
          </span>
          <span className="nav-brand-text">
            <span className="nav-title">{PRODUCT_NAME}</span>
          </span>
        </Link>

        <div className="nav-scroll">
          <div className="nav-pills">
            {links.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={active ? "active" : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="nav-secondary" aria-label="Learn">
            <span className="nav-label">Learn</span>
            {LEARN_LINKS.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={active ? "active" : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}
