"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { nav, site } from "@/lib/site";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[75rem] items-center gap-8 px-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Image src="/logo.png" alt="" width={20} height={20} className="h-5 w-5" priority />
          <span className="text-[0.9375rem] font-medium tracking-[-0.01em] text-ink">
            OpenGraph AI
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[0.9375rem] font-medium transition-colors ${
                  active ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
          <a
            href={site.repo}
            target="_blank"
            rel="noreferrer"
            className="hidden text-[0.9375rem] font-medium text-muted transition-colors hover:text-ink sm:block"
          >
            GitHub
          </a>
          <Link href="/docs/quickstart" className="pill-primary hover:pill-primary-hover hidden sm:inline-flex">
            Get started
          </Link>
          <button
            type="button"
            className="pill-outline md:hidden"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-hairline bg-canvas md:hidden">
          <nav className="mx-auto flex max-w-[75rem] flex-col px-5 py-2 sm:px-6">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-hairline py-3.5 text-[0.9375rem] font-medium text-body last:border-0"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center justify-between gap-4 py-4">
              <ThemeToggle />
              <Link href="/docs/quickstart" className="pill-primary" onClick={() => setOpen(false)}>
                Get started
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
