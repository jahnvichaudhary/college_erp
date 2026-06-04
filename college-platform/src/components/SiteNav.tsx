"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Discover" },
  { href: "/compare", label: "Compare" },
  { href: "/predictor", label: "Predictor" },
  { href: "/discussions", label: "Discussions" },
];

export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="site-header">
      <div className="container nav">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark"><span>CC</span></span>
          CampusCompass
        </Link>
        <button className="nav-toggle" aria-label="Toggle menu" onClick={() => setOpen((o) => !o)}>
          ☰
        </button>
        <nav className={`nav-links ${open ? "open" : ""}`}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={isActive(l.href) ? "active" : ""}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
